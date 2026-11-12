import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

interface StudentRow extends RowDataPacket {
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string | null;
  Department_ID: number;
  Department_Code: string;
  Department_Name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const srn = searchParams.get("srn")?.trim();

  if (!srn) {
    return NextResponse.json(
      { success: false, message: "Please provide a student SRN." },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.execute<StudentRow[]>(
      `SELECT
         s.SRN,
         s.Student_Name,
         s.Email,
         s.Phone,
         s.Department_ID,
         d.Department_Code,
         d.Department_Name
       FROM STUDENT AS s
       INNER JOIN DEPARTMENT AS d
         ON s.Department_ID = d.Department_ID
       WHERE s.SRN = ?
       LIMIT 1`,
      [srn]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "SRN not found in the official student directory.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: rows[0],
    });
  } catch (error) {
    console.error("Student lookup failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve student details." },
      { status: 500 }
    );
  }
}