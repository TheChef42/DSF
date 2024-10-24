CREATE DATABASE IF NOT EXISTS amendments;
USE amendments;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `amendments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `organisations`;
DROP TABLE IF EXISTS `papers`;

-- Create the organisations table
CREATE TABLE `organisations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `abbreviation` varchar(255) DEFAULT NULL UNIQUE,
    `university` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create the users table with a reference to organisations
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL UNIQUE,
  `role` ENUM('admin', 'redaktionsMedlem', 'medlemsOrganisation') NOT NULL,
  `signup_status` ENUM('pending', 'completed') DEFAULT 'pending',
  `invitation_token` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `organisation_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create the papers table
CREATE TABLE `papers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL UNIQUE,
    `state` enum('æf', 'æf til æf') DEFAULT NULL,
    `active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create the amendments table with a reference to users, organisations, and papers
CREATE TABLE `amendments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organisation_id` int NOT NULL,
  `paper_id` int NOT NULL,
  `amendment_number` varchar(50) DEFAULT NULL,
  `amendment_to_amendment` varchar(50) DEFAULT NULL,
  `write_in` varchar(255) DEFAULT NULL,
  `conflicting_with` varchar(255) DEFAULT NULL,
  `proposer` varchar(255) DEFAULT NULL,
  `co_proposer` varchar(255) DEFAULT NULL,
  `line_from` int DEFAULT NULL,
  `line_to` int DEFAULT NULL,
  `line_length` int DEFAULT NULL,
  `amendment_type` varchar(255) DEFAULT NULL,
  `original_text_danish` text,
  `new_text_danish` text,
  `motivation_danish` text,
  `original_text_english` text,
  `new_text_english` text,
  `motivation_english` text,
  `notes_comments` text,
  `status` ENUM('working', 'submitted') DEFAULT 'working',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`),
  FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert data into organisations table
INSERT INTO `organisations` (`id`, `name`, `abbreviation`, `university`) VALUES
(1, 'De Studerendes Råd', 'DJM', 'Det Jyske Musikkonservatorium'),
(2, 'Syddanske Studerende', 'SDS', 'Syddansk Universitet'),
(3, 'Studentersamfundet', 'S\'et', 'Aalborg Universitet'),
(4, 'Studenterrådet', 'SRKU', 'Københavns Universitet'),
(5, 'De Studerendes Råd', 'DKDM', 'Det Kgl. Danske Musikkonservatorium'),
(6, 'Studenterrådet', 'SRRUC', 'Roskilde Universitet'),
(7, 'CBS Students', 'CBSS', 'Copenhagen Business School'),
(8, 'Studenterrådet', 'SDMK', 'Syddansk Musikkonservatorium'),
(9, 'Akademiets Studenterråd', 'AS', 'Det Kongelige Akademi'),
(10, 'Polyteknisk Forening', 'PF', 'Danmarks Tekniske Universitet'),
(11, 'Elevrådet', 'DFKE', 'Det Fynske Kunstakademi'),
(12, 'Elevrådet', 'DJKE', 'Det Jyske Kunstakademi'),
(13, 'Elevrådet', 'DDFE', 'Den Danske Filmskole'),
(14, 'De Studerendes Råd', 'DDS', 'Den Danske Scenekunstskole'),
(15, 'Student Council', 'SC', 'IT-Universitetet'),
(16, 'Studenterrådet', 'SRAU', 'Aarhus Universitet'),
(17, 'De Studerendes Råd', 'DKDK', 'Det Kgl. Danske Kunstakademi'),
(18, 'De Arkitektstuderendes Råd', 'DAR', 'Arkitektskolen i Aarhus'),
(19, 'De Studerendes Råd', 'RMC', 'Rytmisk Musikkonservatorium'),
(20, 'De Studerendes Råd', 'DSK', 'Designskolen Kolding'),
(21, 'Danske Studerendes Fællesråd', 'DSF', 'DSF');

-- Insert data into papers table
INSERT INTO `papers` (`id`, `name`, `state`) VALUES
(1, 'Arbejdsplan 2025', 'æf'),
(2, 'Politikpapir om optag og adgang', 'æf'),
(3, 'Politikpapir om digitalisering', 'æf');

-- Insert default admin user with hashed password
INSERT INTO `users` (`email`, `name`, `password`, `role`, `signup_status`, `organisation_id`)
VALUES ('admin@example.com', 'ADMIN', '$2a$10$Jzmp475CQn1taPNdk0HJEeEXeM8xhNBxWAM/OPsMISA1C3y3e573G', 'admin', 'completed', '21');