import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
         m.Mentor_Code,
         m.Mentor_Name,
         m.Designation,
         d.Department_Code,
         d.Department_Name
       FROM MENTOR AS m
       INNER JOIN DEPARTMENT AS d
         ON m.Department_ID = d.Department_ID
       WHERE m.Is_Active = TRUE
       ORDER BY m.Mentor_Name ASC`
    );

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      mentors: rows,
    });
  } catch (error) {
    console.error("Failed to retrieve mentors:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not retrieve mentors.",
      },
      { status: 500 }
    );
  }
}