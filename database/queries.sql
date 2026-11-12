USE capstone_portal;

-- 1. Basic SELECT: Retrieve all departments.
SELECT
    Department_ID,
    Department_Code,
    Department_Name
FROM DEPARTMENT
ORDER BY Department_Name;

-- 2. JOIN: Retrieve students with their department information.
SELECT
    s.SRN,
    s.Student_Name,
    s.Email,
    d.Department_Code,
    d.Department_Name
FROM STUDENT AS s
INNER JOIN DEPARTMENT AS d
    ON s.Department_ID = d.Department_ID
ORDER BY s.Student_Name;

-- 3. LEFT JOIN: List all teams, including teams without mentors.
SELECT
    t.Team_Record_ID,
    t.Status,
    m.Mentor_Name,
    m.Designation
FROM TEAM AS t
LEFT JOIN MENTOR AS m
    ON t.Mentor_Code = m.Mentor_Code
ORDER BY t.Team_Record_ID;

-- 4. Aggregation: Count students in each department.
SELECT
    d.Department_Code,
    d.Department_Name,
    COUNT(s.SRN) AS Student_Count
FROM DEPARTMENT AS d
LEFT JOIN STUDENT AS s
    ON d.Department_ID = s.Department_ID
GROUP BY
    d.Department_ID,
    d.Department_Code,
    d.Department_Name
ORDER BY Student_Count DESC;

-- 5. GROUP BY and HAVING: Find departments with at least five students.
SELECT
    d.Department_Code,
    d.Department_Name,
    COUNT(s.SRN) AS Student_Count
FROM DEPARTMENT AS d
INNER JOIN STUDENT AS s
    ON d.Department_ID = s.Department_ID
GROUP BY
    d.Department_ID,
    d.Department_Code,
    d.Department_Name
HAVING COUNT(s.SRN) >= 5
ORDER BY Student_Count DESC;

-- 6. Subquery: Find students who are not registered in any team.
SELECT
    s.SRN,
    s.Student_Name,
    s.Email
FROM STUDENT AS s
WHERE NOT EXISTS (
    SELECT 1
    FROM TEAM_MEMBER AS tm
    WHERE tm.SRN = s.SRN
)
ORDER BY s.Student_Name;

-- 7. View: Display the team registration summary.
SELECT *
FROM vw_team_registration_summary
ORDER BY Team_Record_ID;

-- 8. Filter: Display incomplete team registrations.
SELECT
    Team_Record_ID,
    Mentor_Code,
    Status
FROM TEAM
WHERE Status = 'REGISTERED_INCOMPLETE'
ORDER BY Team_Record_ID;

-- 9. Filter: Display complete team registrations.
SELECT
    Team_Record_ID,
    Mentor_Code,
    Status
FROM TEAM
WHERE Status = 'REGISTERED_COMPLETE'
ORDER BY Team_Record_ID;

-- 10. Multi-table JOIN: Show each registered team member's details.
SELECT
    t.Team_Record_ID,
    t.Status,
    s.SRN,
    s.Student_Name,
    s.Email,
    d.Department_Code,
    d.Department_Name
FROM TEAM AS t
INNER JOIN TEAM_MEMBER AS tm
    ON t.Team_Record_ID = tm.Team_Record_ID
INNER JOIN STUDENT AS s
    ON tm.SRN = s.SRN
INNER JOIN DEPARTMENT AS d
    ON tm.Department_ID = d.Department_ID
ORDER BY
    t.Team_Record_ID,
    s.Student_Name;