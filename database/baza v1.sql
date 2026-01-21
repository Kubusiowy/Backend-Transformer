-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Sty 21, 2026 at 09:46 PM
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
-- Baza danych: `databaseTransformer`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `device_api_keys`
--

CREATE TABLE `device_api_keys` (
  `id` char(36) NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `api_key` char(64) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `metrics_1m_kv`
--

CREATE TABLE `metrics_1m_kv` (
  `transformer_id` char(36) NOT NULL,
  `key` varchar(64) NOT NULL,
  `bucket_ts` datetime NOT NULL,
  `avg_value` double DEFAULT NULL,
  `min_value` double DEFAULT NULL,
  `max_value` double DEFAULT NULL,
  `sample_count` int NOT NULL,
  `unit` varchar(16) DEFAULT NULL,
  `label` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `metrics_latest_kv`
--

CREATE TABLE `metrics_latest_kv` (
  `transformer_id` char(36) NOT NULL,
  `key` varchar(64) NOT NULL,
  `value` double DEFAULT NULL,
  `unit` varchar(16) DEFAULT NULL,
  `label` varchar(64) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `refresh_sessions`
--

CREATE TABLE `refresh_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varbinary(32) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `replaced_by` bigint UNSIGNED DEFAULT NULL,
  `device_id` varchar(128) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varbinary(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `transformers`
--

CREATE TABLE `transformers` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Zrzut danych tabeli `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `created_at`) VALUES
('02d496ba-01a5-4b7f-aec0-c6d2b4784047', 'kutas@xd', '$2a$12$YEzZ1yRi.iwcjaTAhivx6.f5MgS8zAHLJ9bRFdHcge6LXBnx8gIty', 'USER', '2026-01-19 10:31:18'),
('12d703d8-c4b8-4779-ab74-e744c160c530', 'vica@op.pl', '$2a$12$x7LEzUQTPCT79s4kV42ZoOKck1efEAhYlZ.3e74iH78y5ROGtq.TK', 'USER', '2026-01-19 12:16:21'),
('2e7ef3b6-f13b-4cdc-98d1-3835b0619eda', 'cwel@', '$2a$12$dZrwt3xDi9k4.csFj1n26OVQdXfYZn4P.4FQOr3oC6Gse9N7bQCd.', 'USER', '2026-01-19 10:46:39'),
('6622a52f-653c-491b-baf7-3bba348096a1', 'firkowskikuba@gmail.com', '$2a$12$fOVROhpY9XTjkd3Cv.sr1OoufcsrS7Otr3PsqicuOUDGcMwjzbQXi', 'USER', '2026-01-19 10:23:54'),
('68643da2-3693-4c69-8d34-ddac074d67d8', 'essa@maol.com', '$2a$12$mv2XdLbmgUEbndrRg9CLmOChmJZi/k8OHr3oazro.DGh6QXBHYWB.', 'USER', '2026-01-19 10:27:43'),
('71c5a2f2-5e1b-4ca2-b812-29348865e57c', 'k@k', '$2a$12$uEs47wwHp8FBtkZsMUKhfuGe4rXj67w0/hqDLGUKUgcK86vCP0zYu', 'USER', '2026-01-19 10:25:33'),
('79869ad3-fd31-4d32-b87a-c96f53218ab2', '1@1', '$2a$12$0/r759FH/.ljDCcRGHNUhO9UBX6LhCGvPrf7YmOBDb21.eOTuVpZK', 'USER', '2026-01-20 10:37:04'),
('9e339fdd-521a-4cf9-96b4-ce39dda8b189', 'kuba@gmail', '$2a$12$Q2ngNpuPyj0FE0Gh/i218.dRo1sFE3j.ZBM86UTfuZ.7EGRjbt7XG', 'USER', '2026-01-19 10:36:05'),
('c41ecee7-dca0-4a41-ab80-ef1eaf21abd9', 'kuba@gmail.com', '$2a$12$VHvlM8YE9I7xoy8dmUSPieAX128a.aFeDFRttM.wTZGGAhbi0E8qe', 'USER', '2026-01-16 12:44:24'),
('efc6eea1-fc24-44cc-81b2-0286f4b1b9de', 'randomrandi@gmail.com', '$2a$12$yN9Yi5p0HLT8s8lchdeDvuigkNFGWX5LMSCh/Yi1qhOgoIsVrWtUy', 'USER', '2026-01-20 13:03:44');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `device_api_keys`
--
ALTER TABLE `device_api_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_key` (`api_key`),
  ADD KEY `idx_api_keys_transformer_id` (`transformer_id`);

--
-- Indeksy dla tabeli `metrics_1m_kv`
--
ALTER TABLE `metrics_1m_kv`
  ADD PRIMARY KEY (`transformer_id`,`key`,`bucket_ts`),
  ADD KEY `idx_1m_range` (`transformer_id`,`bucket_ts`);

--
-- Indeksy dla tabeli `metrics_latest_kv`
--
ALTER TABLE `metrics_latest_kv`
  ADD PRIMARY KEY (`transformer_id`,`key`);

--
-- Indeksy dla tabeli `refresh_sessions`
--
ALTER TABLE `refresh_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_token_hash` (`token_hash`),
  ADD KEY `idx_user_active` (`user_id`,`revoked_at`,`expires_at`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indeksy dla tabeli `transformers`
--
ALTER TABLE `transformers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transformers_user_id` (`user_id`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT dla zrzuconych tabel
--

--
-- AUTO_INCREMENT dla tabeli `refresh_sessions`
--
ALTER TABLE `refresh_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `device_api_keys`
--
ALTER TABLE `device_api_keys`
  ADD CONSTRAINT `fk_api_keys_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `metrics_1m_kv`
--
ALTER TABLE `metrics_1m_kv`
  ADD CONSTRAINT `fk_1m_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `metrics_latest_kv`
--
ALTER TABLE `metrics_latest_kv`
  ADD CONSTRAINT `fk_latest_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `refresh_sessions`
--
ALTER TABLE `refresh_sessions`
  ADD CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `transformers`
--
ALTER TABLE `transformers`
  ADD CONSTRAINT `fk_transformers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
