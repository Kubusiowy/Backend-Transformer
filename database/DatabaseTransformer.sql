-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Dec 23, 2025 at 09:11 PM
-- Wersja serwera: 8.0.44
-- Wersja PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `DatabaseTransformer`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `clients`
--

CREATE TABLE `clients` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `api_key_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_seen` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `devices`
--

CREATE TABLE `devices` (
  `id` char(36) NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `device_model` varchar(60) DEFAULT NULL,
  `modbus_unit_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `device_latest_measurements`
--

CREATE TABLE `device_latest_measurements` (
  `device_id` char(36) NOT NULL,
  `metric_key` varchar(80) NOT NULL,
  `value` decimal(16,6) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `taken_at` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `pairing_codes`
--

CREATE TABLE `pairing_codes` (
  `code` varchar(20) NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `tenants`
--

CREATE TABLE `tenants` (
  `id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `transformers`
--

CREATE TABLE `transformers` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `location` varchar(120) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `Users`
--

CREATE TABLE `Users` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clients_tenant_name` (`tenant_id`,`name`),
  ADD UNIQUE KEY `uq_clients_api_key_hash` (`api_key_hash`),
  ADD KEY `idx_clients_transformer` (`transformer_id`);

--
-- Indeksy dla tabeli `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_devices_transformer_name` (`transformer_id`,`name`),
  ADD KEY `idx_devices_transformer` (`transformer_id`);

--
-- Indeksy dla tabeli `device_latest_measurements`
--
ALTER TABLE `device_latest_measurements`
  ADD PRIMARY KEY (`device_id`,`metric_key`),
  ADD KEY `idx_latest_taken_at` (`taken_at`);

--
-- Indeksy dla tabeli `pairing_codes`
--
ALTER TABLE `pairing_codes`
  ADD PRIMARY KEY (`code`),
  ADD KEY `idx_pairing_transformer` (`transformer_id`),
  ADD KEY `idx_pairing_expires` (`expires_at`);

--
-- Indeksy dla tabeli `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `transformers`
--
ALTER TABLE `transformers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_transformers_tenant_name` (`tenant_id`,`name`),
  ADD KEY `idx_transformers_tenant` (`tenant_id`);

--
-- Indeksy dla tabeli `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_tenant_email` (`tenant_id`,`email`),
  ADD KEY `idx_users_tenant` (`tenant_id`);

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  ADD CONSTRAINT `fk_clients_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `fk_devices_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `device_latest_measurements`
--
ALTER TABLE `device_latest_measurements`
  ADD CONSTRAINT `fk_latest_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `pairing_codes`
--
ALTER TABLE `pairing_codes`
  ADD CONSTRAINT `fk_pairing_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `transformers`
--
ALTER TABLE `transformers`
  ADD CONSTRAINT `fk_transformers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);

--
-- Ograniczenia dla tabeli `Users`
--
ALTER TABLE `Users`
  ADD CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
