
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getRedis } from "@/lib/redis";

interface TeamRow extends RowDataPacket {
  Team_Record_ID: number;
  Status: "REGISTERED_INCOMPLETE" | "REGISTERED_COMPLETE";
  Mentor_Code: string | null;
  Mentor_Name: string | null;
  Mentor_Email: string | null;
  Member_Count: number;
}

interface MemberRow extends RowDataPacket {
  Team_Record_ID: number;
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string;
  Department_Code: string;
  Department_Name: string;
}

interface MentorRow extends RowDataPacket {
  Mentor_Code: string;
}

// Invalidate cached team details for all students.
// Redis failure must not undo a successful MySQL operation.
async function invalidateStudentTeamCache() {
  try {
    const redis = await getRedis();

    for await (const key of redis.scanIterator({
      MATCH: "student:team:*",
      COUNT: 100,
    })) {
      await redis.del(key);
    }

    console.log("Redis student team cache invalidated.");
  } catch (error) {
    console.error("Redis cache invalidation failed:", error);
  }
}

// GET: Retrieve all teams and their members for the coordinator.
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "COORDINATOR") {
      return NextResponse.json(
        { success: false, message: "Coordinator access only." },
        { status: 403 }
      );
    }

    const [teamRows] = await pool.execute<TeamRow[]>(
      `SELECT
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name,
         m.Email AS Mentor_Email,
         COUNT(tm.SRN) AS Member_Count
       FROM TEAM AS t
       LEFT JOIN MENTOR AS m
         ON t.Mentor_Code = m.Mentor_Code
       LEFT JOIN TEAM_MEMBER AS tm
         ON t.Team_Record_ID = tm.Team_Record_ID
       GROUP BY
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name,
         m.Email
       ORDER BY t.Team_Record_ID DESC`
    );

    const [memberRows] = await pool.execute<MemberRow[]>(
      `SELECT
         tm.Team_Record_ID,
         tm.SRN,
         tm.Student_Name,
         tm.Email,
         tm.Phone,
         d.Department_Code,
         d.Department_Name
       FROM TEAM_MEMBER AS tm
       INNER JOIN DEPARTMENT AS d
         ON tm.Department_ID = d.Department_ID
       ORDER BY tm.Team_Record_ID, tm.SRN`
    );

    const membersByTeam: Record<number, MemberRow[]> = {};

    for (const member of memberRows) {
      if (!membersByTeam[member.Team_Record_ID]) {
        membersByTeam[member.Team_Record_ID] = [];
      }

      membersByTeam[member.Team_Record_ID].push(member);
    }

    const teams = teamRows.map((team) => ({
      teamRecordId: team.Team_Record_ID,
      status: team.Status,
      mentorCode: team.Mentor_Code,
      mentorName: team.Mentor_Name,
      mentorEmail: team.Mentor_Email,
      memberCount: Number(team.Member_Count),
      members: (membersByTeam[team.Team_Record_ID] || []).map(
        (member) => ({
          srn: member.SRN,
          studentName: member.Student_Name,
          email: member.Email,
          phone: member.Phone,
          departmentCode: member.Department_Code,
          departmentName: member.Department_Name,
        })
      ),
    }));

    const statistics = {
      totalTeams: teams.length,
      completeTeams: teams.filter(
        (team) => team.status === "REGISTERED_COMPLETE"
      ).length,
      incompleteTeams: teams.filter(
        (team) => team.status === "REGISTERED_INCOMPLETE"
      ).length,
      unassignedMentors: teams.filter(
        (team) => !team.mentorCode
      ).length,
    };

    return NextResponse.json({
      success: true,
      statistics,
      teams,
    });
  } catch (error) {
    console.error("Coordinator teams GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve team registrations.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Assign, change, or unassign a team's mentor.
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "COORDINATOR") {
      return NextResponse.json(
        { success: false, message: "Coordinator access only." },
        { status: 403 }
      );
    }

    let body: {
      teamRecordId?: unknown;
      mentorCode?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { teamRecordId, mentorCode } = body;

    if (
      typeof teamRecordId !== "number" ||
      !Number.isSafeInteger(teamRecordId) ||
      teamRecordId <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid team record ID." },
        { status: 400 }
      );
    }

    if (
      mentorCode !== null &&
      (typeof mentorCode !== "string" || !mentorCode.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Provide a valid mentor code or null to unassign." },
        { status: 400 }
      );
    }

    const normalizedMentorCode =
      typeof mentorCode === "string"
        ? mentorCode.trim().toUpperCase()
        : null;

    const [teamRows] = await pool.execute<RowDataPacket[]>(
      `SELECT Team_Record_ID
       FROM TEAM
       WHERE Team_Record_ID = ?
       LIMIT 1`,
      [teamRecordId]
    );

    if (teamRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    if (normalizedMentorCode !== null) {
      const [mentorRows] = await pool.execute<MentorRow[]>(
        `SELECT Mentor_Code
         FROM MENTOR
         WHERE Mentor_Code = ?
           AND Is_Active = TRUE
         LIMIT 1`,
        [normalizedMentorCode]
      );

      if (mentorRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Mentor does not exist or is inactive.",
          },
          { status: 400 }
        );
      }
    }

    await pool.execute(
      `UPDATE TEAM
       SET Mentor_Code = ?
       WHERE Team_Record_ID = ?`,
      [normalizedMentorCode, teamRecordId]
    );

    const [updatedRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name,
         COUNT(tm.SRN) AS Member_Count
       FROM TEAM AS t
       LEFT JOIN MENTOR AS m
         ON t.Mentor_Code = m.Mentor_Code
       LEFT JOIN TEAM_MEMBER AS tm
         ON t.Team_Record_ID = tm.Team_Record_ID
       WHERE t.Team_Record_ID = ?
       GROUP BY
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name`,
      [teamRecordId]
    );

    const updatedTeam = updatedRows[0];

    // Clear cached student data after the successful MySQL update.
    await invalidateStudentTeamCache();

    return NextResponse.json({
      success: true,
      message: normalizedMentorCode
        ? "Mentor assigned successfully."
        : "Mentor unassigned successfully.",
      team: {
        teamRecordId: updatedTeam.Team_Record_ID,
        status: updatedTeam.Status,
        mentorCode: updatedTeam.Mentor_Code,
        mentorName: updatedTeam.Mentor_Name,
        memberCount: Number(updatedTeam.Member_Count),
      },
    });
  } catch (error) {
    console.error("Coordinator mentor assignment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update mentor assignment.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove an individual student from a team.
export async function DELETE(request: Request) {
  let connection;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "COORDINATOR") {
      return NextResponse.json(
        { success: false, message: "Coordinator access only." },
        { status: 403 }
      );
    }

    let body: {
      teamRecordId?: unknown;
      srn?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { teamRecordId, srn } = body;

    if (
      typeof teamRecordId !== "number" ||
      !Number.isSafeInteger(teamRecordId) ||
      teamRecordId <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid team record ID." },
        { status: 400 }
      );
    }

    if (typeof srn !== "string" || !srn.trim()) {
      return NextResponse.json(
        { success: false, message: "A valid student SRN is required." },
        { status: 400 }
      );
    }

    const normalizedSrn = srn.trim().toUpperCase();

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [teamRows] = await connection.execute<RowDataPacket[]>(
      `SELECT Team_Record_ID
       FROM TEAM
       WHERE Team_Record_ID = ?
       FOR UPDATE`,
      [teamRecordId]
    );

    if (teamRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    const [memberRows] = await connection.execute<RowDataPacket[]>(
      `SELECT SRN
       FROM TEAM_MEMBER
       WHERE Team_Record_ID = ?
         AND SRN = ?
       LIMIT 1`,
      [teamRecordId, normalizedSrn]
    );

    if (memberRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Student is not a member of this team." },
        { status: 404 }
      );
    }

    await connection.execute(
      `DELETE FROM TEAM_MEMBER
       WHERE Team_Record_ID = ?
         AND SRN = ?`,
      [teamRecordId, normalizedSrn]
    );

    // The existing AFTER DELETE trigger recalculates TEAM.Status.
    const [updatedRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
         t.Team_Record_ID,
         t.Status,
         COUNT(tm.SRN) AS Member_Count
       FROM TEAM AS t
       LEFT JOIN TEAM_MEMBER AS tm
         ON t.Team_Record_ID = tm.Team_Record_ID
       WHERE t.Team_Record_ID = ?
       GROUP BY t.Team_Record_ID, t.Status`,
      [teamRecordId]
    );

    const updatedTeam = updatedRows[0];

    await connection.commit();

    // Invalidate only after the transaction successfully commits.
    await invalidateStudentTeamCache();

    return NextResponse.json({
      success: true,
      message: "Student removed from the team successfully.",
      team: {
        teamRecordId: updatedTeam.Team_Record_ID,
        status: updatedTeam.Status,
        memberCount: Number(updatedTeam.Member_Count),
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Member removal rollback error:", rollbackError);
      }
    }

    console.error("Coordinator member removal error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to remove the student from the team.",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
