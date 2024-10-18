CREATE DATABASE IF NOT EXISTS amendments;
USE amendments;

DROP TABLE IF EXISTS `amendments`;
CREATE TABLE `amendments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amendment_number` varchar(50) NOT NULL,
  `amendment_reference` varchar(255) DEFAULT NULL,
  `conflicting_with` varchar(255) DEFAULT NULL,
  `line_from` int DEFAULT NULL,
  `line_to` int DEFAULT NULL,
  `amendment_type` varchar(255) DEFAULT NULL,
  `original_text` text,
  `new_text` text,
  `motivation` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL UNIQUE,
  `role` ENUM('admin', 'redaktionsMedlem', 'medlemsOrganisation') NOT NULL,
  `signup_status` ENUM('pending', 'completed') DEFAULT 'pending',
  `invitation_token` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
