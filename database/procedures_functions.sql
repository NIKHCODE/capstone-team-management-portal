
USE capstone_portal;

-- =====================================================
-- 1. STORED PROCEDURE
-- Purpose: Retrieve complete information about a team.
-- =====================================================

DROP PROCEDURE IF EXISTS sp_get_team_registration_details;

DELIMITER $$

CREATE PROCEDURE sp_get_team_registration_details(
    IN p_team_record_id INT
)
BEGIN

    -- Result Set 1: Team and mentor information.
    SELECT
        t.Team_Record_ID,
        t.Status,
        t.Mentor_Code,
        m.Mentor_Name,
        m.Email AS Mentor_Email,
        COUNT(tm.SRN) AS Member_Count
    FROM TEAM AS t
    LEFT JOIN MENTOR AS m
        ON t.Mentor_Code = m.Mentor_Code
    LEFT JOIN TEAM_MEMBER AS tm
        ON t.Team_Record_ID = tm.Team_Record_ID
    WHERE t.Team_Record_ID = p_team_record_id
    GROUP BY
        t.Team_Record_ID,
        t.Status,
        t.Mentor_Code,
        m.Mentor_Name,
        m.Email;

    -- Result Set 2: All members of the selected team.
    SELECT
        tm.SRN,
        tm.Student_Name,
        tm.Email,
        tm.Phone,
        d.Department_Code,
        d.Department_Name
    FROM TEAM_MEMBER AS tm
    INNER JOIN DEPARTMENT AS d
        ON tm.Department_ID = d.Department_ID
    WHERE tm.Team_Record_ID = p_team_record_id
    ORDER BY tm.SRN;

END$$

DELIMITER ;


-- =====================================================
-- 2. USER-DEFINED FUNCTION
-- Purpose: Calculate team registration completion.
--
-- Requirement 1: Exactly four members.
-- Requirement 2: A mentor must be assigned.
--
-- Both satisfied = 100%
-- One satisfied  = 50%
-- Neither        = 0%
-- =====================================================

DROP FUNCTION IF EXISTS fn_team_completion_percentage;

DELIMITER $$

CREATE FUNCTION fn_team_completion_percentage(
    p_team_record_id INT
)
RETURNS DECIMAL(5,2)
NOT DETERMINISTIC
READS SQL DATA
BEGIN

    DECLARE v_member_count INT DEFAULT 0;
    DECLARE v_mentor_assigned INT DEFAULT 0;
    DECLARE v_completion DECIMAL(5,2) DEFAULT 0.00;

    -- Retrieve the team's member count and mentor assignment.
    SELECT
        COUNT(tm.SRN),
        COALESCE(
            MAX(
                CASE
                    WHEN t.Mentor_Code IS NOT NULL THEN 1
                    ELSE 0
                END
            ),
            0
        )
    INTO
        v_member_count,
        v_mentor_assigned
    FROM TEAM AS t
    LEFT JOIN TEAM_MEMBER AS tm
        ON t.Team_Record_ID = tm.Team_Record_ID
    WHERE t.Team_Record_ID = p_team_record_id
    GROUP BY t.Team_Record_ID;

    -- Calculate completion percentage.
    SET v_completion =
        (
            (CASE
                WHEN v_member_count = 4 THEN 1
                ELSE 0
            END)
            + v_mentor_assigned
        ) * 50.00;

    RETURN v_completion;

END$$

DELIMITER ;


-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Test the stored procedure.
CALL sp_get_team_registration_details(2);

-- Test the stored function.
SELECT
    Team_Record_ID,
    Status,
    fn_team_completion_percentage(Team_Record_ID)
        AS Completion_Percentage
FROM TEAM
ORDER BY Team_Record_ID;
