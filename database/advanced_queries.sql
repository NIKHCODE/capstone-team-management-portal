
USE capstone_portal;

-- 1. Display every team with its mentor and member count.
SELECT
    t.Team_Record_ID,
    t.Status,
    m.Mentor_Name,
    m.Designation,
    COUNT(tm.SRN) AS Member_Count
FROM TEAM t
LEFT JOIN MENTOR m
    ON t.Mentor_Code = m.Mentor_Code
LEFT JOIN TEAM_MEMBER tm
    ON t.Team_Record_ID = tm.Team_Record_ID
GROUP BY
    t.Team_Record_ID, t.Status,
    m.Mentor_Name, m.Designation;

-- 2. Count teams by registration status.
SELECT
    Status,
    COUNT(*) AS Total_Teams
FROM TEAM
GROUP BY Status;

-- 3. Find mentors and the number of teams assigned to each.
SELECT
    m.Mentor_Code,
    m.Mentor_Name,
    m.Designation,
    COUNT(t.Team_Record_ID) AS Assigned_Teams
FROM MENTOR m
LEFT JOIN TEAM t
    ON m.Mentor_Code = t.Mentor_Code
GROUP BY
    m.Mentor_Code, m.Mentor_Name, m.Designation
ORDER BY Assigned_Teams DESC;

-- 4. Find teams that do not have an assigned mentor.
SELECT
    t.Team_Record_ID,
    t.Status,
    COUNT(tm.SRN) AS Member_Count
FROM TEAM t
LEFT JOIN TEAM_MEMBER tm
    ON t.Team_Record_ID = tm.Team_Record_ID
WHERE t.Mentor_Code IS NULL
GROUP BY t.Team_Record_ID, t.Status;

-- 5. Find students who are not part of any team.
SELECT
    s.SRN,
    s.Student_Name,
    s.Email
FROM STUDENT s
WHERE NOT EXISTS (
    SELECT 1
    FROM TEAM_MEMBER tm
    WHERE tm.SRN = s.SRN
);

-- 6. Show department-wise student participation in teams.
SELECT
    d.Department_Name,
    COUNT(DISTINCT tm.SRN) AS Participating_Students,
    COUNT(DISTINCT tm.Team_Record_ID) AS Teams_Involved
FROM DEPARTMENT d
LEFT JOIN TEAM_MEMBER tm
    ON d.Department_ID = tm.Department_ID
GROUP BY d.Department_ID, d.Department_Name
ORDER BY Participating_Students DESC;

-- 7. Find teams having more than one member.
SELECT
    Team_Record_ID,
    COUNT(SRN) AS Member_Count
FROM TEAM_MEMBER
GROUP BY Team_Record_ID
HAVING COUNT(SRN) > 1;

-- 8. Find mentors who have not been assigned any team.
SELECT
    m.Mentor_Code,
    m.Mentor_Name,
    m.Designation
FROM MENTOR m
WHERE NOT EXISTS (
    SELECT 1
    FROM TEAM t
    WHERE t.Mentor_Code = m.Mentor_Code
);

-- 9. Display capstone cycles and their review schedules.
SELECT
    c.Cycle_Name,
    c.Academic_Year,
    c.Semester,
    r.Review_Type
FROM CAPSTONE_CYCLE c
LEFT JOIN CAPSTONE_REVIEW r
    ON c.Cycle_ID = r.Cycle_ID
ORDER BY c.Semester, r.Review_Type;

-- 10. Find teams whose member count is below four.
SELECT
    t.Team_Record_ID,
    t.Status,
    COUNT(tm.SRN) AS Member_Count
FROM TEAM t
LEFT JOIN TEAM_MEMBER tm
    ON t.Team_Record_ID = tm.Team_Record_ID
GROUP BY t.Team_Record_ID, t.Status
HAVING COUNT(tm.SRN) < 4;

-- 11. Find teams having exactly four members and an assigned mentor.
SELECT
    t.Team_Record_ID,
    t.Mentor_Code,
    COUNT(tm.SRN) AS Member_Count
FROM TEAM t
JOIN TEAM_MEMBER tm
    ON t.Team_Record_ID = tm.Team_Record_ID
WHERE t.Mentor_Code IS NOT NULL
GROUP BY t.Team_Record_ID, t.Mentor_Code
HAVING COUNT(tm.SRN) = 4;

-- 12. Calculate average team size.
SELECT
    AVG(Member_Count) AS Average_Team_Size
FROM (
    SELECT
        t.Team_Record_ID,
        COUNT(tm.SRN) AS Member_Count
    FROM TEAM t
    LEFT JOIN TEAM_MEMBER tm
        ON t.Team_Record_ID = tm.Team_Record_ID
    GROUP BY t.Team_Record_ID
) AS TeamSizes;

-- 13. Use a CTE to calculate team completion percentage.
-- 50% for four members, 50% for an assigned mentor.
WITH TeamProgress AS (
    SELECT
        t.Team_Record_ID,
        t.Mentor_Code,
        COUNT(tm.SRN) AS Member_Count
    FROM TEAM t
    LEFT JOIN TEAM_MEMBER tm
        ON t.Team_Record_ID = tm.Team_Record_ID
    GROUP BY t.Team_Record_ID, t.Mentor_Code
)
SELECT
    Team_Record_ID,
    Member_Count,
    Mentor_Code,
    (
        CASE WHEN Member_Count = 4 THEN 50 ELSE 0 END
        +
        CASE WHEN Mentor_Code IS NOT NULL THEN 50 ELSE 0 END
    ) AS Completion_Percentage
FROM TeamProgress;

-- 14. Rank mentors by the number of teams assigned.
WITH MentorWorkload AS (
    SELECT
        m.Mentor_Code,
        m.Mentor_Name,
        COUNT(t.Team_Record_ID) AS Assigned_Teams
    FROM MENTOR m
    LEFT JOIN TEAM t
        ON m.Mentor_Code = t.Mentor_Code
    GROUP BY m.Mentor_Code, m.Mentor_Name
)
SELECT
    Mentor_Code,
    Mentor_Name,
    Assigned_Teams,
    DENSE_RANK() OVER (
        ORDER BY Assigned_Teams DESC
    ) AS Workload_Rank
FROM MentorWorkload;

-- 15. Show department-wise team composition,
-- including teams containing students from multiple departments.
SELECT
    tm.Team_Record_ID,
    COUNT(DISTINCT tm.Department_ID) AS Department_Count,
    COUNT(tm.SRN) AS Member_Count,
    GROUP_CONCAT(
        DISTINCT d.Department_Code
        ORDER BY d.Department_Code
    ) AS Departments
FROM TEAM_MEMBER tm
JOIN DEPARTMENT d
    ON tm.Department_ID = d.Department_ID
GROUP BY tm.Team_Record_ID
HAVING COUNT(DISTINCT tm.Department_ID) > 1;
