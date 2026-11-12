-- Import the supplied TVD student and faculty workbooks.
-- Expected source rows: 20 students and 5 faculty members.
-- Departments CS and AIML must already exist.
USE capstone_portal;

DELIMITER $$
DROP PROCEDURE IF EXISTS import_tvd_data$$
CREATE PROCEDURE import_tvd_data()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF (SELECT COUNT(*) FROM DEPARTMENT WHERE Department_Code IN ('CS', 'AIML')) <> 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both CS and AIML departments must exist.';
  END IF;

  IF (SELECT COUNT(*) FROM STUDENT) <> 0 OR (SELECT COUNT(*) FROM MENTOR) <> 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT or MENTOR is not empty. Import stopped to prevent duplicates.';
  END IF;

  START TRANSACTION;

  -- Student records
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS101', 'Elena Gilbert', d.Department_ID, 'elena.gilbert@example.com', '9000000101'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM102', 'Stefan Salvatore', d.Department_ID, 'stefan.salvatore@example.com', '9000000102'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS103', 'Damon Salvatore', d.Department_ID, 'damon.salvatore@example.com', '9000000103'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM104', 'Bonnie Bennett', d.Department_ID, 'bonnie.bennett@example.com', '9000000104'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS105', 'Caroline Forbes', d.Department_ID, 'caroline.forbes@example.com', '9000000105'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM106', 'Matt Donovan', d.Department_ID, 'matt.donovan@example.com', '9000000106'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS107', 'Tyler Lockwood', d.Department_ID, 'tyler.lockwood@example.com', '9000000107'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM108', 'Jeremy Gilbert', d.Department_ID, 'jeremy.gilbert@example.com', '9000000108'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS109', 'Alaric Saltzman', d.Department_ID, 'alaric.saltzman@example.com', '9000000109'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM110', 'Enzo St. John', d.Department_ID, 'enzo.stjohn@example.com', '9000000110'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS111', 'Katherine Pierce', d.Department_ID, 'katherine.pierce@example.com', '9000000111'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM112', 'Klaus Mikaelson', d.Department_ID, 'klaus.mikaelson@example.com', '9000000112'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS113', 'Rebekah Mikaelson', d.Department_ID, 'rebekah.mikaelson@example.com', '9000000113'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM114', 'Kai Parker', d.Department_ID, 'kai.parker@example.com', '9000000114'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS115', 'Kol Mikaelson', d.Department_ID, 'kol.mikaelson@example.com', '9000000115'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM116', 'Finn Mikaelson', d.Department_ID, 'finn.mikaelson@example.com', '9000000116'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS117', 'Hayley Marshall', d.Department_ID, 'Hayley.Marshall@example.com', '9000000117'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM118', 'Lexi Branson', d.Department_ID, 'lexi.branson@example.com', '9000000118'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24CS119', 'Anna', d.Department_ID, 'anna@example.com', '9000000119'
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO STUDENT (SRN, Student_Name, Department_ID, Email, Phone)
  SELECT 'PES1UG24AM120', 'Vicki Donovan', d.Department_ID, 'vicki.donovan@example.com', '9000000120'
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';

  -- Faculty records
  INSERT INTO MENTOR (Mentor_Code, Mentor_Name, Department_ID, Email, Designation, Is_Active)
  SELECT 'MKL', 'Mikael', d.Department_ID, 'Mikael@gmail.com', 'PROFESSOR', TRUE
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO MENTOR (Mentor_Code, Mentor_Name, Department_ID, Email, Designation, Is_Active)
  SELECT 'DHL', 'Dahlia', d.Department_ID, 'Dahlia@gmail.com', 'ASSISTANT', TRUE
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';
  INSERT INTO MENTOR (Mentor_Code, Mentor_Name, Department_ID, Email, Designation, Is_Active)
  SELECT 'EMK', 'Elijah Mikaelson', d.Department_ID, 'Elijah@gmail.com', 'ASSISTANT', TRUE
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO MENTOR (Mentor_Code, Mentor_Name, Department_ID, Email, Designation, Is_Active)
  SELECT 'MLK', 'Mason Lockwood', d.Department_ID, 'MLockwood@gmail.com', 'ASSOCIATE', TRUE
  FROM DEPARTMENT d WHERE d.Department_Code = 'CS';
  INSERT INTO MENTOR (Mentor_Code, Mentor_Name, Department_ID, Email, Designation, Is_Active)
  SELECT 'RYZ', 'Rayna Cruz', d.Department_ID, 'Rayna.cruz@gmail.com', 'ASSOCIATE', TRUE
  FROM DEPARTMENT d WHERE d.Department_Code = 'AIML';

  COMMIT;
END$$
DELIMITER ;

CALL import_tvd_data();
DROP PROCEDURE import_tvd_data;

-- Verify imported record counts.
SELECT COUNT(*) AS Student_Count FROM STUDENT;
SELECT COUNT(*) AS Mentor_Count FROM MENTOR;

SELECT Department_Code, COUNT(*) AS Student_Count
FROM STUDENT s JOIN DEPARTMENT d ON s.Department_ID = d.Department_ID
GROUP BY Department_Code ORDER BY Department_Code;

SELECT Department_Code, Designation, COUNT(*) AS Faculty_Count
FROM MENTOR m JOIN DEPARTMENT d ON m.Department_ID = d.Department_ID
GROUP BY Department_Code, Designation
ORDER BY Department_Code, Designation;
