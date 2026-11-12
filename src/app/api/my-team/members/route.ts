
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface TeamRow extends RowDataPacket {
  Team_Record_ID: number;
}

interface StudentRow extends RowDataPacket {
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string | null;
  Department_ID: number;
}

interface CountRow extends RowDataPacket {
  Member_Count: number;
}

interface StatusRow extends RowDataPacket {
  Status: "REGISTERED_INCOMPLETE" | "REGISTERED_COMPLETE";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Please log in first." },
      { status: 401 }
    );
  }

  if (user.role !== "STUDENT" || !user.srn) {
    return NextResponse.json(
      { success: false, message: "Only students can add team members." },
      { status: 403 }
    );
  }

  let body: { srn?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const newSrn =
    typeof body.srn === "string" ? body.srn.trim().toUpperCase() : "";

  if (!newSrn) {
    return NextResponse.json(
      { success: false, message: "Enter the SRN of the student to add." },
      { status: 400 }
    );
  }

  if (newSrn === user.srn.toUpperCase()) {
    return NextResponse.json(
      { success: false, message: "You are already a member of this team." },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the team row so concurrent additions cannot exceed four members.
    const [teamRows] = await connection.execute<TeamRow[]>(
      `SELECT t.Team_Record_ID
       FROM TEAM AS t
       INNER JOIN TEAM_MEMBER AS tm
         ON tm.Team_Record_ID = t.Team_Record_ID
       WHERE tm.SRN = ?
       FOR UPDATE`,
      [user.srn]
    );

    if (teamRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "You are not registered in a team." },
        { status: 404 }
      );
    }

    const teamRecordId = teamRows[0].Team_Record_ID;

    // Check current team size after obtaining the team lock.
    const [countRows] = await connection.execute<CountRow[]>(
      `SELECT COUNT(*) AS Member_Count
       FROM TEAM_MEMBER
       WHERE Team_Record_ID = ?`,
      [teamRecordId]
    );

    const memberCount = Number(countRows[0].Member_Count);

    if (memberCount >= 4) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "A team cannot have more than four members." },
        { status: 409 }
      );
    }

    // Retrieve authoritative student details from the official student table.
    const [studentRows] = await connection.execute<StudentRow[]>(
      `SELECT
         SRN,
         Student_Name,
         Email,
         Phone,
         Department_ID
       FROM STUDENT
       WHERE UPPER(SRN) = ?
       LIMIT 1`,
      [newSrn]
    );

    if (studentRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "This SRN does not exist in the student database." },
        { status: 404 }
      );
    }

    const student = studentRows[0];

    if (!student.Phone) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "The student's official phone number is missing. Contact the coordinator." },
        { status: 400 }
      );
    }

    // Insert official details. The unique SRN constraint prevents membership in two teams.
    await connection.execute<ResultSetHeader>(
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

    // Read the status recalculated by the existing database trigger.
    const [statusRows] = await connection.execute<StatusRow[]>(
      `SELECT Status
       FROM TEAM
       WHERE Team_Record_ID = ?`,
      [teamRecordId]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Student added to the team successfully.",
        teamRecordId,
        memberCount: memberCount + 1,
        status: statusRows[0]?.Status ?? "REGISTERED_INCOMPLETE",
        addedStudent: {
          srn: student.SRN,
          name: student.Student_Name,
          email: student.Email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    await connection.rollback();

    const dbError = error as { code?: string; errno?: number };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "This student is already registered in a team." },
        { status: 409 }
      );
    }

    if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        { success: false, message: "The student or department record is invalid." },
        { status: 400 }
      );
    }

    if (dbError.code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json(
        { success: false, message: "The database rejected this addition. Check the team member limit." },
        { status: 400 }
      );
    }

    console.error("Add team member error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add the student to the team." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
