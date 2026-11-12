import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";

interface StudentRow extends RowDataPacket {
  SRN: string;
  Email: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const srn =
      typeof body.srn === "string"
        ? body.srn.trim().toUpperCase()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    // Validate required fields.
    if (!srn || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    // Basic email validation.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Password validation.
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must not exceed 72 bytes.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // Verify the SRN and email against the official student directory.
    const [studentRows] = await pool.execute<StudentRow[]>(
      `SELECT SRN, Email
       FROM STUDENT
       WHERE SRN = ?
         AND LOWER(TRIM(Email)) = ?
       LIMIT 1`,
      [srn, email]
    );

    if (studentRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SRN and email do not match an official student record.",
        },
        { status: 404 }
      );
    }

    // Check whether this SRN or email already has an account.
    const [existingRows] = await pool.execute<RowDataPacket[]>(
      `SELECT User_ID
       FROM APP_USER
       WHERE SRN = ? OR Email = ?
       LIMIT 1`,
      [srn, email]
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account already exists for this SRN or email.",
        },
        { status: 409 }
      );
    }

    // Hash the password before storing it.
    const passwordHash = await hashPassword(password);

    // Create the student account.
    const [result] = await pool.execute(
      `INSERT INTO APP_USER
         (Email, Password_Hash, Role, SRN, Is_Active)
       VALUES (?, ?, 'STUDENT', ?, TRUE)`,
      [email, passwordHash, srn]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully. You can now log in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student signup failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create your account.",
      },
      { status: 500 }
    );
  }
}