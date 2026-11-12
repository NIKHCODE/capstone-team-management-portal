-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: capstone_portal
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_session`
--

DROP TABLE IF EXISTS `app_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_session` (
  `Session_ID` bigint NOT NULL AUTO_INCREMENT,
  `User_ID` int NOT NULL,
  `Token_Hash` char(64) NOT NULL,
  `Expires_At` datetime NOT NULL,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Session_ID`),
  UNIQUE KEY `uq_session_token_hash` (`Token_Hash`),
  KEY `idx_session_user` (`User_ID`),
  KEY `idx_session_expiry` (`Expires_At`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`User_ID`) REFERENCES `app_user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_session`
--

LOCK TABLES `app_session` WRITE;
/*!40000 ALTER TABLE `app_session` DISABLE KEYS */;
INSERT INTO `app_session` VALUES (1,1,'06ad844368638452e90f5185d8192a653f87a30e3670911f473b6e5ff90c28f0','2026-11-10 11:20:25','2026-11-09 21:50:25'),(4,3,'397f0104df235cee5e197bbd2b26a41e0fe3308405df8150899ff0ac08b07672','2026-11-10 11:43:34','2026-11-09 22:13:34'),(8,3,'f0f46d71c5a789e577b782fb44e6cb6d18e415345f164f539d4843f2d86ee6a6','2026-11-10 12:09:45','2026-11-09 22:39:45'),(9,1,'a9e5d3e824d8cbf5e3127ec1d1de5cdfcbf1e0f66da60ba506180aaef2cc009d','2026-11-13 10:36:19','2026-11-12 21:06:19'),(10,1,'3b71266e1e1315548d6fc875b21d0fe9717e086e2e67248e92b01e1f9e9eded9','2026-11-13 10:50:50','2026-11-12 21:20:50'),(11,1,'00eb48173095e195efaa5bbfa483ded0c218a32f5b0f753b4b7c4e233e69c301','2026-11-13 11:05:51','2026-11-12 21:35:51'),(12,3,'c57d8c55c358304b3376ad4ca2499f2ea0a9d0e7fb82adb7356f4ccbb70cf270','2026-11-13 11:07:10','2026-11-12 21:37:10'),(13,1,'42245a853388cb052578e119591fc60ed766e95a5245faa41e0a4897b4c28f67','2026-11-13 11:08:39','2026-11-12 21:38:39');
/*!40000 ALTER TABLE `app_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `User_ID` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) NOT NULL,
  `Password_Hash` varchar(255) NOT NULL,
  `Role` enum('STUDENT','COORDINATOR') NOT NULL DEFAULT 'STUDENT',
  `SRN` varchar(20) DEFAULT NULL,
  `Is_Active` tinyint(1) NOT NULL DEFAULT '1',
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`User_ID`),
  UNIQUE KEY `uq_app_user_email` (`Email`),
  UNIQUE KEY `uq_app_user_srn` (`SRN`),
  CONSTRAINT `fk_app_user_student` FOREIGN KEY (`SRN`) REFERENCES `student` (`SRN`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
INSERT INTO `app_user` VALUES (1,'coordinator@pes.edu','$2b$12$DGzyeJ2J3sC/X2QenTQXY.tSqDQTzPyaoAgI05/5gra7ckfqLGFoS','COORDINATOR',NULL,1,'2026-11-09 21:48:57'),(2,'caroline.forbes@example.com','$2b$12$LCuzCauiBig/AnoVe.jEgOJ2s2dBOUz.L7gQiyJz/6rO7PhcUPxGO','STUDENT','PES1UG24CS105',1,'2026-11-09 22:04:26'),(3,'vicki.donovan@example.com','$2b$12$QWS1DoxkRFNO5..9Xx2UWOh84Qpop8McEEjS0nBnev3tMJaN/SRya','STUDENT','PES1UG24AM120',1,'2026-11-09 22:13:17');
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `capstone_cycle`
--

DROP TABLE IF EXISTS `capstone_cycle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `capstone_cycle` (
  `Cycle_ID` int NOT NULL AUTO_INCREMENT,
  `Cycle_Name` varchar(50) NOT NULL,
  `Academic_Year` varchar(9) NOT NULL,
  `Semester` int NOT NULL,
  PRIMARY KEY (`Cycle_ID`),
  UNIQUE KEY `Cycle_Name` (`Cycle_Name`),
  UNIQUE KEY `Semester` (`Semester`),
  CONSTRAINT `capstone_cycle_chk_1` CHECK ((`Semester` between 5 and 8))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `capstone_cycle`
--

LOCK TABLES `capstone_cycle` WRITE;
/*!40000 ALTER TABLE `capstone_cycle` DISABLE KEYS */;
INSERT INTO `capstone_cycle` VALUES (1,'Capstone Semester 5','2026-2027',5),(2,'Capstone Semester 6','2026-2027',6),(3,'Capstone Semester 7','2027-2028',7),(4,'Capstone Semester 8','2027-2028',8);
/*!40000 ALTER TABLE `capstone_cycle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `capstone_review`
--

DROP TABLE IF EXISTS `capstone_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `capstone_review` (
  `Review_ID` int NOT NULL AUTO_INCREMENT,
  `Cycle_ID` int NOT NULL,
  `Review_Type` enum('ISA1','ISA2','ESA') NOT NULL,
  PRIMARY KEY (`Review_ID`),
  UNIQUE KEY `Cycle_ID` (`Cycle_ID`,`Review_Type`),
  CONSTRAINT `capstone_review_ibfk_1` FOREIGN KEY (`Cycle_ID`) REFERENCES `capstone_cycle` (`Cycle_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `capstone_review`
--

LOCK TABLES `capstone_review` WRITE;
/*!40000 ALTER TABLE `capstone_review` DISABLE KEYS */;
INSERT INTO `capstone_review` VALUES (1,1,'ISA1'),(8,1,'ISA2'),(15,1,'ESA'),(2,2,'ISA1'),(9,2,'ISA2'),(16,2,'ESA'),(3,3,'ISA1'),(10,3,'ISA2'),(17,3,'ESA'),(4,4,'ISA1'),(11,4,'ISA2'),(18,4,'ESA');
/*!40000 ALTER TABLE `capstone_review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `Department_ID` int NOT NULL AUTO_INCREMENT,
  `Department_Code` varchar(10) NOT NULL,
  `Department_Name` varchar(100) NOT NULL,
  PRIMARY KEY (`Department_ID`),
  UNIQUE KEY `Department_Code` (`Department_Code`),
  UNIQUE KEY `Department_Name` (`Department_Name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (2,'CS','Computer Science'),(3,'AIML','Artificial Intelligence and Machine Learning');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor`
--

DROP TABLE IF EXISTS `mentor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor` (
  `Mentor_Code` varchar(4) NOT NULL,
  `Mentor_Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Department_ID` int NOT NULL,
  `Is_Active` tinyint(1) NOT NULL DEFAULT '1',
  `Designation` enum('ASSISTANT','ASSOCIATE','PROFESSOR') NOT NULL,
  PRIMARY KEY (`Mentor_Code`),
  UNIQUE KEY `Email` (`Email`),
  KEY `fk_mentor_department` (`Department_ID`),
  CONSTRAINT `fk_mentor_department` FOREIGN KEY (`Department_ID`) REFERENCES `department` (`Department_ID`),
  CONSTRAINT `chk_mentor_code_length` CHECK ((char_length(`Mentor_Code`) between 3 and 4))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor`
--

LOCK TABLES `mentor` WRITE;
/*!40000 ALTER TABLE `mentor` DISABLE KEYS */;
INSERT INTO `mentor` VALUES ('DHL','Dahlia','Dahlia@gmail.com',3,1,'ASSISTANT'),('EMK','Elijah Mikaelson','Elijah@gmail.com',2,1,'ASSISTANT'),('MKL','Mikael','Mikael@gmail.com',2,1,'PROFESSOR'),('MLK','Mason Lockwood','MLockwood@gmail.com',2,1,'ASSOCIATE'),('RYZ','Rayna Cruz','Rayna.cruz@gmail.com',3,1,'ASSOCIATE');
/*!40000 ALTER TABLE `mentor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `SRN` varchar(20) NOT NULL,
  `Student_Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `Department_ID` int NOT NULL,
  PRIMARY KEY (`SRN`),
  UNIQUE KEY `Email` (`Email`),
  KEY `fk_student_department` (`Department_ID`),
  CONSTRAINT `fk_student_department` FOREIGN KEY (`Department_ID`) REFERENCES `department` (`Department_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES ('PES1UG24AM102','Stefan Salvatore','stefan.salvatore@example.com','9000000102',3),('PES1UG24AM104','Bonnie Bennett','bonnie.bennett@example.com','9000000104',3),('PES1UG24AM106','Matt Donovan','matt.donovan@example.com','9000000106',3),('PES1UG24AM108','Jeremy Gilbert','jeremy.gilbert@example.com','9000000108',3),('PES1UG24AM110','Enzo St. John','enzo.stjohn@example.com','9000000110',3),('PES1UG24AM112','Klaus Mikaelson','klaus.mikaelson@example.com','9000000112',3),('PES1UG24AM114','Kai Parker','kai.parker@example.com','9000000114',3),('PES1UG24AM116','Finn Mikaelson','finn.mikaelson@example.com','9000000116',3),('PES1UG24AM118','Lexi Branson','lexi.branson@example.com','9000000118',3),('PES1UG24AM120','Vicki Donovan','vicki.donovan@example.com','9000000120',3),('PES1UG24CS101','Elena Gilbert','elena.gilbert@example.com','9000000101',2),('PES1UG24CS103','Damon Salvatore','damon.salvatore@example.com','9000000103',2),('PES1UG24CS105','Caroline Forbes','caroline.forbes@example.com','9000000105',2),('PES1UG24CS107','Tyler Lockwood','tyler.lockwood@example.com','9000000107',2),('PES1UG24CS109','Alaric Saltzman','alaric.saltzman@example.com','9000000109',2),('PES1UG24CS111','Katherine Pierce','katherine.pierce@example.com','9000000111',2),('PES1UG24CS113','Rebekah Mikaelson','rebekah.mikaelson@example.com','9000000113',2),('PES1UG24CS115','Kol Mikaelson','kol.mikaelson@example.com','9000000115',2),('PES1UG24CS117','Hayley Marshall','Hayley.Marshall@example.com','9000000117',2),('PES1UG24CS119','Anna','anna@example.com','9000000119',2);
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `Team_Record_ID` int NOT NULL AUTO_INCREMENT,
  `Mentor_Code` varchar(4) DEFAULT NULL,
  `Status` enum('REGISTERED_INCOMPLETE','REGISTERED_COMPLETE') NOT NULL DEFAULT 'REGISTERED_INCOMPLETE',
  PRIMARY KEY (`Team_Record_ID`),
  KEY `Mentor_Code` (`Mentor_Code`),
  CONSTRAINT `team_ibfk_1` FOREIGN KEY (`Mentor_Code`) REFERENCES `mentor` (`Mentor_Code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES (2,'EMK','REGISTERED_COMPLETE');
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_team_insert` BEFORE INSERT ON `team` FOR EACH ROW BEGIN
    SET NEW.Status = 'REGISTERED_INCOMPLETE';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_team_update` BEFORE UPDATE ON `team` FOR EACH ROW BEGIN
    IF NEW.Mentor_Code IS NOT NULL
       AND (
           SELECT COUNT(*)
           FROM TEAM_MEMBER
           WHERE Team_Record_ID = NEW.Team_Record_ID
       ) = 4
    THEN
        SET NEW.Status = 'REGISTERED_COMPLETE';
    ELSE
        SET NEW.Status = 'REGISTERED_INCOMPLETE';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `team_member`
--

DROP TABLE IF EXISTS `team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_member` (
  `Team_Record_ID` int NOT NULL,
  `SRN` varchar(20) NOT NULL,
  `Student_Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Phone` varchar(15) NOT NULL,
  `Department_ID` int NOT NULL,
  PRIMARY KEY (`Team_Record_ID`,`SRN`),
  UNIQUE KEY `SRN` (`SRN`),
  KEY `Department_ID` (`Department_ID`),
  CONSTRAINT `team_member_ibfk_1` FOREIGN KEY (`Team_Record_ID`) REFERENCES `team` (`Team_Record_ID`),
  CONSTRAINT `team_member_ibfk_2` FOREIGN KEY (`Department_ID`) REFERENCES `department` (`Department_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_member`
--

LOCK TABLES `team_member` WRITE;
/*!40000 ALTER TABLE `team_member` DISABLE KEYS */;
INSERT INTO `team_member` VALUES (2,'PES1UG24AM110','Enzo St. John','enzo.stjohn@example.com','9000000110',3),(2,'PES1UG24AM120','Vicki Donovan','vicki.donovan@example.com','9000000120',3),(2,'PES1UG24CS105','Caroline Forbes','caroline.forbes@example.com','9000000105',2),(2,'PES1UG24CS107','Tyler Lockwood','tyler.lockwood@example.com','9000000107',2);
/*!40000 ALTER TABLE `team_member` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_team_member_insert` BEFORE INSERT ON `team_member` FOR EACH ROW BEGIN
    DECLARE existing_team_id INT;
    DECLARE member_count INT DEFAULT 0;

    SELECT Team_Record_ID
    INTO existing_team_id
    FROM TEAM
    WHERE Team_Record_ID = NEW.Team_Record_ID
    FOR UPDATE;

    SELECT COUNT(*)
    INTO member_count
    FROM TEAM_MEMBER
    WHERE Team_Record_ID = NEW.Team_Record_ID;

    IF member_count >= 4 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A team cannot have more than four members';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_team_member_insert` AFTER INSERT ON `team_member` FOR EACH ROW BEGIN
    UPDATE TEAM
    SET Status = CASE
        WHEN (
            SELECT COUNT(*)
            FROM TEAM_MEMBER
            WHERE Team_Record_ID = NEW.Team_Record_ID
        ) = 4
        AND Mentor_Code IS NOT NULL
        THEN 'REGISTERED_COMPLETE'
        ELSE 'REGISTERED_INCOMPLETE'
    END
    WHERE Team_Record_ID = NEW.Team_Record_ID;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_team_member_delete` AFTER DELETE ON `team_member` FOR EACH ROW BEGIN
    UPDATE TEAM
    SET Status = CASE
        WHEN (
            SELECT COUNT(*)
            FROM TEAM_MEMBER
            WHERE Team_Record_ID = OLD.Team_Record_ID
        ) = 4
        AND Mentor_Code IS NOT NULL
        THEN 'REGISTERED_COMPLETE'
        ELSE 'REGISTERED_INCOMPLETE'
    END
    WHERE Team_Record_ID = OLD.Team_Record_ID;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `vw_team_registration_summary`
--

DROP TABLE IF EXISTS `vw_team_registration_summary`;
/*!50001 DROP VIEW IF EXISTS `vw_team_registration_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_team_registration_summary` AS SELECT 
 1 AS `Team_Record_ID`,
 1 AS `Status`,
 1 AS `Mentor_Code`,
 1 AS `Mentor_Name`,
 1 AS `Designation`,
 1 AS `Member_Count`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'capstone_portal'
--

--
-- Dumping routines for database 'capstone_portal'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_team_completion_percentage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_team_completion_percentage`(
    p_team_record_id INT
) RETURNS decimal(5,2)
    READS SQL DATA
BEGIN

    DECLARE v_member_count INT DEFAULT 0;
    DECLARE v_mentor_assigned INT DEFAULT 0;
    DECLARE v_completion DECIMAL(5,2) DEFAULT 0.00;

    
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

    
    SET v_completion =
        (
            (CASE
                WHEN v_member_count = 4 THEN 1
                ELSE 0
            END)
            + v_mentor_assigned
        ) * 50.00;

    RETURN v_completion;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_team_registration_details` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_team_registration_details`(
    IN p_team_record_id INT
)
BEGIN

    
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_team_registration_summary`
--

/*!50001 DROP VIEW IF EXISTS `vw_team_registration_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_team_registration_summary` AS select `t`.`Team_Record_ID` AS `Team_Record_ID`,`t`.`Status` AS `Status`,`t`.`Mentor_Code` AS `Mentor_Code`,`m`.`Mentor_Name` AS `Mentor_Name`,`m`.`Designation` AS `Designation`,count(`tm`.`SRN`) AS `Member_Count` from ((`team` `t` left join `mentor` `m` on((`t`.`Mentor_Code` = `m`.`Mentor_Code`))) left join `team_member` `tm` on((`t`.`Team_Record_ID` = `tm`.`Team_Record_ID`))) group by `t`.`Team_Record_ID`,`t`.`Status`,`t`.`Mentor_Code`,`m`.`Mentor_Name`,`m`.`Designation` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13  3:24:31
