
import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

import {
  createTeamRegistrationSignature,
  verifyTeamRegistrationSignature,
  type TeamRegistrationData,
} from "@/lib/signature";



interface RouteContext {
  params: Promise<{
    teamRecordId: string;
  }>;
}

interface TeamRow extends RowDataPacket {
  Team_Record_ID: number;
  Status: "REGISTERED_COMPLETE" | "REGISTERED_INCOMPLETE";
  Mentor_Code: string | null;
}

interface MemberRow extends RowDataPacket {
  SRN: string;
  Student_Name: string;
  Email: string;
  Department_Code: string;
}

interface CertificateRow extends RowDataPacket {
  Signature_ID: number;
  Team_Record_ID: number;
  Version_Number: number;
  Payload_Hash: string;
  Signature_Value: string;
  Signed_At: Date;
}

// POST: Issue a digitally signed certificate for a completed team.
export async function POST(
  _request: Request,
  context: RouteContext
) {
  let connection;

  try {
    // 1. Authenticate the user.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "COORDINATOR") {
      return NextResponse.json(
        {
          success: false,
          message: "Coordinator access only.",
        },
        { status: 403 }
      );
    }

    // 2. Validate the team ID.
    const { teamRecordId: rawId } = await context.params;

    const teamRecordId = Number(rawId);

    if (
      !Number.isSafeInteger(teamRecordId) ||
      teamRecordId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid team record ID.",
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    await connection.beginTransaction();

    // 3. Lock the team row while issuing its certificate.
    const [teamRows] = await connection.execute<TeamRow[]>(
      `SELECT
          Team_Record_ID,
          Status,
          Mentor_Code
       FROM TEAM
       WHERE Team_Record_ID = ?
       FOR UPDATE`,
      [teamRecordId]
    );

    if (teamRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Team not found.",
        },
        { status: 404 }
      );
    }

    const team = teamRows[0];

    // 4. Retrieve the actual registered members.
    const [memberRows] = await connection.execute<MemberRow[]>(
      `SELECT
          tm.SRN,
          tm.Student_Name,
          tm.Email,
          d.Department_Code
       FROM TEAM_MEMBER AS tm
       INNER JOIN DEPARTMENT AS d
          ON tm.Department_ID = d.Department_ID
       WHERE tm.Team_Record_ID = ?
       ORDER BY tm.SRN`,
      [teamRecordId]
    );

    const registration: TeamRegistrationData = {
      teamRecordId: Number(team.Team_Record_ID),
      status: team.Status,
      mentorCode: team.Mentor_Code,
      members: memberRows.map((member) => ({
        srn: member.SRN,
        studentName: member.Student_Name,
        email: member.Email,
        departmentCode: member.Department_Code,
      })),
    };

    // 5. Generate the SHA-256 digest and Ed25519 signature.
    // This also rejects incomplete registrations.
    const signed = createTeamRegistrationSignature(registration);

    // 6. Check whether the latest certificate is still valid.
    const [existingRows] =
      await connection.execute<CertificateRow[]>(
        `SELECT
            Signature_ID,
            Team_Record_ID,
            Version_Number,
            Payload_Hash,
            Signature_Value,
            Signed_At
         FROM TEAM_SIGNATURE
         WHERE Team_Record_ID = ?
         ORDER BY Version_Number DESC
         LIMIT 1`,
        [teamRecordId]
      );

    const existing = existingRows[0];

    if (
      existing &&
      existing.Payload_Hash === signed.payloadHash &&
      verifyTeamRegistrationSignature(
        registration,
        existing.Payload_Hash,
        existing.Signature_Value
      )
    ) {
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "An existing valid certificate was found.",
        certificate: {
          signatureId: existing.Signature_ID,
          teamRecordId: existing.Team_Record_ID,
          versionNumber: existing.Version_Number,
          payloadHash: existing.Payload_Hash,
          signatureValue: existing.Signature_Value,
          signedAt: existing.Signed_At,
        },
      });
    }

    // 7. Assign the next certificate version.
    const nextVersion = existing
      ? Number(existing.Version_Number) + 1
      : 1;

    // 8. Store the new digital certificate.
    const [insertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO TEAM_SIGNATURE (
          Team_Record_ID,
          Version_Number,
          Payload_Hash,
          Signature_Value
       )
       VALUES (?, ?, ?, ?)`,
      [
        teamRecordId,
        nextVersion,
        signed.payloadHash,
        signed.signatureValue,
      ]
    );

    // 9. Retrieve the inserted certificate.
    const [certificateRows] =
      await connection.execute<CertificateRow[]>(
        `SELECT
            Signature_ID,
            Team_Record_ID,
            Version_Number,
            Payload_Hash,
            Signature_Value,
            Signed_At
         FROM TEAM_SIGNATURE
         WHERE Signature_ID = ?`,
        [insertResult.insertId]
      );

    await connection.commit();

    const certificate = certificateRows[0];

    return NextResponse.json({
      success: true,
      message: "Digital registration certificate issued successfully.",
      certificate: {
        signatureId: certificate.Signature_ID,
        teamRecordId: certificate.Team_Record_ID,
        versionNumber: certificate.Version_Number,
        payloadHash: certificate.Payload_Hash,
        signatureValue: certificate.Signature_Value,
        signedAt: certificate.Signed_At,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Certificate issuance rollback error:",
          rollbackError
        );
      }
    }

    console.error("Certificate issuance error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to issue the certificate.";

    if (
      message.includes("completed team") ||
      message.includes("four members")
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to issue the digital certificate.",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
