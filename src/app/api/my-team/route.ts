
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getRedis } from "@/lib/redis";

interface TeamRow extends RowDataPacket {
  Team_Record_ID: number;
  Status: string;
  Mentor_Code: string | null;
  Mentor_Name: string | null;
  Member_Count: number;
}

interface MemberRow extends RowDataPacket {
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string;
  Department_Code: string;
  Department_Name: string;
}

const CACHE_TTL = 300;

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    if (user.role !== "STUDENT" || !user.srn) {
      return NextResponse.json(
        { success: false, message: "Student access only." },
        { status: 403 }
      );
    }

    const cacheKey = `student:team:${user.srn}`;

    // Try Redis first. If unavailable, continue using MySQL.
    try {
      const redis = await getRedis();
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log("Redis cache HIT:", cacheKey);

        return NextResponse.json(JSON.parse(cachedData), {
          headers: { "Cache-Control": "no-store" },
        });
      }

      console.log("Redis cache MISS:", cacheKey);
    } catch (redisError) {
      console.error("Redis read failed; using MySQL:", redisError);
    }

    // Fetch team details from MySQL.
    const [teamRows] = await pool.execute<TeamRow[]>(
      `SELECT
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name,
         COUNT(tm.SRN) AS Member_Count
       FROM TEAM_MEMBER AS own
       INNER JOIN TEAM AS t
         ON own.Team_Record_ID = t.Team_Record_ID
       LEFT JOIN MENTOR AS m
         ON t.Mentor_Code = m.Mentor_Code
       LEFT JOIN TEAM_MEMBER AS tm
         ON t.Team_Record_ID = tm.Team_Record_ID
       WHERE own.SRN = ?
       GROUP BY
         t.Team_Record_ID,
         t.Status,
         t.Mentor_Code,
         m.Mentor_Name
       LIMIT 1`,
      [user.srn]
    );

    let responseData;

    if (teamRows.length === 0) {
      responseData = {
        success: true,
        hasTeam: false,
        message: "You are not currently part of a registered team.",
      };
    } else {
      const team = teamRows[0];

      const [members] = await pool.execute<MemberRow[]>(
        `SELECT
           tm.SRN,
           tm.Student_Name,
           tm.Email,
           tm.Phone,
           d.Department_Code,
           d.Department_Name
         FROM TEAM_MEMBER AS tm
         INNER JOIN DEPARTMENT AS d
           ON tm.Department_ID = d.Department_ID
         WHERE tm.Team_Record_ID = ?
         ORDER BY tm.SRN`,
        [team.Team_Record_ID]
      );

      responseData = {
        success: true,
        hasTeam: true,
        team: {
          teamRecordId: team.Team_Record_ID,
          status: team.Status,
          mentorCode: team.Mentor_Code,
          mentorName: team.Mentor_Name,
          memberCount: team.Member_Count,
          members,
        },
      };
    }

    // Store the result in Redis for five minutes.
    try {
      const redis = await getRedis();

      await redis.set(
        cacheKey,
        JSON.stringify(responseData),
        { EX: CACHE_TTL }
      );
    } catch (redisError) {
      console.error("Redis cache write failed:", redisError);
    }

    return NextResponse.json(responseData, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Team retrieval failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve team details." },
      { status: 500 }
    );
  }
}
