-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Sty 28, 2026 at 06:35 PM
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
-- Struktura tabeli dla tabeli `meter`
--

CREATE TABLE `meter` (
  `id` bigint NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `name` varchar(64) NOT NULL,
  `device_code` varchar(64) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `serial_port` varchar(64) NOT NULL,
  `baud_rate` int NOT NULL,
  `data_bits` int NOT NULL DEFAULT '8',
  `parity` enum('NONE','EVEN','ODD') NOT NULL DEFAULT 'NONE',
  `stop_bits` int NOT NULL DEFAULT '1',
  `slave_id` tinyint UNSIGNED NOT NULL,
  `byte_order` enum('BIG_ENDIAN','LITTLE_ENDIAN') NOT NULL DEFAULT 'BIG_ENDIAN',
  `poll_interval_ms` int NOT NULL DEFAULT '1000',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `meter_register`
--

CREATE TABLE `meter_register` (
  `id` bigint NOT NULL,
  `meter_id` bigint NOT NULL,
  `name` varchar(64) NOT NULL,
  `register_type` enum('INPUT','HOLDING') NOT NULL,
  `address` int NOT NULL,
  `length` int NOT NULL,
  `data_type` enum('INT16','INT32','FLOAT32') NOT NULL,
  `scale` double NOT NULL DEFAULT '1',
  `unit` varchar(16) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `order_index` int NOT NULL DEFAULT '0',
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
-- Struktura tabeli dla tabeli `refresh_sessions`
--

CREATE TABLE `refresh_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `replaced_by` bigint UNSIGNED DEFAULT NULL,
  `device_id` varchar(128) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varbinary(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Zrzut danych tabeli `refresh_sessions`
--

INSERT INTO `refresh_sessions` (`id`, `user_id`, `token_hash`, `created_at`, `expires_at`, `revoked_at`, `replaced_by`, `device_id`, `user_agent`, `ip`) VALUES
(5, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$3pQkYJ2xHOdTximuDT978OSfT7zHe2eHZtw6mYRL8aXwxnNPQeq5W', '2026-01-25 15:25:23.269', '2026-02-24 15:25:23.267', NULL, NULL, NULL, NULL, NULL),
(6, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$ctFn3ivnnFVTO2MHcMRL8.Ic46Ocdh2wSqLhppWHNSGC/dNVjXSre', '2026-01-25 15:29:38.972', '2026-02-24 15:29:38.969', NULL, NULL, NULL, NULL, NULL),
(7, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$QfN1esm7gXAh4ExFo4ZRju4KZ0s5.Pgmn0ptD12u6R5oPiTUN81iy', '2026-01-25 15:37:48.509', '2026-02-24 15:37:48.506', NULL, NULL, NULL, NULL, NULL),
(8, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$.XmuRgg2ZE5eyHFQEBl6Le1/OqEC4Ud1mVKelnTQKvFME.UrmTrfm', '2026-01-25 15:38:08.647', '2026-02-24 15:38:08.644', NULL, NULL, NULL, NULL, NULL),
(9, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$a7IQJ.3xfB5A7mDNiJmEEek4auU869Nex6q21/eUuo2lzPwCOU0de', '2026-01-25 15:38:23.291', '2026-02-24 15:38:23.291', NULL, NULL, NULL, NULL, NULL),
(10, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$K38.pGLmK73GhpYQdInF4OeWqldk45JP1rcHKrSstOOf/WhLn2gye', '2026-01-25 15:39:58.423', '2026-02-24 15:39:58.420', NULL, NULL, NULL, NULL, NULL),
(11, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$RfxnPnPy1xwx/Kvul0tdk.bIvnV3u7.to1CW0uRB1rpVx4Eko701a', '2026-01-25 17:21:38.987', '2026-02-24 17:21:38.983', NULL, NULL, NULL, NULL, NULL),
(12, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$nHCAE/LhSswuJWQmOH9j/OpOJR1.Zga0Urkux72NNOKumgScFVQem', '2026-01-28 16:54:37.834', '2026-02-27 16:54:37.830', NULL, NULL, NULL, NULL, NULL),
(13, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$zIiUpqRhBsfTomiBXXY13.rnEuf1x2YenrB8sQ..HSLI9VdXCReO6', '2026-01-28 16:55:07.107', '2026-02-27 16:55:07.107', NULL, NULL, NULL, NULL, NULL),
(14, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$EkKXMlRBhgIbKFUU/PKxkubQObZL9TdlVr9yOmKmrA30Y8VUzwO1C', '2026-01-28 16:56:01.029', '2026-02-27 16:56:01.029', NULL, NULL, NULL, NULL, NULL),
(15, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$JLcnACPorH8QlQT/M1W6GuEhUCkYJ.ZB/.F4s/wZJPb3rmDPU3YNi', '2026-01-28 17:12:31.010', '2026-02-27 17:12:31.006', NULL, NULL, NULL, NULL, NULL),
(16, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$cNWsxo/dB2l3O8uVWmTuNu3VdFZsUyUuI9SqNVtKXpcp7M.R24lGu', '2026-01-28 17:16:06.475', '2026-02-27 17:16:06.472', NULL, NULL, NULL, NULL, NULL),
(17, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$1n/8bW9uWQkKaj2zIn8cGOxtyAJ3EGhC0Cbv.3guWeVtWNMbuzPES', '2026-01-28 17:23:04.278', '2026-02-27 17:23:04.274', NULL, NULL, NULL, NULL, NULL),
(18, '24c9d156-b006-4441-924b-3e6bf1e9dddb', '$2a$12$FKPb/YGBKArZPlRfCWXUEuTPK5bJI6RslpPjaSxUhPf5pD5YifRby', '2026-01-28 17:24:50.023', '2026-02-27 17:24:50.020', NULL, NULL, NULL, NULL, NULL);

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
-- Struktura tabeli dla tabeli `transformer_errors`
--

CREATE TABLE `transformer_errors` (
  `id` bigint NOT NULL,
  `transformer_id` char(36) NOT NULL,
  `code` varchar(64) NOT NULL,
  `message` varchar(255) NOT NULL,
  `status` enum('INFO','WARNING','ERROR') NOT NULL DEFAULT 'ERROR',
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
('24c9d156-b006-4441-924b-3e6bf1e9dddb', 'firkowskikuba@gmail.com', '$2a$12$dhTGmonBudwszJIJO97fYunawPjb5FtzQPm38OPMSN8JECvt2O7ba', 'USER', '2026-01-25 14:25:20');

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
-- Indeksy dla tabeli `meter`
--
ALTER TABLE `meter`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_code` (`device_code`),
  ADD KEY `fk_meter_transformer` (`transformer_id`);

--
-- Indeksy dla tabeli `meter_register`
--
ALTER TABLE `meter_register`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_register_meter` (`meter_id`);

--
-- Indeksy dla tabeli `metrics_1m_kv`
--
ALTER TABLE `metrics_1m_kv`
  ADD PRIMARY KEY (`transformer_id`,`key`,`bucket_ts`),
  ADD KEY `idx_1m_range` (`transformer_id`,`bucket_ts`);

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
-- Indeksy dla tabeli `transformer_errors`
--
ALTER TABLE `transformer_errors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transformer_errors_transformer_id` (`transformer_id`);

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
-- AUTO_INCREMENT dla tabeli `meter`
--
ALTER TABLE `meter`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `meter_register`
--
ALTER TABLE `meter_register`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `refresh_sessions`
--
ALTER TABLE `refresh_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT dla tabeli `transformer_errors`
--
ALTER TABLE `transformer_errors`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `device_api_keys`
--
ALTER TABLE `device_api_keys`
  ADD CONSTRAINT `fk_api_keys_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `meter`
--
ALTER TABLE `meter`
  ADD CONSTRAINT `fk_meter_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `meter_register`
--
ALTER TABLE `meter_register`
  ADD CONSTRAINT `fk_register_meter` FOREIGN KEY (`meter_id`) REFERENCES `meter` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `metrics_1m_kv`
--
ALTER TABLE `metrics_1m_kv`
  ADD CONSTRAINT `fk_1m_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;

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

--
-- Ograniczenia dla tabeli `transformer_errors`
--
ALTER TABLE `transformer_errors`
  ADD CONSTRAINT `fk_transformer_errors_transformer` FOREIGN KEY (`transformer_id`) REFERENCES `transformers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
