
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import pool from "@/lib/db";

import {
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

// GET: Publicly verify a team's digital registration certificate.
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { searchParams } = new URL(request.url);
    const requestedVersion = searchParams.get("version");

    // Retrieve the requested certificate, or latest version by default.
    let certificateRows: CertificateRow[];

    if (requestedVersion !== null) {
      const version = Number(requestedVersion);

      if (!Number.isSafeInteger(version) || version <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid certificate version.",
          },
          { status: 400 }
        );
      }

      const [rows] = await pool.execute<CertificateRow[]>(
        `SELECT
            Signature_ID,
            Team_Record_ID,
            Version_Number,
            Payload_Hash,
            Signature_Value,
            Signed_At
         FROM TEAM_SIGNATURE
         WHERE Team_Record_ID = ?
           AND Version_Number = ?
         LIMIT 1`,
        [teamRecordId, version]
      );

      certificateRows = rows;
    } else {
      const [rows] = await pool.execute<CertificateRow[]>(
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

      certificateRows = rows;
    }

    if (certificateRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "No digital certificate found for this team.",
        },
        { status: 404 }
      );
    }

    const certificate = certificateRows[0];

    // Retrieve the team's current registration data.
    const [teamRows] = await pool.execute<TeamRow[]>(
      `SELECT
          Team_Record_ID,
          Status,
          Mentor_Code
       FROM TEAM
       WHERE Team_Record_ID = ?
       LIMIT 1`,
      [teamRecordId]
    );

    if (teamRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "The registered team no longer exists.",
        },
        { status: 404 }
      );
    }

    const team = teamRows[0];

    const [memberRows] = await pool.execute<MemberRow[]>(
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

    // Verify the current registration against the stored signature.
    const valid = verifyTeamRegistrationSignature(
      registration,
      certificate.Payload_Hash,
      certificate.Signature_Value
    );

    return NextResponse.json({
      success: true,
      valid,
      message: valid
        ? "Digital signature verified. Registration data is authentic and unchanged."
        : "Signature verification failed. Registration data may have been modified.",
      certificate: {
        signatureId: certificate.Signature_ID,
        teamRecordId: certificate.Team_Record_ID,
        versionNumber: certificate.Version_Number,
        payloadHash: certificate.Payload_Hash,
        signedAt: certificate.Signed_At,
      },
      registration: {
        status: registration.status,
        mentorCode: registration.mentorCode,
        memberCount: registration.members.length,
        members: registration.members,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "Unable to verify the digital certificate.",
      },
      { status: 500 }
    );
  }
}
