import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export type UserRole = "STUDENT" | "COORDINATOR";

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
  srn: string | null;
}

interface SessionRow extends RowDataPacket {
  User_ID: number;
  Email: string;
  Role: UserRole;
  SRN: string | null;
}

const SESSION_COOKIE_NAME = "capstone_session";
const SESSION_DURATION_HOURS = 8;

// Hash a password before storing it in MySQL.
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare a login password with its stored hash.
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// Store only the SHA-256 hash of a session token in MySQL.
function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Generate a random session token and persist its hash.
export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  await pool.execute(
    `INSERT INTO APP_SESSION (User_ID, Token_Hash, Expires_At)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [userId, tokenHash, SESSION_DURATION_HOURS]
  );

  return token;
}

// Set the session cookie in the response.
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
}

// Retrieve the currently authenticated user, if any.
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const [rows] = await pool.execute<SessionRow[]>(
    `SELECT
       u.User_ID,
       u.Email,
       u.Role,
       u.SRN
     FROM APP_SESSION AS s
     INNER JOIN APP_USER AS u
       ON s.User_ID = u.User_ID
     WHERE s.Token_Hash = ?
       AND s.Expires_At > NOW()
       AND u.Is_Active = TRUE
     LIMIT 1`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];

  return {
    userId: user.User_ID,
    email: user.Email,
    role: user.Role,
    srn: user.SRN,
  };
}

// Check whether the current user has one of the permitted roles.
export async function hasRole(
  allowedRoles: UserRole[]
): Promise<boolean> {
  const user = await getCurrentUser();

  return user !== null && allowedRoles.includes(user.role);
}

// Delete the current session from MySQL and clear its cookie.
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await pool.execute(
      "DELETE FROM APP_SESSION WHERE Token_Hash = ?",
      [tokenHash]
    );
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}