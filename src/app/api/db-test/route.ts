import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const connection = await pool.getConnection();

    try {
      const [tables] = await connection.query(
        `SELECT TABLE_NAME
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME`
      );

      const [triggers] = await connection.query(
        `SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
         FROM INFORMATION_SCHEMA.TRIGGERS
         WHERE TRIGGER_SCHEMA = DATABASE()
         ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME`
      );

      return NextResponse.json({
        success: true,
        database: process.env.DB_NAME,
        tables,
        triggers,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not connect to the database. Check the VS Code terminal for details.",
      },
      { status: 500 }
    );
  }
}