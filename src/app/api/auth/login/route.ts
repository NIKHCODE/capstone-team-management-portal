
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  type UserRole,
} from "@/lib/auth";

interface UserRow extends RowDataPacket {
  User_ID: number;
  Email: string;
  Password_Hash: string;
  Role: UserRole;
  SRN: string | null;
  Is_Active: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "SRN/email and password are required.",
        },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.toLowerCase();

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT
         User_ID,
         Email,
         Password_Hash,
         Role,
         SRN,
         Is_Active
       FROM APP_USER
       WHERE LOWER(Email) = ?
          OR UPPER(SRN) = ?
       LIMIT 1`,
      [normalizedIdentifier, identifier.toUpperCase()]
    );

    if (
      rows.length === 0 ||
      !rows[0].Is_Active ||
      !(await verifyPassword(password, rows[0].Password_Hash))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials or inactive account.",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    const token = await createSession(user.User_ID);

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        userId: user.User_ID,
        email: user.Email,
        role: user.Role,
        srn: user.SRN,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process login.",
      },
      { status: 500 }
    );
  }
}
