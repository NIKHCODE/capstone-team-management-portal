
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface StudentRow extends RowDataPacket {
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string | null;
  Department_ID: number;
}

interface MentorRow extends RowDataPacket {
  Mentor_Code: string;
}

interface TeamStatusRow extends RowDataPacket {
  Team_Record_ID: number;
  Status: string;
}

interface RegistrationMember {
  srn: string;
}

export async function POST(request: Request) {
  let connection;
  let transactionStarted = false;

  try {
    // 1. Authenticate the current user.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to register a team.",
        },
        { status: 401 }
      );
    }

    // 2. Only students can register teams.
    if (user.role !== "STUDENT" || !user.srn) {
      return NextResponse.json(
        {
          success: false,
          message: "Only authenticated students can register teams.",
        },
        { status: 403 }
      );
    }

    // 3. Read and validate the request body.
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const rawMembers = body.members;

    if (!Array.isArray(rawMembers)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid members array.",
        },
        { status: 400 }
      );
    }

    if (rawMembers.length < 1 || rawMembers.length > 4) {
      return NextResponse.json(
        {
          success: false,
          message: "A team must contain between one and four members.",
        },
        { status: 400 }
      );
    }

    // 4. Validate and normalize submitted SRNs.
    const members: RegistrationMember[] = [];

    for (const member of rawMembers) {
      if (
        typeof member !== "object" ||
        member === null ||
        !("srn" in member) ||
        typeof member.srn !== "string" ||
        !member.srn.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Every team member must have a valid SRN.",
          },
          { status: 400 }
        );
      }

      members.push({
        srn: member.srn.trim().toUpperCase(),
      });
    }

    const submittedSrns = members.map((member) => member.srn);

    // 5. Reject duplicate SRNs.
    if (new Set(submittedSrns).size !== submittedSrns.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate SRNs are not allowed.",
        },
        { status: 400 }
      );
    }

    // 6. The authenticated student must be part of the team.
    if (!submittedSrns.includes(user.srn.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          message: "Your own SRN must be included in the team.",
        },
        { status: 403 }
      );
    }

    // 7. Validate optional mentor selection.
    let mentorCode: string | null = null;

    if (
      body.mentorCode !== undefined &&
      body.mentorCode !== null &&
      body.mentorCode !== ""
    ) {
      if (
        typeof body.mentorCode !== "string" ||
        !body.mentorCode.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid mentor selection.",
          },
          { status: 400 }
        );
      }

      mentorCode = body.mentorCode.trim().toUpperCase();
    }

    // 8. Start a database transaction.
    connection = await pool.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // 9. Retrieve official student information.
    // Never trust student names, emails or departments from the browser.
    const placeholders = submittedSrns.map(() => "?").join(", ");

    const [studentRows] = await connection.execute<StudentRow[]>(
      `SELECT
         SRN,
         Student_Name,
         Email,
         Phone,
         Department_ID
       FROM STUDENT
       WHERE SRN IN (${placeholders})
       FOR UPDATE`,
      submittedSrns
    );

    const officialStudentMap = new Map(
      studentRows.map((student) => [
        student.SRN.toUpperCase(),
        student,
      ])
    );

    // 10. Reject unknown SRNs.
    const unknownSrns = submittedSrns.filter(
      (srn) => !officialStudentMap.has(srn)
    );

    if (unknownSrns.length > 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message:
            "One or more SRNs were not found in the official student directory.",
          unknownSrns,
        },
        { status: 404 }
      );
    }

    // 11. Check that all students have the required phone information.
    const studentsWithoutPhone = submittedSrns.filter((srn) => {
      const student = officialStudentMap.get(srn);
      return !student?.Phone?.trim();
    });

    if (studentsWithoutPhone.length > 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message:
            "Official student records are missing phone numbers.",
          studentsWithoutPhone,
        },
        { status: 400 }
      );
    }

    // 12. Validate the selected mentor, if supplied.
    if (mentorCode) {
      const [mentorRows] = await connection.execute<MentorRow[]>(
        `SELECT Mentor_Code
         FROM MENTOR
         WHERE Mentor_Code = ?
           AND Is_Active = TRUE
         FOR UPDATE`,
        [mentorCode]
      );

      if (mentorRows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: "Selected mentor does not exist or is inactive.",
          },
          { status: 400 }
        );
      }
    }

    // 13. Create the team record.
    const [teamResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO TEAM (Mentor_Code)
       VALUES (?)`,
      [mentorCode]
    );

    const teamRecordId = teamResult.insertId;

    // 14. Insert all official team member records.
    for (const srn of submittedSrns) {
      const student = officialStudentMap.get(srn)!;

      await connection.execute(
        `INSERT INTO TEAM_MEMBER
           (
             Team_Record_ID,
             SRN,
             Student_Name,
             Email,
             Phone,
             Department_ID
           )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          teamRecordId,
          student.SRN,
          student.Student_Name,
          student.Email,
          student.Phone,
          student.Department_ID,
        ]
      );
    }

    // 15. Retrieve the final status calculated by database triggers.
    const [statusRows] = await connection.execute<TeamStatusRow[]>(
      `SELECT Team_Record_ID, Status
       FROM TEAM
       WHERE Team_Record_ID = ?`,
      [teamRecordId]
    );

    if (statusRows.length === 0) {
      throw new Error("Team registration could not be verified.");
    }

    const finalStatus = statusRows[0].Status;

    // 16. Commit only after every operation succeeds.
    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Team registered successfully.",
        team: {
          teamRecordId,
          status: finalStatus,
          mentorCode,
          memberCount: submittedSrns.length,
          members: submittedSrns,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    const dbError = error as { code?: string };

    console.error("Team registration failed:", error);

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more students already belong to another team.",
        },
        { status: 409 }
      );
    }

    if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student, department or mentor reference.",
        },
        { status: 400 }
      );
    }

    if (dbError.code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json(
        {
          success: false,
          message:
            "The database rejected this registration. Check the team-size constraints.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to register the team. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
