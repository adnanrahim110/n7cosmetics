-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 27, 2026 at 09:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `n7cosmetics`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrators`
--

CREATE TABLE `administrators` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('OWNER','MANAGER','FULFILLMENT') NOT NULL DEFAULT 'MANAGER',
  `status` enum('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `administrators`
--

INSERT INTO `administrators` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'N7 Local Administrator', 'admin@n7cosmetics.local', '$2b$12$ARbfNo1.NqzpkPttbcJAJOG8x25n2BOLpZpS64B5p4vs3wOIyigqq', 'OWNER', 'ACTIVE', '2026-08-27 19:47:57.720', '2026-08-21 22:07:59.607', '2026-08-27 19:47:57.720');

-- --------------------------------------------------------

--
-- Table structure for table `administrator_password_resets`
--

CREATE TABLE `administrator_password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `administrator_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `request_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_login_attempts`
--

CREATE TABLE `admin_login_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `succeeded` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_login_attempts`
--

INSERT INTO `admin_login_attempts` (`id`, `email`, `ip_address`, `succeeded`, `attempted_at`) VALUES
(1, 'admin@n7cosmetics.local', '::1', 1, '2026-08-21 22:09:34.807'),
(2, 'admin@n7cosmetics.local', '::1', 1, '2026-08-21 23:14:56.964'),
(3, 'admin@n7cosmetics.local', '::1', 1, '2026-08-24 19:53:31.274'),
(4, 'admin@n7cosmetics.local', '::1', 1, '2026-08-25 20:00:27.940'),
(5, 'admin@n7cosmetics.local', '::1', 1, '2026-08-26 23:18:25.612'),
(6, 'admin@n7cosmetics.local', '::1', 1, '2026-08-27 19:47:57.712');

-- --------------------------------------------------------

--
-- Table structure for table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `administrator_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `last_seen_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `revoked_at` datetime(3) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_sessions`
--

INSERT INTO `admin_sessions` (`id`, `administrator_id`, `token_hash`, `expires_at`, `last_seen_at`, `revoked_at`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, '0fa0550eafd5614f96613755699e9a35c43ddefcd19eadcdf39e8aee6a063ba8', '2026-08-22 10:09:34.813', '2026-08-22 03:22:14.767', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-21 22:09:34.815'),
(2, 1, 'd99468fe3054036f178acdbcae8fc167d43d8b353494edce04e4b793ed1d8343', '2026-08-22 11:14:56.989', '2026-08-22 02:22:29.120', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-21 23:14:56.991'),
(3, 1, '6e59c5712e74e6cbc8c33820a278d32a02ed382f3855aaa2c47e194403e6e449', '2026-08-25 07:53:31.298', '2026-08-25 05:36:42.098', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 19:53:31.305'),
(4, 1, '2c3861644257b3970eee212cf42b2f282a640cf8487572b79e18c04d1690de9e', '2026-08-26 08:00:27.951', '2026-08-25 22:54:43.053', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-25 20:00:27.952'),
(5, 1, '35cea1ca0e0c9b91bc97a02561f1464de268aeeb815cea7a3f11a8e85f4af626', '2026-08-27 11:18:25.639', '2026-08-27 03:40:04.951', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-08-26 23:18:25.643'),
(6, 1, 'f40d7d76853badffb9ff65c573cffbaf37e75c5a4675bd84551118f3c9d6fc32', '2026-08-28 07:47:57.725', '2026-08-28 00:09:49.402', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-08-27 19:47:57.729');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `administrator_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` varchar(80) DEFAULT NULL,
  `summary` varchar(255) NOT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `administrator_id`, `action`, `entity_type`, `entity_id`, `summary`, `metadata_json`, `ip_address`, `created_at`) VALUES
(1, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-21 22:09:34.825'),
(2, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-21 23:14:57.004'),
(3, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-24 19:53:31.320'),
(4, 1, 'PRODUCT_UPDATE', 'product', '146', 'Updated product Noir Extreme, Forbidden Love, French Oud', NULL, '::1', '2026-08-25 00:22:16.059'),
(5, 1, 'PRODUCT_UPDATE', 'product', '134', 'Updated product Jadore, YSL Libre,  French Oud', NULL, '::1', '2026-08-25 00:22:38.323'),
(6, 1, 'PRODUCT_UPDATE', 'product', '124', 'Updated product Goddess Burberry, Good Girl, Forbidden Love', NULL, '::1', '2026-08-25 00:22:50.682'),
(7, 1, 'PRODUCT_UPDATE', 'product', '111', 'Updated product Dark Moon, Indian Funk, Domestic Noir', NULL, '::1', '2026-08-25 00:23:17.149'),
(8, 1, 'PRODUCT_UPDATE', 'product', '91', 'Updated product Allure Home Sport, Sauvage, Legendary', NULL, '::1', '2026-08-25 00:23:32.281'),
(9, 1, 'PRODUCT_UPDATE', 'product', '108', 'Updated product City Walk, XS Night Extreme, Indian Funk', NULL, '::1', '2026-08-25 00:23:57.773'),
(10, 1, 'PRODUCT_UPDATE', 'product', '156', 'Updated product Passio', NULL, '::1', '2026-08-25 00:36:08.463'),
(11, 1, 'PRODUCT_UPDATE', 'product', '163', 'Updated product Pragma', NULL, '::1', '2026-08-25 00:36:31.561'),
(12, 1, 'PRODUCT_UPDATE', 'product', '96', 'Updated product Ardor', NULL, '::1', '2026-08-25 00:36:46.015'),
(13, 1, 'PRODUCT_UPDATE', 'product', '114', 'Updated product Devoir Elixer', NULL, '::1', '2026-08-25 00:36:57.467'),
(14, 1, 'PRODUCT_UPDATE', 'product', '160', 'Updated product Poem French Silver', NULL, '::1', '2026-08-25 00:37:27.840'),
(15, 1, 'PRODUCT_UPDATE', 'product', '159', 'Updated product Poem French Gold', NULL, '::1', '2026-08-25 00:37:41.082'),
(16, 1, 'PRODUCT_UPDATE', 'product', '158', 'Updated product Poem Arabic Silver', NULL, '::1', '2026-08-25 00:37:49.805'),
(17, 1, 'PRODUCT_UPDATE', 'product', '157', 'Updated product Poem Arabic Gold', NULL, '::1', '2026-08-25 00:37:59.995'),
(18, 1, 'PRODUCT_UPDATE', 'product', '162', 'Updated product Pour Homme', NULL, '::1', '2026-08-25 00:38:26.797'),
(19, 1, 'PRODUCT_UPDATE', 'product', '161', 'Updated product Pour Femme', NULL, '::1', '2026-08-25 00:42:13.625'),
(20, 1, 'PRODUCT_UPDATE', 'product', '167', 'Updated product Rendevous', NULL, '::1', '2026-08-25 00:51:17.154'),
(21, 1, 'PRODUCT_UPDATE', 'product', '110', 'Updated product Dark Moon', NULL, '::1', '2026-08-25 00:58:37.381'),
(22, 1, 'PRODUCT_UPDATE', 'product', '139', 'Updated product Memoir', NULL, '::1', '2026-08-25 00:58:52.526'),
(23, 1, 'PRODUCT_UPDATE', 'product', '182', 'Updated product Legendery', NULL, '::1', '2026-08-25 00:59:04.467'),
(24, 1, 'PRODUCT_UPDATE', 'product', '122', 'Updated product French Oud', NULL, '::1', '2026-08-25 01:06:26.766'),
(25, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.hero', 'Updated Hero products', NULL, '::1', '2026-08-25 01:08:37.246'),
(26, 1, 'PRODUCT_UPDATE', 'product', '130', 'Updated product Indian Funk', NULL, '::1', '2026-08-25 01:13:56.019'),
(27, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.hero', 'Updated Hero products', NULL, '::1', '2026-08-25 01:14:34.489'),
(28, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.signature-fragrances', 'Updated Signature Fragrances', NULL, '::1', '2026-08-25 01:16:15.659'),
(29, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.signature-fragrances', 'Updated Signature Fragrances', NULL, '::1', '2026-08-25 01:16:51.169'),
(30, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.signature-fragrances', 'Updated Signature Fragrances', NULL, '::1', '2026-08-25 01:20:42.531'),
(31, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.signature-fragrances', 'Updated Signature Fragrances', NULL, '::1', '2026-08-25 01:22:10.876'),
(32, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.signature-fragrances', 'Updated Signature Fragrances', NULL, '::1', '2026-08-25 01:22:28.138'),
(33, 1, 'PRODUCT_UPDATE', 'product', '107', 'Updated product City Walk', NULL, '::1', '2026-08-25 01:24:56.644'),
(34, 1, 'PRODUCT_UPDATE', 'product', '179', 'Updated product XS Night Extreme', NULL, '::1', '2026-08-25 01:29:32.906'),
(35, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.recreations', 'Updated Recreations Slider', NULL, '::1', '2026-08-25 01:32:28.941'),
(36, 1, 'PRODUCT_UPDATE', 'product', '121', 'Updated product Forbidden Love', NULL, '::1', '2026-08-25 01:36:02.916'),
(37, 1, 'PRODUCT_UPDATE', 'product', '103', 'Updated product Bloody Oud', NULL, '::1', '2026-08-25 01:36:11.389'),
(38, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.recreations', 'Updated Recreations Slider', NULL, '::1', '2026-08-25 01:37:18.785'),
(39, 1, 'PRODUCT_UPDATE', 'product', '143', 'Updated product Myth', NULL, '::1', '2026-08-25 01:44:46.815'),
(40, 1, 'PRODUCT_UPDATE', 'product', '173', 'Updated product Surreal', NULL, '::1', '2026-08-25 01:48:17.222'),
(41, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.fragrance-week', 'Updated Fragrance of the Week', NULL, '::1', '2026-08-25 01:50:25.978'),
(42, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.hero', 'Updated Hero products', NULL, '::1', '2026-08-25 01:51:22.972'),
(43, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.fragrance-week', 'Updated Fragrance of the Week', NULL, '::1', '2026-08-25 01:52:06.701'),
(44, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.scent-story', 'Updated Scent Story', NULL, '::1', '2026-08-25 01:53:55.099'),
(45, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.audience-collections', 'Updated Audience Collections', NULL, '::1', '2026-08-25 01:55:01.556'),
(46, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.audience-collections', 'Updated Audience Collections', NULL, '::1', '2026-08-25 01:55:21.504'),
(47, 1, 'PRODUCT_UPDATE', 'product', '97', 'Updated product Arousal', NULL, '::1', '2026-08-25 01:59:07.026'),
(48, 1, 'PRODUCT_UPDATE', 'product', '147', 'Updated product Nostalgia', NULL, '::1', '2026-08-25 02:01:54.372'),
(49, 1, 'PRODUCT_UPDATE', 'product', '116', 'Updated product Domestic Noir', NULL, '::1', '2026-08-25 02:03:34.397'),
(50, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'home.audience-collections', 'Updated Audience Collections', NULL, '::1', '2026-08-25 02:06:47.451'),
(51, 1, 'PRODUCT_UPDATE', 'product', '93', 'Updated product Anemoia', NULL, '::1', '2026-08-25 02:09:14.835'),
(52, 1, 'PRODUCT_UPDATE', 'product', '95', 'Updated product Arabella', NULL, '::1', '2026-08-25 02:14:24.053'),
(53, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:recreations.detail', 'Updated Recreations detail section', NULL, '::1', '2026-08-25 02:46:45.724'),
(54, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:recreations.detail', 'Updated Recreations detail section', NULL, '::1', '2026-08-25 02:46:50.479'),
(55, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:recreations.hero', 'Updated Recreations hero section', NULL, '::1', '2026-08-25 02:51:08.994'),
(56, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:premium-collection.hero', 'Updated Premium Collection hero section', NULL, '::1', '2026-08-25 02:53:05.097'),
(57, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:premium-collection.detail', 'Updated Premium Collection detail section', NULL, '::1', '2026-08-25 02:53:38.477'),
(58, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:yusuf-bhai-originals.hero', 'Updated Yusuf Bhai Originals hero section', NULL, '::1', '2026-08-25 02:55:07.569'),
(59, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:yusuf-bhai-originals.detail', 'Updated Yusuf Bhai Originals detail section', NULL, '::1', '2026-08-25 02:55:32.451'),
(60, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:yusuf-bhai-originals.detail', 'Updated Yusuf Bhai Originals detail section', NULL, '::1', '2026-08-25 02:55:37.040'),
(61, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:yusuf-bhai-originals.detail', 'Updated Yusuf Bhai Originals detail section', NULL, '::1', '2026-08-25 02:55:38.544'),
(62, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:bundles.hero', 'Updated Bundles hero section', NULL, '::1', '2026-08-25 02:56:30.206'),
(63, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:bundles.detail', 'Updated Bundles detail section', NULL, '::1', '2026-08-25 02:56:52.390'),
(64, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:bundles.detail', 'Updated Bundles detail section', NULL, '::1', '2026-08-25 02:56:52.778'),
(65, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 02:58:27.187'),
(66, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 02:58:38.234'),
(67, 1, 'SOCIAL_MEDIA_SETTINGS_UPDATE', 'site_settings', 'social.links', 'Updated 3 storefront social profiles', NULL, '::1', '2026-08-25 03:23:27.301'),
(68, 1, 'SETTINGS_UPDATE', 'site_settings', NULL, 'Updated global store settings', NULL, '::1', '2026-08-25 03:24:42.390'),
(69, 1, 'SETTINGS_UPDATE', 'site_settings', NULL, 'Updated global store settings', NULL, '::1', '2026-08-25 05:03:46.347'),
(70, 1, 'SETTINGS_UPDATE', 'site_settings', NULL, 'Updated global store settings', NULL, '::1', '2026-08-25 05:03:46.747'),
(71, 1, 'SETTINGS_UPDATE', 'site_settings', NULL, 'Updated global store settings', NULL, '::1', '2026-08-25 05:16:14.592'),
(72, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-25 20:00:27.960'),
(73, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 20:13:18.282'),
(74, 1, 'PRODUCT_UPDATE', 'product', '160', 'Updated product Poem French Silver', NULL, '::1', '2026-08-25 20:17:22.112'),
(75, 1, 'PRODUCT_UPDATE', 'product', '159', 'Updated product Poem French Gold', NULL, '::1', '2026-08-25 20:24:28.456'),
(76, 1, 'PRODUCT_UPDATE', 'product', '158', 'Updated product Poem Arabic Silver', NULL, '::1', '2026-08-25 20:24:36.922'),
(77, 1, 'PRODUCT_UPDATE', 'product', '157', 'Updated product Poem Arabic Gold', NULL, '::1', '2026-08-25 20:24:42.075'),
(78, 1, 'PRODUCT_UPDATE', 'product', '95', 'Updated product Arabella', NULL, '::1', '2026-08-25 20:47:31.170'),
(79, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:premium-collection.hero', 'Updated Premium Collection hero section', NULL, '::1', '2026-08-25 20:48:23.766'),
(80, 1, 'PRODUCT_UPDATE', 'product', '174', 'Updated product Tar', NULL, '::1', '2026-08-25 20:57:28.543'),
(81, 1, 'PRODUCT_UPDATE', 'product', '95', 'Updated product Arabella', NULL, '::1', '2026-08-25 22:12:57.770'),
(82, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 22:13:43.765'),
(83, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 22:13:50.105'),
(84, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-25 22:13:53.358'),
(85, 1, 'STOREFRONT_PAGE_UPDATE', 'page_section', 'collection-page:n7.detail', 'Updated N7 Collection detail section', NULL, '::1', '2026-08-25 22:49:54.944'),
(86, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-26 23:18:25.657'),
(87, 1, 'ADMIN_LOGIN', 'administrator', '1', 'Administrator signed in', NULL, '::1', '2026-08-27 19:47:57.747'),
(88, 1, 'BUNDLE_UPDATE', 'bundle', '146', 'Updated bundle Noir Extreme, Forbidden Love, French Oud', NULL, '::1', '2026-08-27 19:48:53.926'),
(89, 1, 'BUNDLE_UPDATE', 'bundle', '134', 'Updated bundle Jadore, YSL Libre,  French Oud', NULL, '::1', '2026-08-27 19:51:01.148'),
(90, 1, 'BUNDLE_UPDATE', 'bundle', '124', 'Updated bundle Goddess Burberry, Good Girl, Forbidden Love', NULL, '::1', '2026-08-27 19:51:24.827'),
(91, 1, 'BUNDLE_UPDATE', 'bundle', '111', 'Updated bundle Dark Moon, Indian Funk, Domestic Noir', NULL, '::1', '2026-08-27 19:51:47.793'),
(92, 1, 'BUNDLE_UPDATE', 'bundle', '108', 'Updated bundle City Walk, XS Night Extreme, Indian Funk', NULL, '::1', '2026-08-27 19:52:18.603'),
(93, 1, 'BUNDLE_UPDATE', 'bundle', '91', 'Updated bundle Allure Home Sport, Sauvage, Legendary', NULL, '::1', '2026-08-27 19:52:39.093'),
(94, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-27 21:19:10.041'),
(95, 1, 'SALE_UPDATE', 'sale', '1', 'Updated sale Buy 5, Get 1 Free', NULL, '::1', '2026-08-27 21:39:42.473'),
(96, 1, 'SALE_UPDATE', 'sale', '1', 'Updated sale Buy 5, Get 1 Free', NULL, '::1', '2026-08-27 22:01:36.590'),
(97, 1, 'STOREFRONT_CONTENT_UPDATE', 'page_section', 'global.header', 'Updated Header', NULL, '::1', '2026-08-27 22:06:21.333'),
(98, 1, 'PRODUCT_UPDATE', 'product', '95', 'Updated product Arabella', NULL, '::1', '2026-08-27 23:04:43.827'),
(99, 1, 'SALE_UPDATE', 'sale', '1', 'Updated sale Buy 5 Get 1 Free', NULL, '::1', '2026-08-28 00:09:49.447');

-- --------------------------------------------------------

--
-- Table structure for table `bundle_items`
--

CREATE TABLE `bundle_items` (
  `bundle_product_id` bigint(20) UNSIGNED NOT NULL,
  `component_variant_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bundle_items`
--

INSERT INTO `bundle_items` (`bundle_product_id`, `component_variant_id`, `quantity`, `sort_order`) VALUES
(91, 90, 1, 0),
(91, 170, 1, 1),
(91, 182, 1, 2),
(108, 107, 1, 0),
(108, 130, 1, 2),
(108, 179, 1, 1),
(111, 110, 1, 0),
(111, 116, 1, 2),
(111, 130, 1, 1),
(124, 121, 1, 2),
(124, 123, 1, 0),
(124, 125, 1, 1),
(134, 122, 1, 2),
(134, 133, 1, 0),
(134, 180, 1, 1),
(146, 121, 1, 1),
(146, 122, 1, 2),
(146, 145, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `status` enum('ACTIVE','HIDDEN') NOT NULL DEFAULT 'ACTIVE',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `image_url`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(88, NULL, 'Amouage', 'amouage', 'Amouage fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 0, '2026-08-25 00:15:33.827', '2026-08-25 00:15:34.051'),
(90, NULL, 'Clive Christian', 'clive-christian', 'Clive Christian fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 2, '2026-08-25 00:15:33.829', '2026-08-25 00:15:34.051'),
(91, NULL, 'Kilian', 'kilian', 'Kilian fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 3, '2026-08-25 00:15:33.829', '2026-08-25 00:15:34.051'),
(92, NULL, 'Le Labo', 'le-labo', 'Le Labo fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 4, '2026-08-25 00:15:33.829', '2026-08-25 00:15:34.051'),
(93, NULL, 'Mancera', 'mancera', 'Mancera fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 5, '2026-08-25 00:15:33.829', '2026-08-25 00:15:34.051'),
(94, NULL, 'Premium Collection', 'premium-collection', 'A considered edit of distinctive fragrances selected for depth, refinement and lasting presence. From polished woods to luminous signatures, every composition earns its place through character rather than convention.', '/media/2b40b514-ffe7-47d0-9b07-66cbf656abae', 'ACTIVE', 6, '2026-08-25 00:15:33.830', '2026-08-25 00:15:34.051'),
(95, NULL, 'Recreations', 'recreations', 'An expansive fragrance library inspired by celebrated scent profiles. Each composition revisits a familiar mood through the craftsmanship and character of the Yusuf Bhai atelier.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 7, '2026-08-25 00:15:33.830', '2026-08-25 00:15:34.051'),
(96, NULL, 'Unisex', 'unisex', 'Unisex fragrances available from N7 Cosmetics.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 8, '2026-08-25 00:15:33.830', '2026-08-25 00:15:34.051'),
(97, NULL, 'Yusuf Bhai Originals', 'yusuf-bhai-originals', 'Distinctive compositions created to move with every mood, moment and personality. From luminous citrus to deep woods and enveloping oud, each fragrance is an original expression of character.', '/media/9fef83a5-2796-4778-ba5a-5db0d2f9c7ad', 'ACTIVE', 9, '2026-08-25 00:15:33.830', '2026-08-25 00:15:34.051'),
(98, 94, 'Arabella', 'arabella', 'Arabella fragrances available from N7 Cosmetics.', '/media/7f7e43b6-7bf1-400f-a13a-317cbe60a0f7', 'ACTIVE', 10, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(99, 97, 'Deja Vu', 'deja-vu', 'Deja Vu fragrances from the Yusuf Bhai Originals collection.', '/media/9fef83a5-2796-4778-ba5a-5db0d2f9c7ad', 'ACTIVE', 11, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(100, 97, 'Noble', 'noble', 'Noble fragrances from the Yusuf Bhai Originals collection.', '/media/80c7e9fe-6312-4758-86b3-808d9d57cd9e', 'ACTIVE', 12, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(101, 97, 'Poem', 'poem', 'Poem fragrances from the Yusuf Bhai Originals collection.', '/media/2b40b514-ffe7-47d0-9b07-66cbf656abae', 'ACTIVE', 13, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(102, 97, 'Pour Femme', 'pour-femme', 'Pour Femme fragrances from the Yusuf Bhai Originals collection.', '/media/e5bf567d-766c-4b52-99dc-42001f82d7df', 'ACTIVE', 14, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(103, 97, 'Pour Homme', 'pour-homme', 'Pour Homme fragrances from the Yusuf Bhai Originals collection.', '/media/c5ba0f4b-0c76-4845-a9f6-c3266981ed1d', 'ACTIVE', 15, '2026-08-25 00:15:33.831', '2026-08-25 00:15:34.051'),
(104, 97, 'Teeb', 'teeb', 'Teeb fragrances from the Yusuf Bhai Originals collection.', '/media/af806103-549e-486c-8f4b-de5ed7142aa9', 'ACTIVE', 16, '2026-08-25 00:15:33.832', '2026-08-25 00:15:34.051'),
(105, 95, 'Yusuf Bhai Inspired By', 'yusuf-bhai-inspired-by', 'Yusuf Bhai Inspired By fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 17, '2026-08-25 00:15:33.832', '2026-08-25 00:15:34.051'),
(106, 105, 'Female', 'female', 'Female fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 18, '2026-08-25 00:15:33.832', '2026-08-25 00:15:34.051'),
(107, 105, 'Male', 'male', 'Male fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 19, '2026-08-25 00:15:33.832', '2026-08-25 00:15:34.051'),
(108, 106, 'Burberry', 'burberry', 'Burberry fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 20, '2026-08-25 00:15:33.832', '2026-08-25 00:15:34.051'),
(109, 106, 'Bvlgari', 'bvlgari', 'Bvlgari fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 21, '2026-08-25 00:15:33.833', '2026-08-25 00:15:34.051'),
(110, 106, 'Carolina Herrera', 'carolina-herrera', 'Carolina Herrera fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 22, '2026-08-25 00:15:33.833', '2026-08-25 00:15:34.051'),
(111, 107, 'Chanel', 'chanel', 'Chanel fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 23, '2026-08-25 00:15:33.833', '2026-08-25 00:15:34.051'),
(112, 107, 'Creed', 'creed-inspired-by', 'Creed fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 24, '2026-08-25 00:15:33.837', '2026-08-25 00:15:34.051'),
(113, 106, 'Creed', 'creed', 'Creed fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 25, '2026-08-25 00:15:33.838', '2026-08-25 00:15:34.051'),
(114, 107, 'dior', 'dior-inspired-by', 'dior fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 26, '2026-08-25 00:15:33.839', '2026-08-25 00:15:34.051'),
(115, 106, 'Dior', 'dior', 'Dior fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 27, '2026-08-25 00:15:33.839', '2026-08-25 00:15:34.051'),
(116, 107, 'Frederic Malle', 'frederic-malle', 'Frederic Malle fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 28, '2026-08-25 00:15:33.839', '2026-08-25 00:15:34.051'),
(117, 107, 'gucci', 'gucci', 'gucci fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 29, '2026-08-25 00:15:33.839', '2026-08-25 00:15:34.051'),
(118, 107, 'Hermes', 'hermes', 'Hermes fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 30, '2026-08-25 00:15:33.839', '2026-08-25 00:15:34.051'),
(119, 106, 'Jo Malone', 'jo-malone', 'Jo Malone fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 31, '2026-08-25 00:15:33.840', '2026-08-25 00:15:34.051'),
(120, 106, 'Lancome', 'lancome', 'Lancome fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 32, '2026-08-25 00:15:33.840', '2026-08-25 00:15:34.051'),
(121, 107, 'Louis Vuittion', 'louis-vuittion', 'Louis Vuittion fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 33, '2026-08-25 00:15:33.840', '2026-08-25 00:15:34.051'),
(122, 106, 'Louis Vuittion', 'louis-vuittion-inspired-by-female', 'Louis Vuittion fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 34, '2026-08-25 00:15:33.840', '2026-08-25 00:15:34.051'),
(123, 106, 'Maison Francis', 'maison-francis', 'Maison Francis fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 35, '2026-08-25 00:15:33.841', '2026-08-25 00:15:34.051'),
(124, 107, 'Pacco Rabanna', 'pacco-rabanna', 'Pacco Rabanna fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 36, '2026-08-25 00:15:33.841', '2026-08-25 00:15:34.051'),
(125, 106, 'Perfumes De Marly', 'perfumes-de-marly', 'Perfumes De Marly fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 37, '2026-08-25 00:15:33.841', '2026-08-25 00:15:34.051'),
(126, 107, 'Srk Special', 'srk-special-male', 'Srk Special fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 38, '2026-08-25 00:15:33.841', '2026-08-25 00:15:34.051'),
(127, 107, 'Tom Ford', 'tom-ford', 'Tom Ford fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 39, '2026-08-25 00:15:33.842', '2026-08-25 00:15:34.051'),
(128, 106, 'Van Cleef Arpels', 'van-cleef-arpels', 'Van Cleef Arpels fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 40, '2026-08-25 00:15:33.842', '2026-08-25 00:15:34.051'),
(129, 106, 'Viktor and Rolf', 'viktor-and-rolf', 'Viktor and Rolf fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 41, '2026-08-25 00:15:33.842', '2026-08-25 00:15:34.051'),
(130, 106, 'Ysl', 'ysl', 'Ysl fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 42, '2026-08-25 00:15:33.842', '2026-08-25 00:15:34.051'),
(131, 115, 'Christian', 'christian', 'Christian fragrances in the Yusuf Bhai recreation collection.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 43, '2026-08-25 00:15:33.843', '2026-08-25 00:15:34.051');

-- --------------------------------------------------------

--
-- Table structure for table `checkout_attempts`
--

CREATE TABLE `checkout_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `succeeded` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `collections`
--

CREATE TABLE `collections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `seo_title` varchar(190) DEFAULT NULL,
  `seo_description` varchar(320) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `collections`
--

INSERT INTO `collections` (`id`, `name`, `slug`, `description`, `image_url`, `status`, `sort_order`, `seo_title`, `seo_description`, `created_at`, `updated_at`) VALUES
(4, 'Yusuf Bhai Originals', 'yusuf-bhai-originals', 'Distinctive compositions created to move with every mood, moment and personality. From luminous citrus to deep woods and enveloping oud, each fragrance is an original expression of character.', '/media/9fef83a5-2796-4778-ba5a-5db0d2f9c7ad', 'ACTIVE', 0, 'Yusuf Bhai Originals | N7 Cosmetics', 'Distinctive compositions created to move with every mood, moment and personality. From luminous citrus to deep woods and enveloping oud, each fragrance is an…', '2026-08-25 00:15:33.844', '2026-08-25 00:15:34.057'),
(5, 'Premium Collection', 'premium-collection', 'A considered edit of distinctive fragrances selected for depth, refinement and lasting presence. From polished woods to luminous signatures, every composition earns its place through character rather than convention.', '/media/7f7e43b6-7bf1-400f-a13a-317cbe60a0f7', 'ACTIVE', 1, 'Premium Collection | N7 Cosmetics', 'A considered edit of distinctive fragrances selected for depth, refinement and lasting presence. From polished woods to luminous signatures, every composition…', '2026-08-25 00:15:33.845', '2026-08-25 00:15:34.057'),
(6, 'Recreations', 'recreations', 'An expansive fragrance library inspired by celebrated scent profiles. Each composition revisits a familiar mood through the craftsmanship and character of the Yusuf Bhai atelier.', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'ACTIVE', 2, 'Recreations | N7 Cosmetics', 'An expansive fragrance library inspired by celebrated scent profiles. Each composition revisits a familiar mood through the craftsmanship and character of the…', '2026-08-25 00:15:33.846', '2026-08-25 00:15:34.057'),
(7, 'Sale', 'sale', 'A changing selection of fragrances and sets offered at a considered price for a limited time. Availability is intentionally finite, and the edit changes as pieces sell through.', NULL, 'ACTIVE', 3, 'Sale | N7 Cosmetics', 'A changing selection of fragrances and sets offered at a considered price for a limited time. Availability is intentionally finite, and the edit changes as…', '2026-08-25 00:15:33.847', '2026-08-25 00:15:33.847'),
(9, 'N7 Collection', 'n7', 'A signature edit shaped by the N7 point of view: expressive fragrances chosen for presence, individuality and lasting character.', NULL, 'ACTIVE', 5, 'N7 Collection | N7 Cosmetics', 'Discover the N7 Collection: expressive fragrances selected for presence, individuality and lasting character.', '2026-08-25 22:10:36.601', '2026-08-25 22:10:36.601');

-- --------------------------------------------------------

--
-- Table structure for table `contact_form_attempts`
--

CREATE TABLE `contact_form_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `succeeded` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `discount_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(80) NOT NULL,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `per_email_limit` int(10) UNSIGNED DEFAULT NULL,
  `used_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupon_redemptions`
--

CREATE TABLE `coupon_redemptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `coupon_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `customer_email` varchar(190) NOT NULL,
  `discount_pence` int(10) UNSIGNED NOT NULL,
  `redeemed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discounts`
--

CREATE TABLE `discounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(190) NOT NULL,
  `method` enum('AUTOMATIC','COUPON') NOT NULL,
  `discount_type` enum('PERCENTAGE','FIXED_AMOUNT','FREE_SHIPPING') NOT NULL,
  `value` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `applies_to` enum('ALL','PRODUCTS','CATEGORIES','COLLECTIONS') NOT NULL DEFAULT 'ALL',
  `minimum_subtotal_pence` int(10) UNSIGNED DEFAULT NULL,
  `maximum_discount_pence` int(10) UNSIGNED DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `starts_at` datetime(3) DEFAULT NULL,
  `ends_at` datetime(3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_categories`
--

CREATE TABLE `discount_categories` (
  `discount_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_collections`
--

CREATE TABLE `discount_collections` (
  `discount_id` bigint(20) UNSIGNED NOT NULL,
  `collection_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_products`
--

CREATE TABLE `discount_products` (
  `discount_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `recipient` varchar(190) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template_key` varchar(100) NOT NULL,
  `status` enum('SENT','FAILED','SKIPPED') NOT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_assets`
--

CREATE TABLE `media_assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `storage_key` varchar(500) NOT NULL,
  `public_url` varchar(1000) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` bigint(20) UNSIGNED NOT NULL,
  `width` int(10) UNSIGNED DEFAULT NULL,
  `height` int(10) UNSIGNED DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `media_assets`
--

INSERT INTO `media_assets` (`id`, `storage_key`, `public_url`, `original_name`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`, `uploaded_by`, `created_at`) VALUES
(2, 'products/images/2026/08/0032ab90-a432-4b64-92cd-10c220ced8a2.png', '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', '5.png', 'image/png', 570504, NULL, NULL, 'Absolu Aventus product image', NULL, '2026-08-25 00:15:33.794'),
(3, 'products/images/2026/08/2db2dd5b-9897-430a-8ab9-f1962d7667b4.webp', '/media/9779582a-974e-472e-8ac7-6980dc3d1445', 'Group-105950.webp', 'image/webp', 15762, NULL, NULL, 'Allure Home Sport, Sauvage, Legendary', NULL, '2026-08-25 00:15:33.796'),
(4, 'products/images/2026/08/67312230-6d07-4c74-8f1c-76e16592385a.png', '/media/9fef83a5-2796-4778-ba5a-5db0d2f9c7ad', 'Deja-Vu.png', 'image/png', 171733, NULL, NULL, 'Anemoia', NULL, '2026-08-25 00:15:33.797'),
(5, 'products/images/2026/08/1dbe6959-4a62-4e84-9444-89b8460c7edb.webp', '/media/7f7e43b6-7bf1-400f-a13a-317cbe60a0f7', 'Frame-33-1.webp', 'image/webp', 82184, NULL, NULL, 'ARABELLA PERFUME', NULL, '2026-08-25 00:15:33.797'),
(6, 'products/images/2026/08/3739fe27-4239-4612-9dfb-972f53b58574.png', '/media/80c7e9fe-6312-4758-86b3-808d9d57cd9e', 'Noble-1.png', 'image/png', 126280, NULL, NULL, 'Ardor', NULL, '2026-08-25 00:15:33.797'),
(8, 'products/images/2026/08/a96c27c9-b591-4be2-b212-cd8c59551a9b.png', '/media/af806103-549e-486c-8f4b-de5ed7142aa9', 'Teeb1.png', 'image/png', 178769, NULL, NULL, 'Bloody Oud', NULL, '2026-08-25 00:15:33.809'),
(14, 'products/images/2026/08/e6af9d88-ae29-40d7-9efb-7be1e517cfeb.webp', '/media/0727eebc-5f3d-401d-8873-3d9642cf8db4', 'Frame-34.webp', 'image/webp', 21618, NULL, NULL, 'Devoir Elixer', NULL, '2026-08-25 00:15:33.811'),
(15, 'products/images/2026/08/4c1f650a-3e27-485e-8426-6b3bfa335a50.webp', '/media/6c84119e-68ea-461e-8191-280bc7265059', 'Frame-33.webp', 'image/webp', 12626, NULL, NULL, 'Frame 33', NULL, '2026-08-25 00:15:33.811'),
(27, 'products/images/2026/08/22fdc638-5419-4715-8913-358de3f6541d.webp', '/media/2b40b514-ffe7-47d0-9b07-66cbf656abae', 'Artboard_80-100.webp', 'image/webp', 25438, NULL, NULL, 'Artboard_80-100', NULL, '2026-08-25 00:15:33.815'),
(31, 'products/images/2026/08/ddebd715-e0a1-4130-8d03-446b5932758c.webp', '/media/e5bf567d-766c-4b52-99dc-42001f82d7df', 'Pour-Femme.webp', 'image/webp', 17772, NULL, NULL, 'Pour Femme', NULL, '2026-08-25 00:15:33.816'),
(32, 'products/images/2026/08/de89e8a6-bcfc-4489-a0e1-67ff9cf6e294.png', '/media/c5ba0f4b-0c76-4845-a9f6-c3266981ed1d', 'Pour-Homme.png', 'image/png', 71233, NULL, NULL, 'Pour Homme', NULL, '2026-08-25 00:15:33.816'),
(38, 'products/images/2026/08/2c5d603f-2544-42aa-8de4-8b14af0c47ad.png', '/media/774c0ac8-aea7-44fb-9e67-e73af6479cd7', '5.png', 'image/png', 570504, NULL, NULL, 'Noir Extreme, Forbidden Love, French Oud product image', 1, '2026-08-25 00:22:16.005'),
(39, 'products/images/2026/08/379d97fd-fe5d-4a9d-ae5d-0881f9dac135.png', '/media/c252e92c-c5c7-4adf-a4ba-71209ab657a0', '5.png', 'image/png', 570504, NULL, NULL, 'Jadore, YSL Libre,  French Oud product image', 1, '2026-08-25 00:22:38.289'),
(40, 'products/images/2026/08/729ab5de-b741-4e39-b73c-7617fc4e9539.png', '/media/fb1ee5f0-557b-4221-8de5-81031189713b', '5.png', 'image/png', 570504, NULL, NULL, 'Goddess Burberry, Good Girl, Forbidden Love product image', 1, '2026-08-25 00:22:50.644'),
(41, 'products/images/2026/08/eb1db6e6-912e-4dfb-994a-2e666f2121e2.png', '/media/4413d81a-8f04-44d3-a4e5-75d3e009a2cc', '5.png', 'image/png', 570504, NULL, NULL, 'Dark Moon, Indian Funk, Domestic Noir product image', 1, '2026-08-25 00:23:17.127'),
(42, 'products/images/2026/08/74862a09-fd50-414e-b289-d36352086d53.png', '/media/85533024-de01-4662-ae21-7d6811232f6c', '5.png', 'image/png', 570504, NULL, NULL, 'Allure Home Sport, Sauvage, Legendary product image', 1, '2026-08-25 00:23:32.261'),
(43, 'products/images/2026/08/0b9a76ac-2eff-4fa6-a32e-5646d080ddb6.png', '/media/057638a2-6d77-4617-a83b-555c5aefcafb', '5.png', 'image/png', 570504, NULL, NULL, 'City Walk, XS Night Extreme, Indian Funk product image', 1, '2026-08-25 00:23:57.726'),
(44, 'products/images/2026/08/b678298e-a73b-4ba4-880a-2993574d24c2.png', '/media/c1f59bda-0f1a-4922-965e-05b7712bbfea', '2.png', 'image/png', 1800768, NULL, NULL, 'Passio product image', 1, '2026-08-25 00:36:08.427'),
(45, 'products/images/2026/08/fc542ef9-5672-4a6a-bbf1-d9c652de2eac.png', '/media/e31dda77-5d33-4103-bb93-76361f17ace3', '4.png', 'image/png', 850650, NULL, NULL, 'Pragma product image', 1, '2026-08-25 00:36:31.537'),
(46, 'products/images/2026/08/e409b154-5fc6-4c76-9e40-15aa2d24da9f.png', '/media/72f5ad71-f5f0-4e4a-a665-1f1eb5f2e096', '3.png', 'image/png', 1733076, NULL, NULL, 'Ardor product image', 1, '2026-08-25 00:36:45.994'),
(47, 'products/images/2026/08/92200de4-8919-450b-ac1c-69ca68435939.png', '/media/ae01b2d8-4e0a-4bbb-b738-6a2d094db682', '1.png', 'image/png', 855228, NULL, NULL, 'Devoir Elixer product image', 1, '2026-08-25 00:36:57.424'),
(48, 'products/images/2026/08/7d759119-0073-45dc-907d-dd51f99318f2.png', '/media/ce957eb1-29be-4616-b366-7628129d80fa', '14.png', 'image/png', 1271044, NULL, NULL, 'Poem French Silver product image', 1, '2026-08-25 00:37:27.793'),
(49, 'products/images/2026/08/b861c9bd-aae8-4f4d-b0d6-46ce9bd29518.png', '/media/c5947abc-cab7-4c8c-b7bc-1a8520abd156', '14.png', 'image/png', 1271044, NULL, NULL, 'Poem French Gold product image', 1, '2026-08-25 00:37:41.060'),
(50, 'products/images/2026/08/9b796e1b-027a-47e0-a0cb-3bb4b6044a58.png', '/media/5511c59b-4f69-4026-a3fe-23f59175bd96', '14.png', 'image/png', 1271044, NULL, NULL, 'Poem Arabic Silver product image', 1, '2026-08-25 00:37:49.782'),
(51, 'products/images/2026/08/0530f070-c3f9-44fa-a042-db2c704c5e11.png', '/media/48ec4573-2f48-4d6f-a79c-79ef60f091ec', '14.png', 'image/png', 1271044, NULL, NULL, 'Poem Arabic Gold product image', 1, '2026-08-25 00:37:59.955'),
(52, 'products/images/2026/08/dc261e50-9e5e-49da-a2a8-e39bc23c6a34.png', '/media/2c43adc1-3166-4e63-bbb6-5b3bf4293f81', '13.png', 'image/png', 1045001, NULL, NULL, 'Pour Homme product image', 1, '2026-08-25 00:38:26.771'),
(53, 'products/images/2026/08/73c87933-4aff-48c9-9507-f1a94f94c582.png', '/media/c8b31234-c7e4-40b5-8bf5-37537051f421', '12.png', 'image/png', 1099191, NULL, NULL, 'Pour Femme product image', 1, '2026-08-25 00:42:13.595'),
(54, 'products/images/2026/08/81237116-524d-4e2b-a46f-334e0b8b021f.png', '/media/ba471c7b-c9e7-4d26-951f-40446b6ee14f', 'ChatGPT Image Aug 25, 2026, 12_47_18 AM.png', 'image/png', 1268519, NULL, NULL, 'Rendevous product image', 1, '2026-08-25 00:51:17.111'),
(55, 'products/images/2026/08/b981249a-2e5e-4350-afcd-d24f3f50969c.png', '/media/8bc58aeb-20d4-48bc-bfcf-d07a073a9cc1', 'ChatGPT Image Aug 25, 2026, 12_54_12 AM.png', 'image/png', 1472202, NULL, NULL, 'Dark Moon product image', 1, '2026-08-25 00:58:37.318'),
(56, 'products/images/2026/08/23a3de36-41ac-4457-b275-9a8ee31a9c2b.png', '/media/c60d16aa-9d65-4787-9cc1-77459b4648f4', 'ChatGPT Image Aug 25, 2026, 12_47_53 AM.png', 'image/png', 1768825, NULL, NULL, 'Memoir product image', 1, '2026-08-25 00:58:52.488'),
(57, 'products/images/2026/08/13b38fe1-4f8c-4bd5-8275-e096f9d91eb2.png', '/media/73aa391c-7296-4323-a6c4-657d6b01d12d', 'ChatGPT Image Aug 25, 2026, 12_51_31 AM.png', 'image/png', 1322207, NULL, NULL, 'Legendery product image', 1, '2026-08-25 00:59:04.413'),
(58, 'products/images/2026/08/a13cc1d6-6366-41c0-a545-269c6fdf0b1a.png', '/media/59893720-1a18-4157-8222-d0a62505ed39', 'ChatGPT Image Aug 25, 2026, 01_04_00 AM.png', 'image/png', 1267360, NULL, NULL, 'French Oud product image', 1, '2026-08-25 01:06:26.710'),
(59, 'homepage/images/2026/08/4bc92db6-1cac-4455-87b7-8144fded82ad.png', '/media/3acb82cc-548e-4276-bdf3-98565188a91a', 'h2.png', 'image/png', 654848, NULL, NULL, 'Devoir promotional image', 1, '2026-08-25 01:08:37.212'),
(60, 'homepage/images/2026/08/0ab7a364-682d-4f41-90be-f83c6d3eb464.png', '/media/5d8a8c62-bc9d-44b1-bc54-cbe73a04ef57', 'h3.png', 'image/png', 670080, NULL, NULL, 'Passio promotional image', 1, '2026-08-25 01:08:37.218'),
(61, 'homepage/images/2026/08/a9abbd17-1427-46dc-99a2-2ceeae8b3bdd.png', '/media/129aa6e0-c266-46ea-aef9-2472af0fda42', 'h4.png', 'image/png', 623569, NULL, NULL, 'Ardor promotional image', 1, '2026-08-25 01:08:37.224'),
(62, 'homepage/images/2026/08/d83d047c-9c1a-4319-bb99-dacf55b3cea4.png', '/media/176acce8-6b75-4faf-8662-fed5fd786816', 'h5.png', 'image/png', 715671, NULL, NULL, 'Pragma promotional image', 1, '2026-08-25 01:08:37.229'),
(63, 'products/images/2026/08/575e1706-f9b6-4b8d-b789-7ab52580a94f.png', '/media/b68794f2-adcc-4710-83c2-d89fdba08192', 'ChatGPT Image Aug 25, 2026, 01_12_05 AM.png', 'image/png', 1263245, NULL, NULL, 'Indian Funk product image', 1, '2026-08-25 01:13:55.959'),
(64, 'products/images/2026/08/bc3d1fa4-1739-4dd7-926e-f6f7aeae0520.png', '/media/3d7dd828-0414-42db-a973-fc480d82298a', 'ChatGPT Image Aug 25, 2026, 01_22_44 AM.png', 'image/png', 1383543, NULL, NULL, 'City Walk product image', 1, '2026-08-25 01:24:56.586'),
(65, 'products/images/2026/08/56335543-954e-4337-a717-e75b97767888.png', '/media/e966e024-bfe3-4921-aeca-82abc853c391', 'ChatGPT Image Aug 25, 2026, 01_26_43 AM.png', 'image/png', 794402, NULL, NULL, 'XS Night Extreme product image', 1, '2026-08-25 01:29:32.856'),
(66, 'products/images/2026/08/3555729f-5f33-4508-9f1d-59e9c6d12546.png', '/media/aadc536c-996e-46c7-a2e5-8ec1169bbcf6', 'ChatGPT Image Aug 25, 2026, 01_29_49 AM.png', 'image/png', 1270129, NULL, NULL, 'Forbidden Love product image', 1, '2026-08-25 01:36:02.876'),
(67, 'products/images/2026/08/a5b4b057-761f-4b1a-9183-bbef694d0566.png', '/media/9eec7f7f-da48-4d9c-b14b-a6f0e8c12135', 'ChatGPT Image Aug 25, 2026, 01_33_21 AM.png', 'image/png', 1222334, NULL, NULL, 'Bloody Oud product image', 1, '2026-08-25 01:36:11.352'),
(68, 'products/images/2026/08/57e8c4b6-b913-42f9-8c59-109589e56b8a.png', '/media/8cceb039-c259-46e0-8688-1ac6007dcc6f', 'ChatGPT Image Aug 25, 2026, 01_43_05 AM.png', 'image/png', 1738277, NULL, NULL, 'Myth product image', 1, '2026-08-25 01:44:46.737'),
(69, 'products/images/2026/08/7a346887-5047-48de-b8a8-75bb5b6d1a9a.png', '/media/ad7adf92-b190-4ce5-9af1-f27f8527f3a5', 'ChatGPT Image Aug 25, 2026, 01_39_17 AM.png', 'image/png', 741602, 2048, 3072, 'Tar by Yusuf Bhai product image', NULL, '2026-08-25 01:47:03.978'),
(70, 'products/images/2026/08/b6061c8c-b5b9-408b-b39f-63ea1e03b7f6.png', '/media/89021192-03ad-4079-aa28-c22e99db2011', 'ChatGPT Image Aug 25, 2026, 01_46_24 AM.png', 'image/png', 2116476, NULL, NULL, 'Surreal product image', 1, '2026-08-25 01:48:17.190'),
(71, 'homepage/images/2026/08/11ea6d8e-0d65-48bf-b474-dd7124b628a6.png', '/media/f18a5235-c859-456b-bf8f-d031dcccbb9d', 'magnific__background__40991.png', 'image/png', 694785, NULL, NULL, 'Tar promotional image', 1, '2026-08-25 01:51:22.963'),
(72, 'homepage/images/2026/08/83b74148-721d-4995-9b92-036b48b13471.png', '/media/de1fe16c-9e43-4fd1-9659-ad2f52f39aa7', 'dc261e50-9e5e-49da-a2a8-e39bc23c6a34.png', 'image/png', 1045001, NULL, NULL, 'For Him product image', 1, '2026-08-25 01:55:01.535'),
(74, 'homepage/images/2026/08/a58c3850-6212-4729-b9dd-703fe2033ab9.png', '/media/9088dadb-5e0d-4497-806c-3200f0dd103c', '73c87933-4aff-48c9-9507-f1a94f94c582.png', 'image/png', 1099191, NULL, NULL, 'For Her product image', 1, '2026-08-25 01:55:21.483'),
(75, 'products/images/2026/08/a253f462-1ced-4605-8cce-3e291a5b873b.png', '/media/4a9a05c9-f52e-4bc7-bb5a-41a29207d1ff', 'Group 1.png', 'image/png', 2030647, NULL, NULL, 'Arousal product image', 1, '2026-08-25 01:59:06.989'),
(76, 'products/images/2026/08/d5200e5f-85e1-4b0b-bb08-9ca74f1c9c6d.png', '/media/13afe80f-5ea5-4ab6-8e2d-21c0e8090a2d', 'ChatGPT Image Aug 25, 2026, 01_59_19 AM.png', 'image/png', 1787489, NULL, NULL, 'Nostalgia product image', 1, '2026-08-25 02:01:54.339'),
(77, 'products/images/2026/08/d4ff3f7c-a805-494d-a93e-176e61f35cf2.png', '/media/3bd6982f-fe34-4630-aa5d-3f33923adaf0', 'ChatGPT Image Aug 25, 2026, 02_02_24 AM.png', 'image/png', 1369021, NULL, NULL, 'Domestic Noir product image', 1, '2026-08-25 02:03:34.368'),
(78, 'products/images/2026/08/5e50e1d6-d910-4aa0-9f63-ca189ebf5c1d.png', '/media/26850e1a-cd56-4ace-89f2-80585bdb29e3', 'ChatGPT Image Aug 25, 2026, 02_07_35 AM.png', 'image/png', 922483, NULL, NULL, 'Anemoia product image', 1, '2026-08-25 02:09:14.814'),
(79, 'products/images/2026/08/fe811c17-1457-4154-972a-45bb46882f60.png', '/media/53265fcb-55ed-44f2-b568-b03bcef9b857', 'ChatGPT Image Aug 25, 2026, 02_13_07 AM.png', 'image/png', 2916555, NULL, NULL, 'Arabella product image', 1, '2026-08-25 02:14:24.035');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(32) NOT NULL,
  `status` enum('NEW','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'NEW',
  `payment_status` enum('UNPAID','PENDING','PAID','PARTIALLY_REFUNDED','REFUNDED','FAILED') NOT NULL DEFAULT 'UNPAID',
  `fulfillment_status` enum('UNFULFILLED','PARTIAL','FULFILLED','RETURNED') NOT NULL DEFAULT 'UNFULFILLED',
  `currency` char(3) NOT NULL DEFAULT 'GBP',
  `customer_email` varchar(190) NOT NULL,
  `customer_name` varchar(190) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `subtotal_pence` int(10) UNSIGNED NOT NULL,
  `discount_pence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `shipping_pence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `tax_pence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_pence` int(10) UNSIGNED NOT NULL,
  `coupon_code` varchar(80) DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `payment_provider` varchar(80) DEFAULT NULL,
  `payment_reference` varchar(190) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `placed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_addresses`
--

CREATE TABLE `order_addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `address_type` enum('BILLING','SHIPPING') NOT NULL,
  `full_name` varchar(190) NOT NULL,
  `company` varchar(190) DEFAULT NULL,
  `line_1` varchar(190) NOT NULL,
  `line_2` varchar(190) DEFAULT NULL,
  `city` varchar(120) NOT NULL,
  `region` varchar(120) DEFAULT NULL,
  `postal_code` varchar(30) NOT NULL,
  `country_code` char(2) NOT NULL,
  `phone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `variant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(190) NOT NULL,
  `variant_title` varchar(150) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `unit_price_pence` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `discount_pence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `line_total_pence` int(10) UNSIGNED NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `administrator_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `page_sections`
--

CREATE TABLE `page_sections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `page_key` varchar(100) NOT NULL,
  `section_key` varchar(100) NOT NULL,
  `section_type` varchar(100) NOT NULL,
  `display_name` varchar(150) NOT NULL,
  `content_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content_json`)),
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `page_sections`
--

INSERT INTO `page_sections` (`id`, `page_key`, `section_key`, `section_type`, `display_name`, `content_json`, `is_enabled`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'home', 'hero', 'fixed', 'Hero products', '{\"productIds\":[\"114\",\"156\",\"96\",\"163\",\"174\"],\"products\":[{\"productId\":\"114\",\"title\":\"Devoir\",\"tagline\":\"\",\"description\":\"A luxurious scent combining rich warmth, spice, depth, and sophistication.\",\"image\":\"/media/3acb82cc-548e-4276-bdf3-98565188a91a\"},{\"productId\":\"156\",\"title\":\"Passio\",\"tagline\":\"\",\"description\":\"A vibrant fragrance blending fresh energy, warm depth, and elegance.\",\"image\":\"/media/5d8a8c62-bc9d-44b1-bc54-cbe73a04ef57\"},{\"productId\":\"96\",\"title\":\"Ardor\",\"tagline\":\"\",\"description\":\"An elegant fragrance blending soft freshness, warmth, sweetness, and allure.\",\"image\":\"/media/129aa6e0-c266-46ea-aef9-2472af0fda42\"},{\"productId\":\"163\",\"title\":\"Pragma\",\"tagline\":\"\",\"description\":\"A refined scent balancing fresh notes, soft warmth, and charm.\",\"image\":\"/media/176acce8-6b75-4faf-8662-fed5fd786816\"},{\"productId\":\"174\",\"title\":\"Tar\",\"tagline\":\"\",\"description\":\"A bold fragrance delivering smoky woods, dark depth, and confidence.\",\"image\":\"/media/f18a5235-c859-456b-bf8f-d031dcccbb9d\"}]}', 1, 0, '2026-08-25 01:08:37.231', '2026-08-25 01:51:22.965'),
(3, 'home', 'signature-fragrances', 'fixed', 'Signature Fragrances', '{\"eyebrow\":\"REIMAGINED BY DUBAI’S PERFUME DOCTOR\",\"titleLead\":\"Yusuf Bhai\",\"titleAccent\":\"Inspired Collection\",\"description\":\"Recreated by Yusuf Bhai, the Perfume Doctor never dupes, only his artistry, magic, and masterful interpretation.\",\"ctaLabel\":\"Explore Collection\",\"ctaUrl\":\"/recreations\",\"productIds\":[\"88\",\"181\",\"89\",\"90\",\"99\",\"100\",\"104\",\"127\"]}', 1, 0, '2026-08-25 01:16:15.645', '2026-08-25 01:22:28.124'),
(8, 'home', 'recreations', 'fixed', 'Recreations Slider', '{\"label\":\"Yusuf Bhai Original Collection\",\"description\":\"A meticulously crafted original fragrance by Yusuf Bhai, shaped with signature artistry, rich character, and timeless appeal.\",\"ctaLabel\":\"Discover Details\",\"productIds\":[\"96\",\"114\",\"163\",\"156\",\"161\",\"162\"]}', 1, 0, '2026-08-25 01:32:28.929', '2026-08-25 01:37:18.775'),
(10, 'home', 'fragrance-week', 'fixed', 'Fragrance of the Week', '{\"productId\":\"174\",\"eyebrow\":\"The weekly edit\",\"description\":\"A bold expression of depth, blending smoky woods with dark warmth and magnetic intensity. Crafted for moments that demand a lasting impression.\",\"ctaLabel\":\"Discover Tar\",\"ctaUrl\":\"/products/tar\"}', 1, 0, '2026-08-25 01:50:25.967', '2026-08-25 01:52:06.695'),
(13, 'home', 'scent-story', 'fixed', 'Scent Story', '{\"eyebrow\":\"BEHIND THE FRAGRANCE\",\"titleLead\":\"THE ART\",\"titleAccent\":\"of fragrance\",\"description\":\"Yusuf Bhai, Dubai’s award-winning Perfume Doctor, transforms fragrance into art. Decades of experience, instinct and craftsmanship come together in every creation — each scent carrying his signature character, depth and unmistakable magic.\",\"quote\":\"Fragrance is more than a scent. It is art, emotion and identity.\",\"filmLabel\":\"YUSUF BHAI — THE PERFUME DOCTOR\",\"duration\":\"01:17\",\"mainVideo\":\"/videos/v3.mp4\",\"detailVideo\":\"/videos/v1.mp4\"}', 1, 0, '2026-08-25 01:53:55.092', '2026-08-25 01:53:55.092'),
(14, 'home', 'audience-collections', 'fixed', 'Audience Collections', '{\"title\":\"CRAFTED BY YUSUF BHAI\",\"description\":\"Distinctive creations shaped by decades of artistry, instinct and expertise — each fragrance carrying the unmistakable touch of Dubai’s Perfume Doctor.\",\"cards\":[{\"eyebrow\":\"THE MASCULINE EDIT\",\"title\":\"For Him\",\"description\":\"Pour Homme blends structured woods, refined spice and bold depth for a confident presence that speaks without words.\",\"ctaLabel\":\"EXPLORE POUR HOMME\",\"ctaUrl\":\"/products/pour-homme\",\"image\":\"/media/de1fe16c-9e43-4fd1-9659-ad2f52f39aa7\",\"background\":\"/imgs/categories/cat_masculine.png\"},{\"eyebrow\":\"The feminine edit\",\"title\":\"For Her\",\"description\":\"Pour Femme blends radiant florals, sumptuous warmth and graceful depth for an elegant presence designed to linger.\",\"ctaLabel\":\"EXPLORE POUR FEMME\",\"ctaUrl\":\"/products/pour-femme\",\"image\":\"/media/9088dadb-5e0d-4497-806c-3200f0dd103c\",\"background\":\"/imgs/backgrounds/bg_rose.png\"}]}', 1, 0, '2026-08-25 01:55:01.552', '2026-08-25 02:06:47.438'),
(17, 'collection-page:recreations', 'detail', 'fixed', 'Detail section', '{\"eyebrow\": \"YUSUF BHAI / INSPIRED BY COLLECTION\", \"title\": \"THE INSPIRED EDIT\", \"description\": \"Not a dupe. Not a copy. A Yusuf Bhai interpretation.\", \"credit\": \"OFFICIALLY DISTRIBUTED IN THE UK BY N7 COSMETICS\"}', 1, 20, '2026-08-25 02:46:45.675', '2026-08-25 03:08:21.186'),
(19, 'collection-page:recreations', 'hero', 'fixed', 'Hero section', '{\"eyebrow\":\"ICONIC INSPIRATION / YUSUF BHAI ARTISTRY\",\"title\":{\"lead\":\"The Art of\",\"accent\":\"inspiration\"},\"intro\":\"These are not dupes or simple recreations. Yusuf Bhai draws inspiration from some of the world’s most celebrated fragrances, then interprets them through more than 40 years of perfumery mastery — creating his own expression at a more accessible price. With over 5 million followers and recognition from Dior, his Inspired By Collection has become loved by fragrance enthusiasts around the world.\",\"statement\":\"Familiar inspiration. Reimagined through the hands of the Perfume Doctor.\",\"highlights\":[\"INSPIRED BY ICONIC FRAGRANCES\",\"REIMAGINED BY YUSUF BHAI\",\"ACCESSIBLE LUXURY, DISTINCTIVE CHARACTER\"],\"productIds\":[]}', 1, 10, '2026-08-25 02:51:08.975', '2026-08-25 02:51:08.975'),
(20, 'collection-page:premium-collection', 'hero', 'fixed', 'Hero section', '{\"eyebrow\":\"YUSUF BHAI / PREMIUM SELECTION\",\"title\":{\"lead\":\"THE PREMIUM\",\"accent\":\"Collection\"},\"intro\":\"A refined selection from Yusuf Bhai’s premium collection, created with richer character, remarkable depth and an unmistakable signature. Each fragrance reflects the artistry of the Perfume Doctor, crafted for those who value distinction, presence and lasting impression.\",\"statement\":\"Created for those who expect more from every fragrance.\",\"highlights\":[\"SIGNATURE YUSUF BHAI CREATIONS\",\"RICH & DISTINCTIVE PROFILES\",\"CRAFTED FOR LASTING PRESENCE\"],\"productIds\":[\"157\",\"158\",\"159\"]}', 1, 10, '2026-08-25 02:53:05.090', '2026-08-25 20:48:23.757'),
(21, 'collection-page:premium-collection', 'detail', 'fixed', 'Detail section', '{\"eyebrow\": \"YUSUF BHAI / PREMIUM COLLECTION\", \"title\": \"THE PREMIUM EDIT\", \"description\": \"Exceptional fragrances, crafted for those who recognise true distinction.\", \"credit\": \"A PREMIUM COLLECTION BY YUSUF BHAI\"}', 1, 20, '2026-08-25 02:53:38.467', '2026-08-25 03:08:21.186'),
(22, 'collection-page:yusuf-bhai-originals', 'hero', 'fixed', 'Hero section', '{\"eyebrow\":\"40+ YEARS OF MASTERY / DUBAI\",\"title\":{\"lead\":\"Yusuf Bhai\",\"accent\":\"Originals\"},\"intro\":\"An award-winning perfumer with over 40 years of experience, Yusuf Bhai has earned the name “Dubai’s Perfume Doctor” through a lifetime devoted to fragrance. His Original Collection brings together distinctive creations shaped by deep knowledge, instinct and an artistry that can only come from decades of mastery.\",\"statement\":\"Four decades of mastery. One unmistakable signature.\",\"highlights\":[\"40+ YEARS OF PERFUMERY MASTERY\",\"AWARD-WINNING FRAGRANCE ARTISTRY\",\"CREATED BY DUBAI’S PERFUME DOCTOR\"],\"productIds\":[\"114\",\"156\",\"163\"]}', 1, 10, '2026-08-25 02:55:07.560', '2026-08-25 02:55:07.560'),
(23, 'collection-page:yusuf-bhai-originals', 'detail', 'fixed', 'Detail section', '{\"eyebrow\": \"YUSUF BHAI / ORIGINAL COLLECTION\", \"title\": \"HOUSE ORIGINALS\", \"description\": \"Created from experience. Perfected through mastery.\", \"credit\": \"ORIGINAL CREATIONS BY YUSUF BHAI — DUBAI’S PERFUME DOCTOR\"}', 1, 20, '2026-08-25 02:55:32.437', '2026-08-25 03:08:21.186'),
(26, 'collection-page:bundles', 'hero', 'fixed', 'Hero section', '{\"eyebrow\":\"CURATED BUNDLES / MORE TO DISCOVER\",\"title\":{\"lead\":\"The Scent\",\"accent\":\"Wardrobe\"},\"intro\":\"Build your fragrance wardrobe from the selected Yusuf Bhai scents featured in this collection. Choose any five eligible fragrances from this page and receive your sixth fragrance FREE — the perfect way to discover more, gift more, and enjoy more of the Perfume Doctor’s artistry.\",\"statement\":\"Five favourites. One on us. More ways to wear Yusuf Bhai.\",\"highlights\":[\"BUY 5, GET 1 FREE\",\"VALID ON PRODUCTS FEATURED ON THIS PAGE\",\"MIX & MATCH ELIGIBLE YUSUF BHAI SCENTS\"],\"productIds\":[]}', 1, 10, '2026-08-25 02:56:30.193', '2026-08-25 02:56:30.193'),
(27, 'collection-page:bundles', 'detail', 'fixed', 'Detail section', '{\"eyebrow\": \"YUSUF BHAI / BUNDLE COLLECTION\", \"title\": \"BUILD YOUR BUNDLE\", \"description\": \"Choose five. Your sixth is our gift.\", \"credit\": \"BUY 5, GET 1 FREE — AVAILABLE ON ELIGIBLE PRODUCTS SHOWN ON THIS PAGE\"}', 1, 20, '2026-08-25 02:56:52.386', '2026-08-25 03:08:21.186'),
(29, 'global', 'header', 'fixed', 'Header', '{\"topbarText\":\"Free shipping on orders over £ 99\",\"topbarRightText\":\"Authorised distributors of Yusuf Bhai perfumes in the UK\",\"navigation\":[{\"label\":\"Yusuf Bhai Originals\",\"href\":\"/yusuf-bhai-originals\"},{\"label\":\"Premium Collection\",\"href\":\"/premium-collection\"},{\"label\":\"Recreations\",\"href\":\"/recreations\"},{\"label\":\"N7 Collection\",\"href\":\"/n7\"},{\"label\":\"Sale\",\"href\":\"/sale\",\"type\":\"dropdown\",\"items\":[{\"name\":\"Buy 5, Get 1 Free\",\"href\":\"/sale/buy-5-get-1-free\",\"image\":\"\"}]},{\"label\":\"Bundles\",\"href\":\"/bundles\"},{\"label\":\"About Us\",\"href\":\"/about\"}]}', 1, 0, '2026-08-25 02:58:27.183', '2026-08-27 22:06:21.321'),
(34, 'collection-page:n7', 'hero', 'fixed', 'Hero section', '{\"eyebrow\": \"The house collection / United Kingdom\", \"title\": {\"lead\": \"The N7\", \"accent\": \"Collection\"}, \"intro\": \"A signature edit shaped by the N7 point of view: expressive fragrances chosen for presence, individuality and lasting character.\", \"statement\": \"Curated with intent. Worn as a signature.\", \"highlights\": [\"N7 signature selection\", \"Distinctive everyday compositions\", \"Curated in the United Kingdom\"], \"productIds\": []}', 1, 10, '2026-08-25 22:10:36.609', '2026-08-25 22:10:36.609'),
(35, 'collection-page:n7', 'detail', 'fixed', 'Detail section', '{\"eyebrow\":\"Complete collection\",\"title\":\"The N7 signature edit\",\"description\":\"Curated with intent. Worn as a signature.\",\"credit\":\"A house edit by N7 Cosmetics\",\"showComingSoon\":true}', 1, 20, '2026-08-25 22:10:36.609', '2026-08-25 22:49:54.926');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `provider` varchar(80) NOT NULL,
  `provider_reference` varchar(190) DEFAULT NULL,
  `payment_type` enum('CHARGE','REFUND') NOT NULL DEFAULT 'CHARGE',
  `status` enum('PENDING','SUCCEEDED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `amount_pence` int(10) UNSIGNED NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'GBP',
  `idempotency_key` varchar(190) DEFAULT NULL,
  `provider_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`provider_payload_json`)),
  `processed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(190) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `product_type` enum('STANDARD','BUNDLE') NOT NULL DEFAULT 'STANDARD',
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `short_description` varchar(500) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `brand` varchar(150) DEFAULT NULL,
  `inspired_by` varchar(190) DEFAULT NULL,
  `product_code` varchar(100) DEFAULT NULL,
  `audience` enum('MEN','WOMEN','UNISEX','UNSPECIFIED') NOT NULL DEFAULT 'UNSPECIFIED',
  `fragrance_notes_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fragrance_notes_json`)),
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `track_inventory` tinyint(1) NOT NULL DEFAULT 1,
  `seo_title` varchar(190) DEFAULT NULL,
  `seo_description` varchar(320) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `product_type`, `status`, `short_description`, `description`, `brand`, `inspired_by`, `product_code`, `audience`, `fragrance_notes_json`, `featured`, `track_inventory`, `seo_title`, `seo_description`, `published_at`, `created_at`, `updated_at`) VALUES
(88, '1872 Vetiver', '1872-vetiver', 'STANDARD', 'ACTIVE', '1872 Vetiver is a Yusuf Bhai fragrance recreation inspired by Clive Christian.', '1872 Vetiver is a Yusuf Bhai fragrance recreation inspired by Clive Christian.', 'Yusuf Bhai', 'Clive Christian', '707', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, '1872 Vetiver | N7 Cosmetics', '1872 Vetiver is a Yusuf Bhai fragrance recreation inspired by Clive Christian.', '2026-08-25 00:15:33.854', '2026-08-25 00:15:33.854', '2026-08-27 23:09:33.560'),
(89, 'Afternoon Swim', 'afternoon-swim', 'STANDARD', 'ACTIVE', 'Afternoon Swim is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Afternoon Swim is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1790', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Afternoon Swim | N7 Cosmetics', 'Afternoon Swim is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.865', '2026-08-25 00:15:33.865', '2026-08-27 23:09:33.560'),
(90, 'Allure Home Sport', 'allure-home-sport', 'STANDARD', 'ACTIVE', 'Allure Home Sport is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Allure Home Sport is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Yusuf Bhai', 'Chanel', '453', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Allure Home Sport | N7 Cosmetics', 'Allure Home Sport is a Yusuf Bhai fragrance recreation inspired by Chanel.', '2026-08-25 00:15:33.878', '2026-08-25 00:15:33.878', '2026-08-27 23:09:33.560'),
(91, 'Allure Home Sport, Sauvage, Legendary', 'allure-home-sport-sauvage-legendary', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring Allure Home Sport, Sauvage, Legendary.', 'A curated N7 Cosmetics fragrance bundle featuring Allure Home Sport, Sauvage, Legendary.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Allure Home Sport, Sauvage, Legendary | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring Allure Home Sport, Sauvage, Legendary.', '2026-08-25 00:15:33.880', '2026-08-25 00:15:33.880', '2026-08-25 00:15:33.880'),
(92, 'Ambre Nuit', 'ambre-nuit', 'STANDARD', 'ACTIVE', 'Ambre Nuit is a Yusuf Bhai fragrance recreation inspired by Christian.', 'Ambre Nuit is a Yusuf Bhai fragrance recreation inspired by Christian.', 'Yusuf Bhai', 'Christian', '222', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Ambre Nuit | N7 Cosmetics', 'Ambre Nuit is a Yusuf Bhai fragrance recreation inspired by Christian.', '2026-08-25 00:15:33.882', '2026-08-25 00:15:33.882', '2026-08-27 23:09:33.560'),
(93, 'Anemoia', 'anemoia', 'STANDARD', 'ACTIVE', 'Anemoia is a harmonious blend of fresh grapefruit and rhubarb, combined with the soothing scents of lavender and nutmeg.', 'The heart of this fragrance is made up of elegant iris, Virginia cedar, and Haitian vetiver, while the warm and earthy base notes of vetiver, styrax, and oak moss provide a lasting and alluring finish. Experience a sense of nostalgia and wanderlust with Anemoia.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Grapefruit\",\"Rhubarb\",\"Lavender\",\"Nutmeg\"],\"heart\":[\"Iris\",\"Virginia Cedar\",\"Haitian Vetiver\"],\"base\":[\"Vetiver\",\"Styrax\",\"Oak Moss\"]}', 0, 1, 'Anemoia | N7 Cosmetics', 'Anemoia is a harmonious blend of fresh grapefruit and rhubarb, combined with the soothing scents of lavender and nutmeg.', '2026-08-25 00:15:33.884', '2026-08-25 00:15:33.884', '2026-08-25 00:15:33.884'),
(94, 'Angels’ Share', 'angels-share', 'STANDARD', 'ACTIVE', 'Angels’ Share is a Yusuf Bhai fragrance recreation inspired by Kilian.', 'Angels’ Share is a Yusuf Bhai fragrance recreation inspired by Kilian.', 'Yusuf Bhai', 'Kilian', '1542', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Angels’ Share | N7 Cosmetics', 'Angels’ Share is a Yusuf Bhai fragrance recreation inspired by Kilian.', '2026-08-25 00:15:33.887', '2026-08-25 00:15:33.887', '2026-08-27 23:09:33.560'),
(95, 'Arabella', 'arabella', 'STANDARD', 'ACTIVE', 'Arabella – Step into a world of timeless elegance with Arabella, a captivating spicy floral amber fragrance.', 'Arabella – A Royal Signature Scent for the Modern Princess.\r\n\r\nStep into a world of timeless elegance with Arabella, a captivating spicy floral amber fragrance. It begins with a whisper of cumin, pink bay, and cinnamon—an inviting warmth that draws you in. At its heart, a romantic bouquet of Damascene rose, geranium, and jasmine blooms, delicately infused with a hint of tea for a fresh, dewy allure. The scent lingers with a rich, luxurious base of amber, vanilla, frankincense, and orris—harmoniously blended with the bold sophistication of patchouli and oud.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Cumin\",\"Pink Bay\",\"Cinnamon\"],\"heart\":[\"Damascene Rose\",\"Geranium\",\"Jasmine\",\"Tea\"],\"base\":[\"Amber\",\"Musk\",\"Oud\",\"Frankincense\",\"Guaiac Wood\",\"Orris\",\"Sandalwood\",\"Patchouli\",\"Vanilla\"]}', 1, 1, 'Arabella | N7 Cosmetics', 'Arabella – Step into a world of timeless elegance with Arabella, a captivating spicy floral amber fragrance.', '2026-08-25 00:15:33.888', '2026-08-25 00:15:33.888', '2026-08-25 22:12:57.755'),
(96, 'Ardor', 'ardor', 'STANDARD', 'ACTIVE', 'Dive into the seductive scent of Ardor. With top notes of bergamot, neroli, lemon, and grapefruit, and a captivating blend of cardamom, black pepper, jasmine, and eucalyptus, this fragrance is sure to entice. The base notes of patchouli, dry wood, vetiver, and oakmoss add a hint of mystery to this tempting aroma. Let Ardor ignite your senses.', 'Dive into the seductive scent of Ardor. With top notes of bergamot, neroli, lemon, and grapefruit, and a captivating blend of cardamom, black pepper, jasmine, and eucalyptus, this fragrance is sure to entice. The base notes of patchouli, dry wood, vetiver, and oakmoss add a hint of mystery to this tempting aroma. Let Ardor ignite your senses.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Bergamot\",\"Neroli\",\"Lemon\",\"Grapefruit\"],\"heart\":[\"Cardamom\",\"Black Pepper\",\"Jasmine\",\"Eucalyptus\"],\"base\":[\"Patchouli\",\"Dry Wood\",\"Vetiver\",\"Oakmoss\"]}', 0, 1, 'Ardor | N7 Cosmetics', 'Dive into the seductive scent of Ardor. With top notes of bergamot, neroli, lemon, and grapefruit, and a captivating blend of cardamom, black pepper, jasmine,…', '2026-08-25 00:15:33.890', '2026-08-25 00:15:33.890', '2026-08-25 00:15:33.890'),
(97, 'Arousal', 'arousal', 'STANDARD', 'ACTIVE', 'Arousal combines rich saffron, delicate jasmine, and feminine floral top notes that awaken the senses.', 'The heart notes of lily of the valley and Amberwood add depth and complexity to the scent. The base notes of fir, musk, and cedar create a lasting impression that will leave you feeling energized and confident. Exude sophistication and allure with Arousal.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Saffron\",\"Jasmine\",\"Floral\"],\"heart\":[\"Lily of the valley\",\"Amberwood\"],\"base\":[\"Fir\",\"Musk\",\"Cedar\"]}', 0, 1, 'Arousal | N7 Cosmetics', 'Arousal combines rich saffron, delicate jasmine, and feminine floral top notes that awaken the senses.', '2026-08-25 00:15:33.892', '2026-08-25 00:15:33.892', '2026-08-25 00:15:33.892'),
(98, 'Attrape Rêves', 'attrape-reves', 'STANDARD', 'ACTIVE', 'Attrape Rêves is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Attrape Rêves is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1467', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Attrape Rêves | N7 Cosmetics', 'Attrape Rêves is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.894', '2026-08-25 00:15:33.894', '2026-08-27 23:09:33.560'),
(99, 'Aventus', 'aventus', 'STANDARD', 'ACTIVE', 'Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Yusuf Bhai', 'Creed', '253', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Aventus | N7 Cosmetics', 'Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', '2026-08-25 00:15:33.895', '2026-08-25 00:15:33.895', '2026-08-27 23:09:33.560'),
(100, 'Baccarat Rouge Extrait 540', 'baccarat-rouge-extrait-540', 'STANDARD', 'ACTIVE', 'Baccarat Rouge Extrait 540 is a Yusuf Bhai fragrance recreation inspired by Maison Francis.', 'Baccarat Rouge Extrait 540 is a Yusuf Bhai fragrance recreation inspired by Maison Francis.', 'Yusuf Bhai', 'Maison Francis', '230', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Baccarat Rouge Extrait 540 | N7 Cosmetics', 'Baccarat Rouge Extrait 540 is a Yusuf Bhai fragrance recreation inspired by Maison Francis.', '2026-08-25 00:15:33.896', '2026-08-25 00:15:33.896', '2026-08-27 23:09:33.560'),
(101, 'Black Opium', 'black-opium', 'STANDARD', 'ACTIVE', 'Black Opium is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'Black Opium is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'Yusuf Bhai', 'Ysl', '971', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Black Opium | N7 Cosmetics', 'Black Opium is a Yusuf Bhai fragrance recreation inspired by Ysl.', '2026-08-25 00:15:33.898', '2026-08-25 00:15:33.898', '2026-08-27 23:09:33.560'),
(102, 'Black Orchid', 'black-orchid', 'STANDARD', 'ACTIVE', 'Black Orchid is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Black Orchid is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '579', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Black Orchid | N7 Cosmetics', 'Black Orchid is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:33.899', '2026-08-25 00:15:33.899', '2026-08-27 23:09:33.560'),
(103, 'Bloody Oud', 'bloody-oud', 'STANDARD', 'ACTIVE', 'Indulge in the luxurious scent of Bloody Oud, featuring top notes of saffron, lemon, chamomile, and tagetes.', 'The enchanting middle notes of incense and rose add a touch of sophistication, while the lingering base notes of agarwood, patchouli, and leather evoke a sense of opulence. Elevate your fragrance game with this exclusive blend.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Saffron\",\"Lemon\",\"Chamomile\",\"Tagetes\"],\"heart\":[\"Incense\",\"Rose\"],\"base\":[\"Agarwood\",\"Patchouli\",\"Leather\"]}', 0, 1, 'Bloody Oud | N7 Cosmetics', 'Indulge in the luxurious scent of Bloody Oud, featuring top notes of saffron, lemon, chamomile, and tagetes.', '2026-08-25 00:15:33.901', '2026-08-25 00:15:33.901', '2026-08-25 00:15:33.901'),
(104, 'Blue De Chanel', 'blue-de-chanel', 'STANDARD', 'ACTIVE', 'Blue De Chanel is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Blue De Chanel is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Yusuf Bhai', 'Chanel', '7060', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Blue De Chanel | N7 Cosmetics', 'Blue De Chanel is a Yusuf Bhai fragrance recreation inspired by Chanel.', '2026-08-25 00:15:33.902', '2026-08-25 00:15:33.902', '2026-08-27 23:09:33.560'),
(105, 'Bvlgari Le Gemme', 'bvlgari-le-gemme', 'STANDARD', 'ACTIVE', 'Bvlgari Le Gemme is a Yusuf Bhai fragrance recreation inspired by Bvlgari.', 'Bvlgari Le Gemme is a Yusuf Bhai fragrance recreation inspired by Bvlgari.', 'Yusuf Bhai', 'Bvlgari', '1048', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Bvlgari Le Gemme | N7 Cosmetics', 'Bvlgari Le Gemme is a Yusuf Bhai fragrance recreation inspired by Bvlgari.', '2026-08-25 00:15:33.904', '2026-08-25 00:15:33.904', '2026-08-27 23:09:33.560'),
(106, 'Carmina', 'carmina', 'STANDARD', 'ACTIVE', 'Carmina is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Carmina is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Yusuf Bhai', 'Creed', '2400', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Carmina | N7 Cosmetics', 'Carmina is a Yusuf Bhai fragrance recreation inspired by Creed.', '2026-08-25 00:15:33.906', '2026-08-25 00:15:33.906', '2026-08-27 23:09:33.560'),
(107, 'City Walk', 'city-walk', 'STANDARD', 'ACTIVE', 'City Walk is a unisex fragrance that captures the essence of urban exploration and sophistication. With its unique blend of notes, it evokes the dynamic energy of bustling city streets and the allure of hidden corners waiting to be discovered.', 'City Walk is a unisex fragrance that captures the essence of urban exploration and sophistication. With its unique blend of notes, it evokes the dynamic energy of bustling city streets and the allure of hidden corners waiting to be discovered.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Rum\",\"Pink pepper\"],\"heart\":[\"Melon\",\"Cinnamon\",\"Lavender\",\"Davana\"],\"base\":[\"Cedar wood\",\"Vanilla\",\"Chestnut\"]}', 0, 1, 'City Walk | N7 Cosmetics', 'City Walk is a unisex fragrance that captures the essence of urban exploration and sophistication. With its unique blend of notes, it evokes the dynamic…', '2026-08-25 00:15:33.908', '2026-08-25 00:15:33.908', '2026-08-25 00:15:33.908'),
(108, 'City Walk, XS Night Extreme, Indian Funk', 'city-walk-xs-night-extreme-indian-funk', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring City Walk, XS Night Extreme, Indian Funk.', 'A curated N7 Cosmetics fragrance bundle featuring City Walk, XS Night Extreme, Indian Funk.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'City Walk, XS Night Extreme, Indian Funk | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring City Walk, XS Night Extreme, Indian Funk.', '2026-08-25 00:15:33.909', '2026-08-25 00:15:33.909', '2026-08-25 00:15:33.909'),
(109, 'Costa Azzura', 'costa-azzura', 'STANDARD', 'ACTIVE', 'Costa Azzura is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Costa Azzura is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '1405', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Costa Azzura | N7 Cosmetics', 'Costa Azzura is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:33.910', '2026-08-25 00:15:33.910', '2026-08-27 23:09:33.560'),
(110, 'Dark Moon', 'dark-moon', 'STANDARD', 'ACTIVE', 'Introducing Dark Moon, a luxurious fragrance that evokes a sense of refined elegance. Delight in the top notes of geraniums, lavender, and bergamot that blend seamlessly with the aromatic middle notes of thyme, patchouli, and sage. The base notes of vetiver, tobacco, and elemi provide a warm and captivating finish. Transport yourself to a world of sophistication with Dark Moon.', 'Introducing Dark Moon, a luxurious fragrance that evokes a sense of refined elegance. Delight in the top notes of geraniums, lavender, and bergamot that blend seamlessly with the aromatic middle notes of thyme, patchouli, and sage. The base notes of vetiver, tobacco, and elemi provide a warm and captivating finish. Transport yourself to a world of sophistication with Dark Moon.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Geraniums\",\"Lavender\",\"Bergamot\"],\"heart\":[\"Thyme\",\"Patchouli\",\"Sage\"],\"base\":[\"Vetiver\",\"Tobacco\",\"Elemi\"]}', 0, 1, 'Dark Moon | N7 Cosmetics', 'Introducing Dark Moon, a luxurious fragrance that evokes a sense of refined elegance. Delight in the top notes of geraniums, lavender, and bergamot that blend…', '2026-08-25 00:15:33.912', '2026-08-25 00:15:33.912', '2026-08-25 00:15:33.912'),
(111, 'Dark Moon, Indian Funk, Domestic Noir', 'dark-moon-indian-funk-domestic-noir', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring Dark Moon, Indian Funk, Domestic Noir.', 'A curated N7 Cosmetics fragrance bundle featuring Dark Moon, Indian Funk, Domestic Noir.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Dark Moon, Indian Funk, Domestic Noir | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring Dark Moon, Indian Funk, Domestic Noir.', '2026-08-25 00:15:33.913', '2026-08-25 00:15:33.913', '2026-08-25 00:15:33.913'),
(112, 'Delina De Marly', 'delina-de-marly', 'STANDARD', 'ACTIVE', 'Delina De Marly is a Yusuf Bhai fragrance recreation inspired by Perfumes De Marly.', 'Delina De Marly is a Yusuf Bhai fragrance recreation inspired by Perfumes De Marly.', 'Yusuf Bhai', 'Perfumes De Marly', '1259', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Delina De Marly | N7 Cosmetics', 'Delina De Marly is a Yusuf Bhai fragrance recreation inspired by Perfumes De Marly.', '2026-08-25 00:15:33.914', '2026-08-25 00:15:33.914', '2026-08-27 23:09:33.560'),
(113, 'Demo', 'demo-2', 'STANDARD', 'ACTIVE', 'short description', 'Long description, specs etc', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Demo | N7 Cosmetics', 'short description', '2026-08-25 00:15:33.916', '2026-08-25 00:15:33.916', '2026-08-25 00:15:33.916'),
(114, 'Devoir Elixer', 'devoir-elixer', 'STANDARD', 'ACTIVE', 'Devoir Elixir by Yusuf Bhai is a fragrance that speaks with subtle power.', 'Devoir Elixir by Yusuf Bhai is a fragrance that speaks with subtle power. It opens with a fresh blend of lavender, lemon, and pineapple – bright and uplifting, yet never overpowering. As it settles on the skin, smooth vanilla and soft fruity notes add a warm, inviting touch. The base of musk and amber brings depth and sensuality, creating a scent that lingers beautifully without demanding attention.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Lavender\",\"Lemon\",\"Pineapple\"],\"heart\":[\"Vanilla\",\"Fruity Notes\"],\"base\":[\"Musk\",\"Amber\"]}', 0, 1, 'Devoir Elixer | N7 Cosmetics', 'Devoir Elixir by Yusuf Bhai is a fragrance that speaks with subtle power.', '2026-08-25 00:15:33.917', '2026-08-25 00:15:33.917', '2026-08-25 00:15:33.917'),
(115, 'Dior Sauvage Elixir', 'dior-sauvage-elixir', 'STANDARD', 'ACTIVE', 'Dior Sauvage Elixir is part of the Yusuf Bhai fragrance recreation collection.', 'Dior Sauvage Elixir is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '1727', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Dior Sauvage Elixir | N7 Cosmetics', 'Dior Sauvage Elixir is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.919', '2026-08-25 00:15:33.919', '2026-08-27 23:12:37.273'),
(116, 'Domestic Noir', 'domestic-noir', 'STANDARD', 'ACTIVE', 'Domestic Noir is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Domestic Noir is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Saffron\",\"Rose\",\"Pomegranate\",\"Grapes noir\"],\"heart\":[\"Labdanum\",\"Musk cashmere\"],\"base\":[\"Agarwood (Oud)\"]}', 0, 1, 'Domestic Noir | N7 Cosmetics', 'Domestic Noir is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:33.921', '2026-08-25 00:15:33.921', '2026-08-25 00:15:33.921'),
(117, 'Ebene Fume', 'ebene-fume', 'STANDARD', 'ACTIVE', 'Ebene Fume is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Ebene Fume is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '1831', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Ebene Fume | N7 Cosmetics', 'Ebene Fume is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:33.928', '2026-08-25 00:15:33.928', '2026-08-27 23:09:33.560'),
(118, 'Equivoque', 'equivoque', 'STANDARD', 'ACTIVE', 'Equivoque is part of the Yusuf Bhai fragrance recreation collection.', 'Equivoque is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '1891', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Equivoque | N7 Cosmetics', 'Equivoque is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.929', '2026-08-25 00:15:33.929', '2026-08-27 23:09:33.560'),
(119, 'Falcon Leather', 'falcon-leather', 'STANDARD', 'ACTIVE', 'Falcon Leather is part of the Yusuf Bhai fragrance recreation collection.', 'Falcon Leather is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '1874', 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Falcon Leather | N7 Cosmetics', 'Falcon Leather is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.930', '2026-08-25 00:15:33.930', '2026-08-27 23:12:37.273'),
(120, 'Flower Bomb', 'flower-bomb', 'STANDARD', 'ACTIVE', 'Flower Bomb is a Yusuf Bhai fragrance recreation inspired by Viktor and Rolf.', 'Flower Bomb is a Yusuf Bhai fragrance recreation inspired by Viktor and Rolf.', 'Yusuf Bhai', 'Viktor and Rolf', '290', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Flower Bomb | N7 Cosmetics', 'Flower Bomb is a Yusuf Bhai fragrance recreation inspired by Viktor and Rolf.', '2026-08-25 00:15:33.931', '2026-08-25 00:15:33.931', '2026-08-27 23:09:33.560'),
(121, 'Forbidden Love', 'forbidden-love', 'STANDARD', 'ACTIVE', 'Forbidden Love is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Forbidden Love is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Mandarin orange\",\"Strawberry\",\"Raspberry\",\"Orange blossom\"],\"heart\":[\"Rose\",\"Jasmine\"],\"base\":[\"Cedar\",\"Amber\",\"Sandalwood\"]}', 0, 1, 'Forbidden Love | N7 Cosmetics', 'Forbidden Love is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:33.932', '2026-08-25 00:15:33.932', '2026-08-25 00:15:33.932'),
(122, 'French Oud', 'french-oud', 'STANDARD', 'ACTIVE', 'French Oud is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'French Oud is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Sicilian lemon\",\"Bergamot\",\"Melon\"],\"heart\":[\"Fruity notes\",\"Rhubarb\",\"Vanilla\"],\"base\":[\"Musk\",\"White oud\",\"Woody notes\"]}', 0, 1, 'French Oud | N7 Cosmetics', 'French Oud is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:33.934', '2026-08-25 00:15:33.934', '2026-08-25 00:15:33.934'),
(123, 'Goddess Burberry', 'goddess-burberry', 'STANDARD', 'ACTIVE', 'Goddess Burberry is a Yusuf Bhai fragrance recreation inspired by Burberry.', 'Goddess Burberry is a Yusuf Bhai fragrance recreation inspired by Burberry.', 'Yusuf Bhai', 'Burberry', '2406', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Goddess Burberry | N7 Cosmetics', 'Goddess Burberry is a Yusuf Bhai fragrance recreation inspired by Burberry.', '2026-08-25 00:15:33.935', '2026-08-25 00:15:33.935', '2026-08-27 23:09:33.560'),
(124, 'Goddess Burberry, Good Girl, Forbidden Love', 'goddess-burberry-good-girl-forbidden-love', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring Goddess Burberry, Good Girl, Forbidden Love.', 'A curated N7 Cosmetics fragrance bundle featuring Goddess Burberry, Good Girl, Forbidden Love.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Goddess Burberry, Good Girl, Forbidden Love | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring Goddess Burberry, Good Girl, Forbidden Love.', '2026-08-25 00:15:33.937', '2026-08-25 00:15:33.937', '2026-08-25 00:15:33.937'),
(125, 'Good Girl', 'carolina-herrera-yb-good-girl-blush', 'STANDARD', 'ACTIVE', 'Good Girl is a Yusuf Bhai fragrance recreation inspired by Carolina Herrera.', 'Good Girl is a Yusuf Bhai fragrance recreation inspired by Carolina Herrera.', 'Yusuf Bhai', 'Carolina Herrera', '1430', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Good Girl | N7 Cosmetics', 'Good Girl is a Yusuf Bhai fragrance recreation inspired by Carolina Herrera.', '2026-08-25 00:15:33.938', '2026-08-25 00:15:33.938', '2026-08-27 23:09:33.560'),
(126, 'Homme', 'homme', 'STANDARD', 'ACTIVE', 'Homme is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Homme is a Yusuf Bhai fragrance recreation inspired by Chanel.', 'Yusuf Bhai', 'Chanel', '1828', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Homme | N7 Cosmetics', 'Homme is a Yusuf Bhai fragrance recreation inspired by Chanel.', '2026-08-25 00:15:33.940', '2026-08-25 00:15:33.940', '2026-08-27 23:09:33.560'),
(127, 'Homme Intense', 'homme-intense', 'STANDARD', 'ACTIVE', 'Homme Intense is a Yusuf Bhai fragrance recreation inspired by dior.', 'Homme Intense is a Yusuf Bhai fragrance recreation inspired by dior.', 'Yusuf Bhai', 'dior', '263', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Homme Intense | N7 Cosmetics', 'Homme Intense is a Yusuf Bhai fragrance recreation inspired by dior.', '2026-08-25 00:15:33.942', '2026-08-25 00:15:33.942', '2026-08-27 23:09:33.560'),
(128, 'Idole', 'idole', 'STANDARD', 'ACTIVE', 'Idole is a Yusuf Bhai fragrance recreation inspired by Lancome.', 'Idole is a Yusuf Bhai fragrance recreation inspired by Lancome.', 'Yusuf Bhai', 'Lancome', '1167', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Idole | N7 Cosmetics', 'Idole is a Yusuf Bhai fragrance recreation inspired by Lancome.', '2026-08-25 00:15:33.943', '2026-08-25 00:15:33.943', '2026-08-27 23:09:33.560'),
(129, 'Imagination', 'imagination', 'STANDARD', 'ACTIVE', 'Imagination is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Imagination is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1772', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Imagination | N7 Cosmetics', 'Imagination is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.945', '2026-08-25 00:15:33.945', '2026-08-27 23:09:33.560'),
(130, 'Indian Funk', 'indian-funk', 'STANDARD', 'ACTIVE', 'Indian Funk is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Indian Funk is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Indian Funk | N7 Cosmetics', 'Indian Funk is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:33.946', '2026-08-25 00:15:33.946', '2026-08-25 00:15:33.946'),
(131, 'Interlude Man', 'interlude-man', 'STANDARD', 'ACTIVE', 'Interlude Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', 'Interlude Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', 'Yusuf Bhai', 'Amouage', '562', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Interlude Man | N7 Cosmetics', 'Interlude Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', '2026-08-25 00:15:33.947', '2026-08-25 00:15:33.947', '2026-08-27 23:09:33.560'),
(132, 'Irish Green', 'irish-green', 'STANDARD', 'ACTIVE', 'Irish Green is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Irish Green is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Yusuf Bhai', 'Creed', '578', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Irish Green | N7 Cosmetics', 'Irish Green is a Yusuf Bhai fragrance recreation inspired by Creed.', '2026-08-25 00:15:33.949', '2026-08-25 00:15:33.949', '2026-08-27 23:09:33.560'),
(133, 'Jadore', 'jadore', 'STANDARD', 'ACTIVE', 'Jadore is a Yusuf Bhai fragrance recreation inspired by Dior.', 'Jadore is a Yusuf Bhai fragrance recreation inspired by Dior.', 'Yusuf Bhai', 'Dior', '284', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Jadore | N7 Cosmetics', 'Jadore is a Yusuf Bhai fragrance recreation inspired by Dior.', '2026-08-25 00:15:33.950', '2026-08-25 00:15:33.950', '2026-08-27 23:09:33.560'),
(134, 'Jadore, YSL Libre,  French Oud', 'jadore-ysl-libre-french-oud', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring Jadore, YSL Libre,  French Oud.', 'A curated N7 Cosmetics fragrance bundle featuring Jadore, YSL Libre,  French Oud.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Jadore, YSL Libre,  French Oud | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring Jadore, YSL Libre,  French Oud.', '2026-08-25 00:15:33.952', '2026-08-25 00:15:33.952', '2026-08-25 00:15:33.952'),
(135, 'L’immensite', 'limmensite', 'STANDARD', 'ACTIVE', 'L’immensite is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'L’immensite is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1710', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'L’immensite | N7 Cosmetics', 'L’immensite is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.953', '2026-08-25 00:15:33.953', '2026-08-27 23:12:37.273'),
(136, 'La Nuit De L’Homme', 'la-nuit-de-lhomme', 'STANDARD', 'ACTIVE', 'La Nuit De L’Homme is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'La Nuit De L’Homme is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'Yusuf Bhai', 'Ysl', '669', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'La Nuit De L’Homme | N7 Cosmetics', 'La Nuit De L’Homme is a Yusuf Bhai fragrance recreation inspired by Ysl.', '2026-08-25 00:15:33.957', '2026-08-25 00:15:33.957', '2026-08-27 23:12:37.273'),
(137, 'La Vie Est Belle', 'la-vie-est-belle', 'STANDARD', 'ACTIVE', 'La Vie Est Belle is a Yusuf Bhai fragrance recreation inspired by Lancome.', 'La Vie Est Belle is a Yusuf Bhai fragrance recreation inspired by Lancome.', 'Yusuf Bhai', 'Lancome', '323', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'La Vie Est Belle | N7 Cosmetics', 'La Vie Est Belle is a Yusuf Bhai fragrance recreation inspired by Lancome.', '2026-08-25 00:15:33.959', '2026-08-25 00:15:33.959', '2026-08-27 23:09:33.560'),
(138, 'Les Sables Roses', 'les-sables-roses', 'STANDARD', 'ACTIVE', 'Les Sables Roses is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Les Sables Roses is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1473', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Les Sables Roses | N7 Cosmetics', 'Les Sables Roses is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.960', '2026-08-25 00:15:33.960', '2026-08-27 23:09:33.560'),
(139, 'Memoir', 'memoir', 'STANDARD', 'ACTIVE', 'Memoir: a fragrance that captures the essence of reminiscence.', 'From the lively notes of bergamot, cloves, and cardamom to the floral embrace of Bulgarian rose and ylang-ylang, each spritz tells a story. Anchored by the depth of patchouli and sandalwood, this scent evokes memories both cherished and yet to be made.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Bergamot\",\"Cloves\",\"Cardamom\"],\"heart\":[\"Bulgarian Rose\",\"Ylang Ylang\"],\"base\":[\"Patchouli\",\"Sandalwood\"]}', 0, 1, 'Memoir | N7 Cosmetics', 'Memoir: a fragrance that captures the essence of reminiscence.', '2026-08-25 00:15:33.961', '2026-08-25 00:15:33.961', '2026-08-25 00:15:33.961'),
(140, 'Miss Dior', 'miss-dior', 'STANDARD', 'ACTIVE', 'Miss Dior is a Yusuf Bhai fragrance recreation inspired by Dior.', 'Miss Dior is a Yusuf Bhai fragrance recreation inspired by Dior.', 'Yusuf Bhai', 'Dior', '1324', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Miss Dior | N7 Cosmetics', 'Miss Dior is a Yusuf Bhai fragrance recreation inspired by Dior.', '2026-08-25 00:15:33.962', '2026-08-25 00:15:33.962', '2026-08-27 23:09:33.560'),
(141, 'Moonlight Pathcholi', 'moonlight-pathcholi', 'STANDARD', 'ACTIVE', 'Moonlight Pathcholi is a Yusuf Bhai fragrance recreation inspired by Van Cleef Arpels.', 'Moonlight Pathcholi is a Yusuf Bhai fragrance recreation inspired by Van Cleef Arpels.', 'Yusuf Bhai', 'Van Cleef Arpels', '1229', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Moonlight Pathcholi | N7 Cosmetics', 'Moonlight Pathcholi is a Yusuf Bhai fragrance recreation inspired by Van Cleef Arpels.', '2026-08-25 00:15:33.963', '2026-08-25 00:15:33.963', '2026-08-27 23:09:33.560'),
(142, 'Myrhh And Tonka', 'myrhh-and-tonka', 'STANDARD', 'ACTIVE', 'Myrhh And Tonka is a Yusuf Bhai fragrance recreation inspired by Jo Malone.', 'Myrhh And Tonka is a Yusuf Bhai fragrance recreation inspired by Jo Malone.', 'Yusuf Bhai', 'Jo Malone', '1635', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Myrhh And Tonka | N7 Cosmetics', 'Myrhh And Tonka is a Yusuf Bhai fragrance recreation inspired by Jo Malone.', '2026-08-25 00:15:33.964', '2026-08-25 00:15:33.964', '2026-08-27 23:09:33.560'),
(143, 'Myth', 'myth', 'STANDARD', 'ACTIVE', 'Immerse yourself in the enchanting tale woven by our fragrance, a rich tapestry of scents inspired by the far-flung corners of the world.', 'Picture yourself wandering through bustling markets, the air thick with the aroma of spices and aged spirits. Each note in our fragrance is like a chapter in a thrilling novel, inviting you to explore deeper into the heart of adventure. Let it be your companion on journeys both real and imagined, guiding you through landscapes of mystery and wonder.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Cardamom\",\"Black Pepper\",\"Rum\"],\"heart\":[\"Vanilla\",\"Nutmeg\",\"Cedar\"],\"base\":[\"Leather\",\"Agarwood\",\"Tobacco Leaf\"]}', 0, 1, 'Myth | N7 Cosmetics', 'Immerse yourself in the enchanting tale woven by our fragrance, a rich tapestry of scents inspired by the far-flung corners of the world.', '2026-08-25 00:15:33.965', '2026-08-25 00:15:33.965', '2026-08-25 00:15:33.965'),
(144, 'N°5', 'n5', 'STANDARD', 'ACTIVE', 'N°5 is part of the Yusuf Bhai fragrance recreation collection.', 'N°5 is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '277', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'N°5 | N7 Cosmetics', 'N°5 is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.967', '2026-08-25 00:15:33.967', '2026-08-27 23:09:33.560'),
(145, 'Noir Extreme', 'noir-extreme', 'STANDARD', 'ACTIVE', 'Noir Extreme is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Noir Extreme is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '720', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Noir Extreme | N7 Cosmetics', 'Noir Extreme is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:33.968', '2026-08-25 00:15:33.968', '2026-08-27 23:09:33.560'),
(146, 'Noir Extreme, Forbidden Love, French Oud', 'noir-extreme-forbidden-love-french-oud', 'BUNDLE', 'ACTIVE', 'A curated N7 Cosmetics fragrance bundle featuring Noir Extreme, Forbidden Love, French Oud.', 'A curated N7 Cosmetics fragrance bundle featuring Noir Extreme, Forbidden Love, French Oud.', 'N7 Cosmetics', NULL, NULL, 'UNSPECIFIED', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Noir Extreme, Forbidden Love, French Oud | N7 Cosmetics', 'A curated N7 Cosmetics fragrance bundle featuring Noir Extreme, Forbidden Love, French Oud.', '2026-08-25 00:15:33.970', '2026-08-25 00:15:33.970', '2026-08-25 00:15:33.970'),
(147, 'Nostalgia', 'nostalgia', 'STANDARD', 'ACTIVE', 'Enter the realm of Nostalgia crafted to evoke the essence of cherished memories.', 'Envision a stroll through an orchard at dawn, where the spicy warmth of pepper blends with the sweetness of pineapple and the crispness of apple. As the day unfolds, be enveloped by the earthy richness of patchouli, the floral allure of orange blossom, and the comforting embrace of birch. Finally, sink into the warmth of woods, the salty breeze of the ocean, and the velvety touch of musk. Let ‘Nostalgia’ whisk you away to a world where every spray is a journey into elegance and allure.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Pepper\",\"Pineapple\",\"Apple\"],\"heart\":[\"Patchouli\",\"Orange Blossom\",\"Brich\"],\"base\":[\"Woody\",\"Amber Gris\",\"Moss\",\"Musk\"]}', 0, 1, 'Nostalgia | N7 Cosmetics', 'Enter the realm of Nostalgia crafted to evoke the essence of cherished memories.', '2026-08-25 00:15:33.971', '2026-08-25 00:15:33.971', '2026-08-25 00:15:33.971'),
(148, 'Ombre Leather', 'ombre-leather', 'STANDARD', 'ACTIVE', 'Ombre Leather is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Ombre Leather is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '879', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Ombre Leather | N7 Cosmetics', 'Ombre Leather is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:33.973', '2026-08-25 00:15:33.973', '2026-08-27 23:09:33.560'),
(149, 'Ombre Nomade', 'ombre-nomade', 'STANDARD', 'ACTIVE', 'Ombre Nomade is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Ombre Nomade is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '2030', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Ombre Nomade | N7 Cosmetics', 'Ombre Nomade is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.974', '2026-08-25 00:15:33.974', '2026-08-27 23:09:33.560'),
(150, 'One Million', 'one-million', 'STANDARD', 'ACTIVE', 'One Million is a Yusuf Bhai fragrance recreation inspired by Pacco Rabanna.', 'One Million is a Yusuf Bhai fragrance recreation inspired by Pacco Rabanna.', 'Yusuf Bhai', 'Pacco Rabanna', '785', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'One Million | N7 Cosmetics', 'One Million is a Yusuf Bhai fragrance recreation inspired by Pacco Rabanna.', '2026-08-25 00:15:33.975', '2026-08-25 00:15:33.975', '2026-08-27 23:09:33.560'),
(151, 'Oud For Greatness', 'oud-for-greatness', 'STANDARD', 'ACTIVE', 'Oud For Greatness is part of the Yusuf Bhai fragrance recreation collection.', 'Oud For Greatness is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '1368', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Oud For Greatness | N7 Cosmetics', 'Oud For Greatness is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.977', '2026-08-25 00:15:33.977', '2026-08-27 23:09:33.560'),
(152, 'Oud Intense', 'oud-intense', 'STANDARD', 'ACTIVE', 'Oud Intense is a Yusuf Bhai fragrance recreation inspired by gucci.', 'Oud Intense is a Yusuf Bhai fragrance recreation inspired by gucci.', 'Yusuf Bhai', 'gucci', '582', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Oud Intense | N7 Cosmetics', 'Oud Intense is a Yusuf Bhai fragrance recreation inspired by gucci.', '2026-08-25 00:15:33.979', '2026-08-25 00:15:33.979', '2026-08-27 23:09:33.560'),
(153, 'Oud Stallion', 'oud-stallion', 'STANDARD', 'ACTIVE', 'Oud Stallion is part of the Yusuf Bhai fragrance recreation collection.', 'Oud Stallion is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '777', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Oud Stallion | N7 Cosmetics', 'Oud Stallion is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:33.980', '2026-08-25 00:15:33.980', '2026-08-27 23:09:33.560'),
(154, 'Oud Zarian', 'oud-zarian', 'STANDARD', 'ACTIVE', 'Oud Zarian is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Oud Zarian is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Yusuf Bhai', 'Creed', '2728', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Oud Zarian | N7 Cosmetics', 'Oud Zarian is a Yusuf Bhai fragrance recreation inspired by Creed.', '2026-08-25 00:15:33.981', '2026-08-25 00:15:33.981', '2026-08-27 23:09:33.560'),
(155, 'Pacific Chill', 'pacific-chill', 'STANDARD', 'ACTIVE', 'Pacific Chill is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Pacific Chill is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '2480', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Pacific Chill | N7 Cosmetics', 'Pacific Chill is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:33.983', '2026-08-25 00:15:33.983', '2026-08-27 23:09:33.560'),
(156, 'Passio', 'passio', 'STANDARD', 'ACTIVE', 'Passio is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Passio is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Cinnamon and Saffron\"],\"heart\":[\"Jasmine\",\"Coconut\",\"Ylang Ylang\",\"Resins\"],\"base\":[\"Cashmeran\",\"Madagascar Vanilla\",\"Musk\",\"Agarwood\"]}', 0, 1, 'Passio | N7 Cosmetics', 'Passio is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:33.984', '2026-08-25 00:15:33.984', '2026-08-25 00:15:33.984'),
(157, 'Poem Arabic Gold', 'poem-arabic-gold', 'STANDARD', 'ACTIVE', 'An opulent harmony of spicy pink pepper and radiant bergamot unfolds into a heart of creamy tuberose, exotic ylang ylang, and luxurious suede. Anchored by warm amber, rich patchouli, and deep woods, it’s a fragrance that whispers sophistication and leaves an unforgettable trail.', 'An opulent harmony of spicy pink pepper and radiant bergamot unfolds into a heart of creamy tuberose, exotic ylang ylang, and luxurious suede. Anchored by warm amber, rich patchouli, and deep woods, it’s a fragrance that whispers sophistication and leaves an unforgettable trail.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Pink Pepper\",\"Bergamot\",\"Sandalwood\"],\"heart\":[\"Tuberose\",\"Suede\",\"Cardamom\",\"Violet\",\"Iris\",\"Ylang Ylang\"],\"base\":[\"Amber\",\"Woody Notes\",\"Patchouli\"]}', 0, 1, 'Poem Arabic Gold | N7 Cosmetics', 'An opulent harmony of spicy pink pepper and radiant bergamot unfolds into a heart of creamy tuberose, exotic ylang ylang, and luxurious suede. Anchored by…', '2026-08-25 00:15:33.985', '2026-08-25 00:15:33.985', '2026-08-25 00:15:33.985'),
(158, 'Poem Arabic Silver', 'poem-arabic-silver', 'STANDARD', 'ACTIVE', 'Poem Arabic Silver is part of the premium Yusuf Bhai fragrance collection.', 'Poem Arabic Silver is part of the premium Yusuf Bhai fragrance collection.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Mudsy Notes\"],\"heart\":[\"Patchouli\",\"Nagarmotha oil\",\"Oakmoss\"],\"base\":[\"White Amber Gris\"]}', 0, 1, 'Poem Arabic Silver | N7 Cosmetics', 'Poem Arabic Silver is part of the premium Yusuf Bhai fragrance collection.', '2026-08-25 00:15:33.988', '2026-08-25 00:15:33.988', '2026-08-25 00:15:33.988'),
(159, 'Poem French Gold', 'poem-french-gold', 'STANDARD', 'ACTIVE', 'Poem French Gold opens with the gentle fragrance of begonia blossom, violet, pear, and green apple, bringing to mind the freshness of a garden in full bloom.', 'The middle notes of gardenia, cherry, and red wine add a hint of romance and elegance, telling a story of passion and beauty. The fragrance finishes with the rich base notes of leather, iso e super, ambrettolide, and cetalox, which stay on the skin like the last lines of a lovely poem, leaving a trace of refined elegance and sensuality.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Begonia Blossom\",\"Violet\",\"Pear\",\"Green Apple\"],\"heart\":[\"Gardenia\",\"Cherry\",\"Red Wine\"],\"base\":[\"Leather\",\"Ambrettolide\",\"Cetalox\"]}', 0, 1, 'Poem French Gold | N7 Cosmetics', 'Poem French Gold opens with the gentle fragrance of begonia blossom, violet, pear, and green apple, bringing to mind the freshness of a garden in full bloom.', '2026-08-25 00:15:33.990', '2026-08-25 00:15:33.990', '2026-08-25 00:15:33.990'),
(160, 'Poem French Silver', 'poem-french-silver', 'STANDARD', 'ACTIVE', 'Poem French Silver starts with the fresh and lively notes of mango, orange, and lemon, softened by the tropical touch of coconut and lime.', 'Poem French Silver starts with the fresh and lively notes of mango, orange, and lemon, softened by the tropical touch of coconut and lime. The heart of the fragrance mixes the rich scents of black currant, apricot, tea, rice, and orange blossoms, creating a warm and complex experience. The journey ends with the deep, comforting notes of musk, vanilla, and the earthy tone of akigalawood, leaving a lasting impression of strength and grace.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Mango\",\"Orange\",\"Lemon\",\"Coconut\",\"Lime\"],\"heart\":[\"Blackcurrant\",\"Apricot\",\"Tea\",\"Rice\",\"Orange Blossoms\",\"Base Notes\",\"Musk\",\"Vanilla\",\"Akigalawood\"],\"base\":[\"Musk\",\"Vanilla\",\"Akigalawood\"]}', 0, 1, 'Poem French Silver | N7 Cosmetics', 'Poem French Silver starts with the fresh and lively notes of mango, orange, and lemon, softened by the tropical touch of coconut and lime.', '2026-08-25 00:15:33.993', '2026-08-25 00:15:33.993', '2026-08-25 00:15:33.993'),
(161, 'Pour Femme', 'pour-femme', 'STANDARD', 'ACTIVE', 'Yusuf Bhai Pour Femme is a fragrance that radiates elegance and passion.', 'Yusuf Bhai Pour Femme is a fragrance that radiates elegance and passion. Fresh begonia, violet, and pear open the scent, while gardenia and cherry bring warmth and romance. A soft, sensual base lingers, leaving an unforgettable, intimate trail. Perfect for the woman who leaves a lasting impression.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Pear\",\"Jasmine\",\"Dewberry\"],\"heart\":[\"Rose\",\"Cassis\",\"Magnolia\",\"Tuberose\"],\"base\":[\"Musk\",\"Sandalwood\",\"Cedar\"]}', 0, 1, 'Pour Femme | N7 Cosmetics', 'Yusuf Bhai Pour Femme is a fragrance that radiates elegance and passion.', '2026-08-25 00:15:33.995', '2026-08-25 00:15:33.995', '2026-08-25 00:15:33.995'),
(162, 'Pour Homme', 'pour-homme', 'STANDARD', 'ACTIVE', 'POUR HOMME is a fragrance that defies conventions and exudes sophistication.', 'Crafted by the artisan perfumer Yusuf Bhai, this scent unravels the complexities of masculinity with invigorating top notes, a spicy heart, and grounding base notes that embody strength and resilience. An aromatic journey of manhood awaits', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Bergamot\",\"Aldehydes\",\"Grapefruit\",\"Artemisia\",\"Middle Notes\",\"Ginger\",\"Lavender\",\"Sage\",\"Nutmeg\",\"Base Notes\",\"Sandalwood\",\"White Musk\",\"Tolu Balsam\",\"Patchouli\"],\"heart\":[\"Ginger\",\"Lavender\",\"Sage\",\"Nutmeg\",\"Base Notes\",\"Sandalwood\",\"White Musk\",\"Tolu Balsam\",\"Patchouli\"],\"base\":[\"Sandalwood\",\"White Musk\",\"Tolu Balsam\",\"Patchouli\"]}', 0, 1, 'Pour Homme | N7 Cosmetics', 'POUR HOMME is a fragrance that defies conventions and exudes sophistication.', '2026-08-25 00:15:33.998', '2026-08-25 00:15:33.998', '2026-08-25 00:15:33.998'),
(163, 'Pragma', 'pragma', 'STANDARD', 'ACTIVE', 'Pragma is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Pragma is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Saffron\",\"Raspberry\",\"Bergamot\"],\"heart\":[\"Labdanum\",\"Sugar Cane\",\"Bulgarian Rose\"],\"base\":[\"Leather\",\"Suede\",\"Tonka Bean\",\"Amber\"]}', 0, 1, 'Pragma | N7 Cosmetics', 'Pragma is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:34.000', '2026-08-25 00:15:34.000', '2026-08-25 00:15:34.000'),
(164, 'Promise', 'promise', 'STANDARD', 'ACTIVE', 'Promise is a Yusuf Bhai fragrance recreation inspired by Frederic Malle.', 'Promise is a Yusuf Bhai fragrance recreation inspired by Frederic Malle.', 'Yusuf Bhai', 'Frederic Malle', '1906', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Promise | N7 Cosmetics', 'Promise is a Yusuf Bhai fragrance recreation inspired by Frederic Malle.', '2026-08-25 00:15:34.008', '2026-08-25 00:15:34.008', '2026-08-27 23:09:33.560'),
(165, 'Red Tobacco', 'red-tobacco', 'STANDARD', 'ACTIVE', 'Red Tobacco is a Yusuf Bhai fragrance recreation inspired by Mancera.', 'Red Tobacco is a Yusuf Bhai fragrance recreation inspired by Mancera.', 'Yusuf Bhai', 'Mancera', '1201', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Red Tobacco | N7 Cosmetics', 'Red Tobacco is a Yusuf Bhai fragrance recreation inspired by Mancera.', '2026-08-25 00:15:34.012', '2026-08-25 00:15:34.012', '2026-08-27 23:12:37.273'),
(166, 'Reflection Man', 'reflection-man', 'STANDARD', 'ACTIVE', 'Reflection Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', 'Reflection Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', 'Yusuf Bhai', 'Amouage', '1206', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Reflection Man | N7 Cosmetics', 'Reflection Man is a Yusuf Bhai fragrance recreation inspired by Amouage.', '2026-08-25 00:15:34.017', '2026-08-25 00:15:34.017', '2026-08-27 23:09:33.560');
INSERT INTO `products` (`id`, `name`, `slug`, `product_type`, `status`, `short_description`, `description`, `brand`, `inspired_by`, `product_code`, `audience`, `fragrance_notes_json`, `featured`, `track_inventory`, `seo_title`, `seo_description`, `published_at`, `created_at`, `updated_at`) VALUES
(167, 'Rendevous', 'rendevous', 'STANDARD', 'ACTIVE', 'Embark on a sensual journey with our Rendezvous perfume from the Deja Vu collection. Experience the essence of romance as delicate jasmine and rose petals intertwine with spicy pink pepper. Dive deeper into the fragrance with woody guaiac wood and sophisticated aldehydic notes. Anchored by warm cedarwood, honey, and patchouli, this scent lingers with sweet sultriness. Perfect for any romantic occasion, Rendezvous Perfume embodies sensuality and charm.', 'Embark on a sensual journey with our Rendezvous perfume from the Deja Vu collection. Experience the essence of romance as delicate jasmine and rose petals intertwine with spicy pink pepper. Dive deeper into the fragrance with woody guaiac wood and sophisticated aldehydic notes. Anchored by warm cedarwood, honey, and patchouli, this scent lingers with sweet sultriness. Perfect for any romantic occasion, Rendezvous Perfume embodies sensuality and charm.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Jasmine\",\"Pink Pepper\",\"Guaiac wood\"],\"heart\":[\"Rose Petals\",\"Aldehydic\"],\"base\":[\"Cedarwood\",\"Honey\",\"Patchouli\"]}', 0, 1, 'Rendevous | N7 Cosmetics', 'Embark on a sensual journey with our Rendezvous perfume from the Deja Vu collection. Experience the essence of romance as delicate jasmine and rose petals…', '2026-08-25 00:15:34.018', '2026-08-25 00:15:34.018', '2026-08-25 00:15:34.018'),
(168, 'Royal Oud', 'royal-oud', 'STANDARD', 'ACTIVE', 'Royal Oud is part of the Yusuf Bhai fragrance recreation collection.', 'Royal Oud is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '598', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Royal Oud | N7 Cosmetics', 'Royal Oud is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:34.021', '2026-08-25 00:15:34.021', '2026-08-27 23:09:33.560'),
(169, 'Santal 33', 'santal-33', 'STANDARD', 'ACTIVE', 'Santal 33 is a Yusuf Bhai fragrance recreation inspired by Le Labo.', 'Santal 33 is a Yusuf Bhai fragrance recreation inspired by Le Labo.', 'Yusuf Bhai', 'Le Labo', '1231', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Santal 33 | N7 Cosmetics', 'Santal 33 is a Yusuf Bhai fragrance recreation inspired by Le Labo.', '2026-08-25 00:15:34.024', '2026-08-25 00:15:34.024', '2026-08-27 23:09:33.560'),
(170, 'Sauvage', 'sauvage', 'STANDARD', 'ACTIVE', 'Sauvage is part of the Yusuf Bhai fragrance recreation collection.', 'Sauvage is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '2035', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Sauvage | N7 Cosmetics', 'Sauvage is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:34.027', '2026-08-25 00:15:34.027', '2026-08-27 23:09:33.560'),
(171, 'Srk Special', 'srk-special', 'STANDARD', 'ACTIVE', 'Srk Special is a Yusuf Bhai fragrance recreation inspired by Srk Special.', 'Srk Special is a Yusuf Bhai fragrance recreation inspired by Srk Special.', 'Yusuf Bhai', 'Srk Special', '2686', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Srk Special | N7 Cosmetics', 'Srk Special is a Yusuf Bhai fragrance recreation inspired by Srk Special.', '2026-08-25 00:15:34.029', '2026-08-25 00:15:34.029', '2026-08-27 23:09:33.560'),
(172, 'Stellar Times', 'stellar-times', 'STANDARD', 'ACTIVE', 'Stellar Times is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Stellar Times is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', 'Yusuf Bhai', 'Louis Vuittion', '1890', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Stellar Times | N7 Cosmetics', 'Stellar Times is a Yusuf Bhai fragrance recreation inspired by Louis Vuittion.', '2026-08-25 00:15:34.031', '2026-08-25 00:15:34.031', '2026-08-27 23:09:33.560'),
(173, 'Surreal', 'surreal', 'STANDARD', 'ACTIVE', 'Step into a realm of enchantment with our Surreal perfume from the Deja Vu Collection.', 'Let the sweet tanginess of pineapple and Sicilian black currant whisk you away, while the floral allure of jasmine mesmerizes your senses. Delve deeper into the fragrance with earthy patchouli and birch, providing a soothing foundation. Finally, luxuriate in the warmth of vanilla, ambergris, and white oud, leaving an exotic and lingering aroma. Surreal Perfume: your gateway to a mystical escape, suitable for every moment of magic in your life.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Pineapple\",\"Sicilian Mandarin\",\"Black Currant\"],\"heart\":[\"Jasmine\",\"Patchouli\",\"Birch\"],\"base\":[\"Vanilla\",\"Amber Gris\",\"White Oud\"]}', 0, 1, 'Surreal | N7 Cosmetics', 'Step into a realm of enchantment with our Surreal perfume from the Deja Vu Collection.', '2026-08-25 00:15:34.033', '2026-08-25 00:15:34.033', '2026-08-25 00:15:34.033'),
(174, 'Tar', 'tar', 'STANDARD', 'ACTIVE', 'TAR is not about destruction. It’s about what remains. The air after combustion. The silence after chaos. A scent that feels like a sketch unfinished, raw, real. Smoke curls around steel. Tar melts into ink. Each note is a residue, a trace of what once was alive. TAR does not perfume you. It stays on you like a memory that refuses to fade. “Existence, in smoke – When beauty burns, art remains', 'TAR is not about destruction. It’s about what remains. The air after combustion. The silence after chaos. A scent that feels like a sketch unfinished, raw, real. Smoke curls around steel. Tar melts into ink. Each note is a residue, a trace of what once was alive. TAR does not perfume you. It stays on you like a memory that refuses to fade. “Existence, in smoke – When beauty burns, art remains', 'Yusuf Bhai', 'Yusuf Bhai Originals', NULL, 'MEN', '{\"top\":[\"Cognac\",\"Saffron\",\"Raspberry\",\"Cinnamon\"],\"heart\":[\"Mineral Notes\",\"Bulgarian Rose\",\"Leather\"],\"base\":[\"Tobacco\",\"Vanilla\",\"Benzoin\",\"Tar\",\"Incense\",\"Tonka Beans\"]}', 0, 1, 'Tar | N7 Cosmetics', 'TAR is not about destruction. It’s about what remains. The air after combustion. The silence after chaos. A scent that feels like a sketch unfinished, raw,…', '2026-08-25 00:15:34.035', '2026-08-25 00:15:34.035', '2026-08-25 01:47:03.980'),
(175, 'Terre De Hermes', 'terre-de-hermes', 'STANDARD', 'ACTIVE', 'Terre De Hermes is a Yusuf Bhai fragrance recreation inspired by Hermes.', 'Terre De Hermes is a Yusuf Bhai fragrance recreation inspired by Hermes.', 'Yusuf Bhai', 'Hermes', '573', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Terre De Hermes | N7 Cosmetics', 'Terre De Hermes is a Yusuf Bhai fragrance recreation inspired by Hermes.', '2026-08-25 00:15:34.038', '2026-08-25 00:15:34.038', '2026-08-27 23:09:33.560'),
(176, 'Tobacco Vanille', 'tobacco-vanille', 'STANDARD', 'ACTIVE', 'Tobacco Vanille is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Tobacco Vanille is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', 'Yusuf Bhai', 'Tom Ford', '428', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Tobacco Vanille | N7 Cosmetics', 'Tobacco Vanille is a Yusuf Bhai fragrance recreation inspired by Tom Ford.', '2026-08-25 00:15:34.040', '2026-08-25 00:15:34.040', '2026-08-27 23:09:33.560'),
(177, 'Velvet Desert Oud', 'velvet-desert-oud', 'STANDARD', 'ACTIVE', 'Velvet Desert Oud is part of the Yusuf Bhai fragrance recreation collection.', 'Velvet Desert Oud is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '361', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Velvet Desert Oud | N7 Cosmetics', 'Velvet Desert Oud is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:34.042', '2026-08-25 00:15:34.042', '2026-08-27 23:09:33.560'),
(178, 'X Masculine', 'x-masculine', 'STANDARD', 'ACTIVE', 'X Masculine is part of the Yusuf Bhai fragrance recreation collection.', 'X Masculine is part of the Yusuf Bhai fragrance recreation collection.', 'Yusuf Bhai', NULL, '709', 'UNISEX', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'X Masculine | N7 Cosmetics', 'X Masculine is part of the Yusuf Bhai fragrance recreation collection.', '2026-08-25 00:15:34.044', '2026-08-25 00:15:34.044', '2026-08-27 23:12:37.273'),
(179, 'XS Night Extreme', 'xs-night-extreme', 'STANDARD', 'ACTIVE', 'XS Night Extreme is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'XS Night Extreme is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Lemon\",\"Pineapple\",\"Bergamot\"],\"heart\":[\"Sage\",\"Black Currant\",\"Lavender\"],\"base\":[\"Amber\",\"Labdanum\",\"Galbanum\"]}', 0, 1, 'XS Night Extreme | N7 Cosmetics', 'XS Night Extreme is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:34.045', '2026-08-25 00:15:34.045', '2026-08-25 00:15:34.045'),
(180, 'YSL Libre', 'ysl-libre', 'STANDARD', 'ACTIVE', 'YSL Libre is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'YSL Libre is a Yusuf Bhai fragrance recreation inspired by Ysl.', 'Yusuf Bhai', 'Ysl', '1168', 'WOMEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'YSL Libre | N7 Cosmetics', 'YSL Libre is a Yusuf Bhai fragrance recreation inspired by Ysl.', '2026-08-25 00:15:34.047', '2026-08-25 00:15:34.047', '2026-08-27 23:09:33.560'),
(181, 'Absolu Aventus', 'absolu-aventus', 'STANDARD', 'ACTIVE', 'Absolu Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Absolu Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', 'Yusuf Bhai', 'Creed', '2235', 'MEN', '{\"top\":[],\"heart\":[],\"base\":[]}', 0, 1, 'Absolu Aventus | N7 Cosmetics', 'Absolu Aventus is a Yusuf Bhai fragrance recreation inspired by Creed.', '2026-08-25 00:15:34.048', '2026-08-25 00:15:34.048', '2026-08-27 23:12:37.273'),
(182, 'Legendery', 'legendary', 'STANDARD', 'ACTIVE', 'Legendery is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Legendery is an original Yusuf Bhai fragrance available from N7 Cosmetics.', 'Yusuf Bhai', NULL, NULL, 'UNSPECIFIED', '{\"top\":[\"Grapefruit\",\"Rosemary\",\"Lavender\",\"Lemon\"],\"heart\":[\"Watery Notes\",\"Sage\"],\"base\":[\"Ambergris\",\"Musk\",\"Driftwood\"]}', 0, 1, 'Legendery | N7 Cosmetics', 'Legendery is an original Yusuf Bhai fragrance available from N7 Cosmetics.', '2026-08-25 00:15:34.049', '2026-08-25 00:15:34.049', '2026-08-25 00:15:34.049');

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES
(88, 90),
(88, 105),
(88, 107),
(89, 96),
(89, 105),
(89, 121),
(90, 105),
(90, 107),
(90, 111),
(92, 105),
(92, 106),
(92, 107),
(92, 114),
(92, 131),
(93, 97),
(93, 99),
(94, 91),
(94, 96),
(94, 105),
(96, 97),
(96, 100),
(97, 97),
(97, 99),
(98, 105),
(98, 106),
(98, 122),
(99, 105),
(99, 107),
(99, 112),
(100, 105),
(100, 106),
(100, 123),
(101, 105),
(101, 106),
(101, 130),
(102, 105),
(102, 106),
(102, 107),
(102, 127),
(103, 97),
(103, 104),
(104, 105),
(104, 107),
(104, 111),
(105, 105),
(105, 106),
(105, 109),
(106, 105),
(106, 106),
(106, 113),
(107, 97),
(107, 104),
(109, 105),
(109, 107),
(109, 127),
(110, 97),
(110, 104),
(112, 105),
(112, 106),
(112, 125),
(113, 95),
(114, 97),
(114, 100),
(115, 95),
(115, 105),
(115, 107),
(116, 97),
(116, 104),
(117, 105),
(117, 107),
(117, 127),
(118, 95),
(118, 105),
(118, 107),
(119, 95),
(120, 105),
(120, 106),
(120, 129),
(121, 97),
(121, 104),
(122, 97),
(122, 104),
(123, 105),
(123, 106),
(123, 108),
(125, 105),
(125, 106),
(125, 110),
(126, 105),
(126, 107),
(126, 111),
(127, 105),
(127, 107),
(127, 114),
(128, 105),
(128, 106),
(128, 120),
(129, 105),
(129, 107),
(129, 121),
(130, 97),
(130, 104),
(131, 88),
(131, 105),
(131, 107),
(132, 105),
(132, 107),
(132, 112),
(133, 105),
(133, 106),
(133, 115),
(135, 95),
(135, 105),
(135, 107),
(135, 121),
(136, 95),
(136, 105),
(136, 107),
(136, 130),
(137, 105),
(137, 106),
(137, 120),
(138, 105),
(138, 106),
(138, 122),
(139, 97),
(139, 99),
(140, 105),
(140, 106),
(140, 115),
(141, 105),
(141, 106),
(141, 128),
(142, 105),
(142, 106),
(142, 119),
(143, 97),
(143, 99),
(144, 95),
(144, 105),
(144, 107),
(145, 105),
(145, 107),
(145, 127),
(147, 97),
(147, 99),
(148, 105),
(148, 107),
(148, 127),
(149, 96),
(149, 105),
(149, 122),
(150, 105),
(150, 107),
(150, 124),
(151, 96),
(151, 105),
(152, 105),
(152, 107),
(152, 117),
(153, 95),
(153, 105),
(153, 107),
(154, 105),
(154, 106),
(154, 107),
(154, 113),
(155, 96),
(155, 105),
(155, 122),
(156, 97),
(156, 100),
(157, 94),
(157, 101),
(158, 94),
(158, 101),
(159, 94),
(159, 101),
(160, 94),
(160, 101),
(161, 97),
(161, 102),
(162, 97),
(162, 103),
(163, 97),
(163, 100),
(164, 105),
(164, 107),
(164, 116),
(165, 93),
(165, 95),
(165, 105),
(165, 107),
(166, 88),
(166, 105),
(166, 107),
(167, 97),
(167, 99),
(168, 95),
(168, 105),
(168, 107),
(169, 92),
(169, 96),
(169, 105),
(170, 105),
(170, 107),
(171, 105),
(171, 107),
(171, 126),
(172, 105),
(172, 106),
(172, 122),
(173, 97),
(173, 99),
(174, 97),
(174, 107),
(175, 105),
(175, 107),
(175, 118),
(176, 105),
(176, 107),
(176, 127),
(177, 95),
(177, 105),
(177, 107),
(178, 95),
(179, 97),
(179, 104),
(180, 105),
(180, 106),
(180, 130),
(181, 95),
(181, 105),
(181, 107),
(181, 113),
(182, 97),
(182, 104);

-- --------------------------------------------------------

--
-- Table structure for table `product_collections`
--

CREATE TABLE `product_collections` (
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `collection_id` bigint(20) UNSIGNED NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_collections`
--

INSERT INTO `product_collections` (`product_id`, `collection_id`, `sort_order`) VALUES
(93, 4, 0),
(96, 4, 0),
(97, 4, 0),
(103, 4, 0),
(107, 4, 0),
(110, 4, 0),
(114, 4, 0),
(116, 4, 0),
(121, 4, 0),
(122, 4, 0),
(130, 4, 0),
(139, 4, 0),
(143, 4, 0),
(147, 4, 0),
(156, 4, 0),
(161, 4, 0),
(162, 4, 0),
(163, 4, 0),
(167, 4, 0),
(173, 4, 0),
(174, 4, 0),
(179, 4, 0),
(182, 4, 0),
(95, 5, 0),
(157, 5, 0),
(158, 5, 0),
(159, 5, 0),
(160, 5, 0),
(88, 6, 0),
(89, 6, 1),
(90, 6, 2),
(92, 6, 3),
(94, 6, 4),
(98, 6, 5),
(99, 6, 6),
(100, 6, 7),
(101, 6, 8),
(102, 6, 9),
(104, 6, 10),
(105, 6, 11),
(106, 6, 12),
(109, 6, 13),
(112, 6, 14),
(113, 6, 15),
(115, 6, 16),
(117, 6, 17),
(118, 6, 18),
(119, 6, 19),
(120, 6, 20),
(123, 6, 21),
(125, 6, 22),
(126, 6, 23),
(127, 6, 24),
(128, 6, 25),
(129, 6, 26),
(131, 6, 27),
(132, 6, 28),
(133, 6, 29),
(135, 6, 30),
(136, 6, 31),
(137, 6, 32),
(138, 6, 33),
(140, 6, 34),
(141, 6, 35),
(142, 6, 36),
(144, 6, 37),
(145, 6, 38),
(148, 6, 39),
(149, 6, 40),
(150, 6, 41),
(151, 6, 42),
(152, 6, 43),
(153, 6, 44),
(154, 6, 45),
(155, 6, 46),
(164, 6, 47),
(165, 6, 48),
(166, 6, 49),
(168, 6, 50),
(169, 6, 51),
(170, 6, 52),
(171, 6, 53),
(172, 6, 54),
(175, 6, 56),
(176, 6, 57),
(177, 6, 58),
(178, 6, 59),
(180, 6, 60),
(181, 6, 61),
(95, 9, 0);

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `variant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `url` varchar(1000) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `variant_id`, `url`, `alt_text`, `sort_order`, `created_at`) VALUES
(88, 88, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', '1872 Vetiver product image', 0, '2026-08-25 00:15:33.862'),
(89, 89, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Afternoon Swim product image', 0, '2026-08-25 00:15:33.871'),
(90, 90, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Allure Home Sport product image', 0, '2026-08-25 00:15:33.879'),
(92, 92, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Ambre Nuit product image', 0, '2026-08-25 00:15:33.883'),
(94, 94, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Angels’ Share product image', 0, '2026-08-25 00:15:33.887'),
(98, 98, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Attrape Rêves product image', 0, '2026-08-25 00:15:33.894'),
(99, 99, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Aventus product image', 0, '2026-08-25 00:15:33.895'),
(100, 100, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Baccarat Rouge Extrait 540 product image', 0, '2026-08-25 00:15:33.897'),
(101, 101, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Black Opium product image', 0, '2026-08-25 00:15:33.898'),
(102, 102, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Black Orchid product image', 0, '2026-08-25 00:15:33.899'),
(104, 104, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Blue De Chanel product image', 0, '2026-08-25 00:15:33.903'),
(105, 105, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Bvlgari Le Gemme product image', 0, '2026-08-25 00:15:33.905'),
(106, 106, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Carmina product image', 0, '2026-08-25 00:15:33.907'),
(109, 109, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Costa Azzura product image', 0, '2026-08-25 00:15:33.911'),
(112, 112, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Delina De Marly product image', 0, '2026-08-25 00:15:33.915'),
(113, 113, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Demo product image', 0, '2026-08-25 00:15:33.916'),
(117, 115, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Dior Sauvage Elixir product image', 0, '2026-08-25 00:15:33.919'),
(119, 117, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Ebene Fume product image', 0, '2026-08-25 00:15:33.928'),
(120, 118, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Equivoque product image', 0, '2026-08-25 00:15:33.929'),
(121, 119, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Falcon Leather product image', 0, '2026-08-25 00:15:33.930'),
(122, 120, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Flower Bomb product image', 0, '2026-08-25 00:15:33.931'),
(125, 123, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Goddess Burberry product image', 0, '2026-08-25 00:15:33.935'),
(127, 125, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Good Girl product image', 0, '2026-08-25 00:15:33.939'),
(128, 126, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Homme product image', 0, '2026-08-25 00:15:33.941'),
(129, 127, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Homme Intense product image', 0, '2026-08-25 00:15:33.942'),
(130, 128, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Idole product image', 0, '2026-08-25 00:15:33.944'),
(131, 129, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Imagination product image', 0, '2026-08-25 00:15:33.945'),
(133, 131, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Interlude Man product image', 0, '2026-08-25 00:15:33.948'),
(134, 132, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Irish Green product image', 0, '2026-08-25 00:15:33.949'),
(135, 133, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Jadore product image', 0, '2026-08-25 00:15:33.951'),
(137, 135, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'L’immensite product image', 0, '2026-08-25 00:15:33.955'),
(138, 136, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'La Nuit De L’Homme product image', 0, '2026-08-25 00:15:33.957'),
(139, 137, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'La Vie Est Belle product image', 0, '2026-08-25 00:15:33.959'),
(140, 138, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Les Sables Roses product image', 0, '2026-08-25 00:15:33.960'),
(142, 140, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Miss Dior product image', 0, '2026-08-25 00:15:33.963'),
(143, 141, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Moonlight Pathcholi product image', 0, '2026-08-25 00:15:33.964'),
(144, 142, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Myrhh And Tonka product image', 0, '2026-08-25 00:15:33.965'),
(146, 144, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'N°5 product image', 0, '2026-08-25 00:15:33.967'),
(147, 145, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Noir Extreme product image', 0, '2026-08-25 00:15:33.968'),
(150, 148, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Ombre Leather product image', 0, '2026-08-25 00:15:33.973'),
(151, 149, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Ombre Nomade product image', 0, '2026-08-25 00:15:33.975'),
(152, 150, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'One Million product image', 0, '2026-08-25 00:15:33.976'),
(153, 151, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Oud For Greatness product image', 0, '2026-08-25 00:15:33.977'),
(154, 152, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Oud Intense product image', 0, '2026-08-25 00:15:33.979'),
(155, 153, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Oud Stallion product image', 0, '2026-08-25 00:15:33.980'),
(156, 154, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Oud Zarian product image', 0, '2026-08-25 00:15:33.981'),
(157, 155, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Pacific Chill product image', 0, '2026-08-25 00:15:33.983'),
(166, 164, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Promise product image', 0, '2026-08-25 00:15:34.009'),
(167, 165, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Red Tobacco product image', 0, '2026-08-25 00:15:34.013'),
(168, 166, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Reflection Man product image', 0, '2026-08-25 00:15:34.017'),
(170, 168, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Royal Oud product image', 0, '2026-08-25 00:15:34.022'),
(171, 169, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Santal 33 product image', 0, '2026-08-25 00:15:34.025'),
(172, 170, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Sauvage product image', 0, '2026-08-25 00:15:34.028'),
(173, 171, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Srk Special product image', 0, '2026-08-25 00:15:34.029'),
(174, 172, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Stellar Times product image', 0, '2026-08-25 00:15:34.032'),
(177, 175, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Terre De Hermes product image', 0, '2026-08-25 00:15:34.039'),
(178, 176, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Tobacco Vanille product image', 0, '2026-08-25 00:15:34.041'),
(179, 177, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Velvet Desert Oud product image', 0, '2026-08-25 00:15:34.042'),
(180, 178, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'X Masculine product image', 0, '2026-08-25 00:15:34.044'),
(182, 180, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'YSL Libre product image', 0, '2026-08-25 00:15:34.047'),
(183, 181, NULL, '/media/efaea24f-1537-4325-ae57-27c0ac9d8a3f', 'Absolu Aventus product image', 0, '2026-08-25 00:15:34.048'),
(191, 156, NULL, '/media/c1f59bda-0f1a-4922-965e-05b7712bbfea', 'Passio product image', 0, '2026-08-25 00:36:08.440'),
(192, 163, NULL, '/media/e31dda77-5d33-4103-bb93-76361f17ace3', 'Pragma product image', 0, '2026-08-25 00:36:31.548'),
(193, 96, NULL, '/media/72f5ad71-f5f0-4e4a-a665-1f1eb5f2e096', 'Ardor product image', 0, '2026-08-25 00:36:46.005'),
(194, 114, NULL, '/media/ae01b2d8-4e0a-4bbb-b738-6a2d094db682', 'Devoir Elixer product image', 0, '2026-08-25 00:36:57.439'),
(195, 114, NULL, '/media/0727eebc-5f3d-401d-8873-3d9642cf8db4', 'Devoir Elixer product gallery image 1', 1, '2026-08-25 00:36:57.439'),
(196, 114, NULL, '/media/6c84119e-68ea-461e-8191-280bc7265059', 'Devoir Elixer product gallery image 2', 2, '2026-08-25 00:36:57.445'),
(201, 162, NULL, '/media/2c43adc1-3166-4e63-bbb6-5b3bf4293f81', 'Pour Homme product image', 0, '2026-08-25 00:38:26.786'),
(202, 161, NULL, '/media/c8b31234-c7e4-40b5-8bf5-37537051f421', 'Pour Femme product image', 0, '2026-08-25 00:42:13.606'),
(203, 167, NULL, '/media/ba471c7b-c9e7-4d26-951f-40446b6ee14f', 'Rendevous product image', 0, '2026-08-25 00:51:17.131'),
(204, 110, NULL, '/media/8bc58aeb-20d4-48bc-bfcf-d07a073a9cc1', 'Dark Moon product image', 0, '2026-08-25 00:58:37.358'),
(205, 139, NULL, '/media/c60d16aa-9d65-4787-9cc1-77459b4648f4', 'Memoir product image', 0, '2026-08-25 00:58:52.513'),
(206, 182, NULL, '/media/73aa391c-7296-4323-a6c4-657d6b01d12d', 'Legendery product image', 0, '2026-08-25 00:59:04.427'),
(207, 122, NULL, '/media/59893720-1a18-4157-8222-d0a62505ed39', 'French Oud product image', 0, '2026-08-25 01:06:26.738'),
(208, 130, NULL, '/media/b68794f2-adcc-4710-83c2-d89fdba08192', 'Indian Funk product image', 0, '2026-08-25 01:13:55.984'),
(209, 107, NULL, '/media/3d7dd828-0414-42db-a973-fc480d82298a', 'City Walk product image', 0, '2026-08-25 01:24:56.606'),
(210, 179, NULL, '/media/e966e024-bfe3-4921-aeca-82abc853c391', 'XS Night Extreme product image', 0, '2026-08-25 01:29:32.866'),
(211, 121, NULL, '/media/aadc536c-996e-46c7-a2e5-8ec1169bbcf6', 'Forbidden Love product image', 0, '2026-08-25 01:36:02.898'),
(212, 103, NULL, '/media/9eec7f7f-da48-4d9c-b14b-a6f0e8c12135', 'Bloody Oud product image', 0, '2026-08-25 01:36:11.370'),
(213, 143, NULL, '/media/8cceb039-c259-46e0-8688-1ac6007dcc6f', 'Myth product image', 0, '2026-08-25 01:44:46.790'),
(215, 173, NULL, '/media/89021192-03ad-4079-aa28-c22e99db2011', 'Surreal product image', 0, '2026-08-25 01:48:17.209'),
(216, 97, NULL, '/media/4a9a05c9-f52e-4bc7-bb5a-41a29207d1ff', 'Arousal product image', 0, '2026-08-25 01:59:07.005'),
(217, 147, NULL, '/media/13afe80f-5ea5-4ab6-8e2d-21c0e8090a2d', 'Nostalgia product image', 0, '2026-08-25 02:01:54.355'),
(218, 116, NULL, '/media/3bd6982f-fe34-4630-aa5d-3f33923adaf0', 'Domestic Noir product image', 0, '2026-08-25 02:03:34.387'),
(219, 93, NULL, '/media/26850e1a-cd56-4ace-89f2-80585bdb29e3', 'Anemoia product image', 0, '2026-08-25 02:09:14.826'),
(221, 160, NULL, '/media/ce957eb1-29be-4616-b366-7628129d80fa', 'Poem French Silver product image', 0, '2026-08-25 20:17:22.092'),
(222, 159, NULL, '/media/c5947abc-cab7-4c8c-b7bc-1a8520abd156', 'Poem French Gold product image', 0, '2026-08-25 20:24:28.453'),
(223, 158, NULL, '/media/5511c59b-4f69-4026-a3fe-23f59175bd96', 'Poem Arabic Silver product image', 0, '2026-08-25 20:24:36.919'),
(224, 157, NULL, '/media/48ec4573-2f48-4d6f-a79c-79ef60f091ec', 'Poem Arabic Gold product image', 0, '2026-08-25 20:24:42.069'),
(226, 174, NULL, '/media/ad7adf92-b190-4ce5-9af1-f27f8527f3a5', 'Tar product image', 0, '2026-08-25 20:57:28.535'),
(228, 146, NULL, '/media/774c0ac8-aea7-44fb-9e67-e73af6479cd7', 'Noir Extreme, Forbidden Love, French Oud bundle image', 0, '2026-08-27 19:48:53.908'),
(229, 134, NULL, '/media/c252e92c-c5c7-4adf-a4ba-71209ab657a0', 'Jadore, YSL Libre,  French Oud bundle image', 0, '2026-08-27 19:51:01.146'),
(230, 124, NULL, '/media/fb1ee5f0-557b-4221-8de5-81031189713b', 'Goddess Burberry, Good Girl, Forbidden Love bundle image', 0, '2026-08-27 19:51:24.817'),
(231, 111, NULL, '/media/4413d81a-8f04-44d3-a4e5-75d3e009a2cc', 'Dark Moon, Indian Funk, Domestic Noir bundle image', 0, '2026-08-27 19:51:47.778'),
(232, 108, NULL, '/media/057638a2-6d77-4617-a83b-555c5aefcafb', 'City Walk, XS Night Extreme, Indian Funk bundle image', 0, '2026-08-27 19:52:18.587'),
(233, 91, NULL, '/media/85533024-de01-4662-ae21-7d6811232f6c', 'Allure Home Sport, Sauvage, Legendary bundle image', 0, '2026-08-27 19:52:39.078'),
(234, 95, NULL, '/media/53265fcb-55ed-44f2-b568-b03bcef9b857', 'Arabella product image', 0, '2026-08-27 23:04:43.817');

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('PENDING','PUBLISHED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `reviewer_name` varchar(120) NOT NULL,
  `reviewer_email` varchar(190) NOT NULL,
  `title` varchar(120) NOT NULL,
  `body` text NOT NULL,
  `recommends_product` tinyint(1) NOT NULL DEFAULT 1,
  `is_verified_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `submitted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ;

-- --------------------------------------------------------

--
-- Table structure for table `product_review_media`
--

CREATE TABLE `product_review_media` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `media_asset_id` bigint(20) UNSIGNED NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `price_pence` int(10) UNSIGNED NOT NULL,
  `compare_at_price_pence` int(10) UNSIGNED DEFAULT NULL,
  `cost_pence` int(10) UNSIGNED DEFAULT NULL,
  `stock_on_hand` int(11) NOT NULL DEFAULT 0,
  `low_stock_threshold` int(10) UNSIGNED NOT NULL DEFAULT 5,
  `weight_grams` int(10) UNSIGNED DEFAULT NULL,
  `option_values_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_values_json`)),
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `title`, `sku`, `price_pence`, `compare_at_price_pence`, `cost_pence`, `stock_on_hand`, `low_stock_threshold`, `weight_grams`, `option_values_json`, `is_default`, `status`, `created_at`, `updated_at`) VALUES
(88, 88, '100 ml', 'N7-P-00000088', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.858', '2026-08-25 00:15:33.858'),
(89, 89, '100 ml', 'N7-P-00000089', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.865', '2026-08-25 00:15:33.865'),
(90, 90, '100 ml', 'N7-P-00000090', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.878', '2026-08-25 00:15:33.878'),
(91, 91, '3 × 100 ml', 'N7-P-00000091', 8599, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.880', '2026-08-25 00:15:33.880'),
(92, 92, '100 ml', 'N7-P-00000092', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.882', '2026-08-25 00:15:33.882'),
(93, 93, '100ml', 'N7-P-00000093', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.885', '2026-08-25 00:15:33.885'),
(94, 94, '100 ml', 'N7-P-00000094', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.887', '2026-08-25 00:15:33.887'),
(95, 95, '100ml', 'N7-P-00000095', 5400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.889', '2026-08-25 00:15:33.889'),
(96, 96, '100ml', 'N7-P-00000096', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.891', '2026-08-25 00:15:33.891'),
(97, 97, '100ml', 'N7-P-00000097', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.893', '2026-08-25 00:15:33.893'),
(98, 98, '100 ml', 'N7-P-00000098', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.894', '2026-08-25 00:15:33.894'),
(99, 99, '100 ml', 'N7-P-00000099', 3700, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.895', '2026-08-25 00:15:33.895'),
(100, 100, '100 ml', 'N7-P-00000100', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.897', '2026-08-25 00:15:33.897'),
(101, 101, '100 ml', 'N7-P-00000101', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.898', '2026-08-25 00:15:33.898'),
(102, 102, '100 ml', 'N7-P-00000102', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.899', '2026-08-25 00:15:33.899'),
(103, 103, '100ml', 'N7-P-00000103', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.901', '2026-08-25 00:15:33.901'),
(104, 104, '100 ml', 'N7-P-00000104', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.902', '2026-08-25 00:15:33.902'),
(105, 105, '100 ml', 'N7-P-00000105', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.905', '2026-08-25 00:15:33.905'),
(106, 106, '100 ml', 'N7-P-00000106', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.907', '2026-08-25 00:15:33.907'),
(107, 107, '100ml', 'N7-P-00000107', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.908', '2026-08-25 00:15:33.908'),
(108, 108, '3 × 100 ml', 'N7-P-00000108', 8000, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.910', '2026-08-25 00:15:33.910'),
(109, 109, '100 ml', 'N7-P-00000109', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.911', '2026-08-25 00:15:33.911'),
(110, 110, '100ml', 'N7-P-00000110', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.912', '2026-08-25 00:15:33.912'),
(111, 111, '3 × 100 ml', 'N7-P-00000111', 8000, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.914', '2026-08-25 00:15:33.914'),
(112, 112, '100 ml', 'N7-P-00000112', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.915', '2026-08-25 00:15:33.915'),
(113, 113, '100ml', 'N7-P-00000113', 3200, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.916', '2026-08-25 00:15:33.916'),
(114, 114, '100ml', 'N7-P-00000114', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.917', '2026-08-25 00:15:33.917'),
(115, 115, '100ml', 'N7-P-00000115', 3700, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.919', '2026-08-25 00:15:33.919'),
(116, 116, '100ml', 'N7-P-00000116', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.926', '2026-08-25 00:15:33.926'),
(117, 117, '100 ml', 'N7-P-00000117', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.928', '2026-08-25 00:15:33.928'),
(118, 118, '100ml', 'N7-P-00000118', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.929', '2026-08-25 00:15:33.929'),
(119, 119, '100ml', 'N7-P-00000119', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.930', '2026-08-25 00:15:33.930'),
(120, 120, '100 ml', 'N7-P-00000120', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.931', '2026-08-25 00:15:33.931'),
(121, 121, '100ml', 'N7-P-00000121', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.933', '2026-08-25 00:15:33.933'),
(122, 122, '100ml', 'N7-P-00000122', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.934', '2026-08-25 00:15:33.934'),
(123, 123, '100 ml', 'N7-P-00000123', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.935', '2026-08-25 00:15:33.935'),
(124, 124, '3 × 100 ml', 'N7-P-00000124', 8599, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.937', '2026-08-25 00:15:33.937'),
(125, 125, '100 ml', 'N7-P-00000125', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.939', '2026-08-25 00:15:33.939'),
(126, 126, '100 ml', 'N7-P-00000126', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.940', '2026-08-25 00:15:33.940'),
(127, 127, '100 ml', 'N7-P-00000127', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.942', '2026-08-25 00:15:33.942'),
(128, 128, '100 ml', 'N7-P-00000128', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.943', '2026-08-25 00:15:33.943'),
(129, 129, '100 ml', 'N7-P-00000129', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.945', '2026-08-25 00:15:33.945'),
(130, 130, '100ml', 'N7-P-00000130', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.946', '2026-08-25 00:15:33.946'),
(131, 131, '100 ml', 'N7-P-00000131', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.948', '2026-08-25 00:15:33.948'),
(132, 132, '100 ml', 'N7-P-00000132', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.949', '2026-08-25 00:15:33.949'),
(133, 133, '100 ml', 'N7-P-00000133', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.950', '2026-08-25 00:15:33.950'),
(134, 134, '3 × 100 ml', 'N7-P-00000134', 8599, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.952', '2026-08-25 00:15:33.952'),
(135, 135, '100ml', 'N7-P-00000135', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.955', '2026-08-25 00:15:33.955'),
(136, 136, '100 ml', 'N7-P-00000136', 3500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.957', '2026-08-25 00:15:33.957'),
(137, 137, '100 ml', 'N7-P-00000137', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.959', '2026-08-25 00:15:33.959'),
(138, 138, '100 ml', 'N7-P-00000138', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.960', '2026-08-25 00:15:33.960'),
(139, 139, '100ml', 'N7-P-00000139', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.961', '2026-08-25 00:15:33.961'),
(140, 140, '100 ml', 'N7-P-00000140', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.963', '2026-08-25 00:15:33.963'),
(141, 141, '100 ml', 'N7-P-00000141', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.964', '2026-08-25 00:15:33.964'),
(142, 142, '100 ml', 'N7-P-00000142', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.965', '2026-08-25 00:15:33.965'),
(143, 143, '100ml', 'N7-P-00000143', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.966', '2026-08-25 00:15:33.966'),
(144, 144, '100ml', 'N7-P-00000144', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.967', '2026-08-25 00:15:33.967'),
(145, 145, '100 ml', 'N7-P-00000145', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.968', '2026-08-25 00:15:33.968'),
(146, 146, '3 × 100 ml', 'N7-P-00000146', 8599, NULL, NULL, 20, 5, NULL, '{\"size\":\"3 × 100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.970', '2026-08-25 00:15:33.970'),
(147, 147, '100ml', 'N7-P-00000147', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.972', '2026-08-25 00:15:33.972'),
(148, 148, '100 ml', 'N7-P-00000148', 3500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.973', '2026-08-25 00:15:33.973'),
(149, 149, '100 ml', 'N7-P-00000149', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.975', '2026-08-25 00:15:33.975'),
(150, 150, '100 ml', 'N7-P-00000150', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.976', '2026-08-25 00:15:33.976'),
(151, 151, '100 ml', 'N7-P-00000151', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.977', '2026-08-25 00:15:33.977'),
(152, 152, '100 ml', 'N7-P-00000152', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.979', '2026-08-25 00:15:33.979'),
(153, 153, '100ml', 'N7-P-00000153', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.980', '2026-08-25 00:15:33.980'),
(154, 154, '100 ml', 'N7-P-00000154', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.981', '2026-08-25 00:15:33.981'),
(155, 155, '100 ml', 'N7-P-00000155', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.983', '2026-08-25 00:15:33.983'),
(156, 156, '100ml', 'N7-P-00000156', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.984', '2026-08-25 00:15:33.984'),
(157, 157, '100ml', 'N7-P-00000157', 6000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.985', '2026-08-25 00:15:33.985'),
(158, 158, '100ml', 'N7-P-00000158', 6000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.988', '2026-08-25 00:15:33.988'),
(159, 159, '100ml', 'N7-P-00000159', 6000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.990', '2026-08-25 00:15:33.990'),
(160, 160, '100ml', 'N7-P-00000160', 6000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.993', '2026-08-25 00:15:33.993'),
(161, 161, '100ml', 'N7-P-00000161', 3700, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.996', '2026-08-25 00:15:33.996'),
(162, 162, '100ml', 'N7-P-00000162', 3700, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:33.999', '2026-08-25 00:15:33.999'),
(163, 163, '100ml', 'N7-P-00000163', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.003', '2026-08-25 00:15:34.003'),
(164, 164, '100 ml', 'N7-P-00000164', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.008', '2026-08-25 00:15:34.008'),
(165, 165, '100ml', 'N7-P-00000165', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.013', '2026-08-25 00:15:34.013'),
(166, 166, '100 ml', 'N7-P-00000166', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.017', '2026-08-25 00:15:34.017'),
(167, 167, '100ml', 'N7-P-00000167', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.019', '2026-08-25 00:15:34.019'),
(168, 168, '100ml', 'N7-P-00000168', 4200, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.021', '2026-08-25 00:15:34.021'),
(169, 169, '100 ml', 'N7-P-00000169', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.025', '2026-08-25 00:15:34.025'),
(170, 170, '100 ml', 'N7-P-00000170', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.028', '2026-08-25 00:15:34.028'),
(171, 171, '100 ml', 'N7-P-00000171', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.029', '2026-08-25 00:15:34.029'),
(172, 172, '100 ml', 'N7-P-00000172', 4000, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.031', '2026-08-25 00:15:34.031'),
(173, 173, '100ml', 'N7-P-00000173', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.034', '2026-08-25 00:15:34.034'),
(174, 174, '100ml', 'N7-P-00000174', 4400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.035', '2026-08-25 00:15:34.035'),
(175, 175, '100 ml', 'N7-P-00000175', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.038', '2026-08-25 00:15:34.038'),
(176, 176, '100 ml', 'N7-P-00000176', 3600, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.040', '2026-08-25 00:15:34.040'),
(177, 177, '100ml', 'N7-P-00000177', 3800, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.042', '2026-08-25 00:15:34.042'),
(178, 178, '100ml', 'N7-P-00000178', 4500, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.044', '2026-08-25 00:15:34.044'),
(179, 179, '100ml', 'N7-P-00000179', 3300, NULL, NULL, 20, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.046', '2026-08-25 00:15:34.046'),
(180, 180, '100 ml', 'N7-P-00000180', 3400, NULL, NULL, 20, 5, NULL, '{\"size\":\"100 ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.047', '2026-08-25 00:15:34.047'),
(181, 181, '100ml', 'N7-P-00000181', 4000, NULL, NULL, 0, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.048', '2026-08-25 00:15:34.048'),
(182, 182, '100ml', 'N7-P-00000182', 3300, NULL, NULL, 0, 5, NULL, '{\"size\":\"100ml\"}', 1, 'ACTIVE', '2026-08-25 00:15:34.049', '2026-08-25 00:15:34.049');

-- --------------------------------------------------------

--
-- Table structure for table `product_videos`
--

CREATE TABLE `product_videos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(1000) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_submission_attempts`
--

CREATE TABLE `review_submission_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `succeeded` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(190) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `offer_type` enum('BUY_X_GET_Y_FREE') NOT NULL DEFAULT 'BUY_X_GET_Y_FREE',
  `buy_quantity` int(10) UNSIGNED NOT NULL DEFAULT 5,
  `free_quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `name`, `slug`, `status`, `offer_type`, `buy_quantity`, `free_quantity`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Buy 5 Get 1 Free', 'buy-5-get-1-free', 'ACTIVE', 'BUY_X_GET_Y_FREE', 5, 1, 0, '2026-08-27 20:39:14.200', '2026-08-28 00:09:49.417');

-- --------------------------------------------------------

--
-- Table structure for table `sale_products`
--

CREATE TABLE `sale_products` (
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_products`
--

INSERT INTO `sale_products` (`sale_id`, `product_id`, `sort_order`) VALUES
(1, 90, 0),
(1, 107, 1),
(1, 110, 2),
(1, 116, 3),
(1, 121, 4),
(1, 122, 5),
(1, 123, 6),
(1, 125, 7),
(1, 130, 8),
(1, 133, 9),
(1, 170, 10),
(1, 179, 11),
(1, 180, 12),
(1, 182, 13);

-- --------------------------------------------------------

--
-- Table structure for table `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `migration_name` varchar(190) NOT NULL,
  `applied_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schema_migrations`
--

INSERT INTO `schema_migrations` (`migration_name`, `applied_at`) VALUES
('001_initial_commerce_schema.sql', '2026-08-21 22:07:56.472'),
('002_checkout_rate_limits.sql', '2026-08-21 22:07:56.489'),
('003_admin_email_media.sql', '2026-08-21 22:35:43.082'),
('004_private_media_delivery.sql', '2026-08-24 23:28:21.941'),
('005_global_inventory_defaults.sql', '2026-08-24 23:47:51.908'),
('006_contact_form_rate_limits.sql', '2026-08-25 02:47:29.296'),
('007_storefront_page_sections.sql', '2026-08-25 03:08:21.190'),
('008_dynamic_social_media_links.sql', '2026-08-25 03:23:51.840'),
('009_product_reviews.sql', '2026-08-25 04:27:28.091'),
('010_n7_storefront_collection.sql', '2026-08-25 22:10:36.614'),
('011_dedicated_bundles.sql', '2026-08-27 03:48:39.237'),
('012_sales.sql', '2026-08-27 20:39:14.207'),
('013_recreation_product_fields.sql', '2026-08-27 23:01:03.663'),
('014_seed_recreation_product_codes.sql', '2026-08-27 23:09:33.566'),
('015_seed_remaining_recreation_product_codes.sql', '2026-08-27 23:12:37.278');

-- --------------------------------------------------------

--
-- Table structure for table `shipping_methods`
--

CREATE TABLE `shipping_methods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `method_type` enum('FLAT_RATE','FREE_SHIPPING','LOCAL_PICKUP') NOT NULL,
  `price_pence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `free_over_pence` int(10) UNSIGNED DEFAULT NULL,
  `estimated_days_min` int(10) UNSIGNED DEFAULT NULL,
  `estimated_days_max` int(10) UNSIGNED DEFAULT NULL,
  `configuration_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration_json`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping_zones`
--

CREATE TABLE `shipping_zones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping_zone_countries`
--

CREATE TABLE `shipping_zone_countries` (
  `zone_id` bigint(20) UNSIGNED NOT NULL,
  `country_code` char(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `setting_key` varchar(190) NOT NULL,
  `setting_group` varchar(100) NOT NULL,
  `value_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value_json`)),
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`setting_key`, `setting_group`, `value_json`, `is_public`, `updated_by`, `updated_at`) VALUES
('contact.address', 'contact', '\"\"', 1, 1, '2026-08-25 05:16:14.580'),
('contact.email', 'contact', '\"info@n7cosmetics.co.uk\"', 1, 1, '2026-08-25 03:24:42.362'),
('contact.phone', 'contact', '\"\"', 1, 1, '2026-08-25 05:16:14.575'),
('contact.whatsapp', 'contact', '\"\"', 1, 1, '2026-08-25 03:24:42.363'),
('inventory.low_stock_threshold', 'inventory', '5', 0, 1, '2026-08-25 03:24:42.370'),
('social.links', 'social', '[{\"platform\":\"facebook\",\"url\":\"https://www.facebook.com/share/1HDWp2a4Ta/?mibextid=wwXIfr\"},{\"platform\":\"instagram\",\"url\":\"https://www.instagram.com/n7cosmeticsuk?igsh=ajFpYWx5bWIzdjdj&utm_source=qr\"},{\"platform\":\"tiktok\",\"url\":\"https://www.tiktok.com/@n7cosmetics?_t=ZN-8u4oGXi9Qt4&_r=1\"}]', 1, 1, '2026-08-25 03:23:27.294'),
('store.currency', 'store', '\"GBP\"', 1, 1, '2026-08-25 03:24:42.370');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrators`
--
ALTER TABLE `administrators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_administrators_email` (`email`);

--
-- Indexes for table `administrator_password_resets`
--
ALTER TABLE `administrator_password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_administrator_password_resets_token` (`token_hash`),
  ADD KEY `idx_administrator_password_resets_admin` (`administrator_id`,`created_at`),
  ADD KEY `idx_administrator_password_resets_expiry` (`expires_at`);

--
-- Indexes for table `admin_login_attempts`
--
ALTER TABLE `admin_login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_login_attempts_lookup` (`email`,`ip_address`,`attempted_at`);

--
-- Indexes for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admin_sessions_token_hash` (`token_hash`),
  ADD KEY `idx_admin_sessions_administrator` (`administrator_id`),
  ADD KEY `idx_admin_sessions_expiry` (`expires_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_administrator` (`administrator_id`),
  ADD KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_logs_created_at` (`created_at`);

--
-- Indexes for table `bundle_items`
--
ALTER TABLE `bundle_items`
  ADD PRIMARY KEY (`bundle_product_id`,`component_variant_id`),
  ADD KEY `idx_bundle_items_component` (`component_variant_id`),
  ADD KEY `idx_bundle_items_bundle_sort` (`bundle_product_id`,`sort_order`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categories_slug` (`slug`),
  ADD KEY `idx_categories_parent` (`parent_id`);

--
-- Indexes for table `checkout_attempts`
--
ALTER TABLE `checkout_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_checkout_attempts_ip_time` (`ip_address`,`attempted_at`);

--
-- Indexes for table `collections`
--
ALTER TABLE `collections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_collections_slug` (`slug`),
  ADD KEY `idx_collections_status_sort` (`status`,`sort_order`);

--
-- Indexes for table `contact_form_attempts`
--
ALTER TABLE `contact_form_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_form_attempts_ip_time` (`ip_address`,`attempted_at`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_coupons_code` (`code`),
  ADD KEY `idx_coupons_discount` (`discount_id`);

--
-- Indexes for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_coupon_redemptions_order` (`order_id`),
  ADD KEY `idx_coupon_redemptions_coupon_email` (`coupon_id`,`customer_email`);

--
-- Indexes for table `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discounts_active_window` (`is_active`,`starts_at`,`ends_at`);

--
-- Indexes for table `discount_categories`
--
ALTER TABLE `discount_categories`
  ADD PRIMARY KEY (`discount_id`,`category_id`),
  ADD KEY `fk_discount_categories_category` (`category_id`);

--
-- Indexes for table `discount_collections`
--
ALTER TABLE `discount_collections`
  ADD PRIMARY KEY (`discount_id`,`collection_id`),
  ADD KEY `fk_discount_collections_collection` (`collection_id`);

--
-- Indexes for table `discount_products`
--
ALTER TABLE `discount_products`
  ADD PRIMARY KEY (`discount_id`,`product_id`),
  ADD KEY `fk_discount_products_product` (`product_id`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_logs_status_created` (`status`,`created_at`),
  ADD KEY `idx_email_logs_recipient_created` (`recipient`,`created_at`);

--
-- Indexes for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_media_assets_storage_key` (`storage_key`),
  ADD UNIQUE KEY `uq_media_assets_public_url` (`public_url`(191)),
  ADD KEY `idx_media_assets_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_orders_order_number` (`order_number`),
  ADD KEY `idx_orders_customer_email` (`customer_email`),
  ADD KEY `idx_orders_status_placed` (`status`,`placed_at`),
  ADD KEY `idx_orders_payment_reference` (`payment_reference`);

--
-- Indexes for table `order_addresses`
--
ALTER TABLE `order_addresses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_addresses_type` (`order_id`,`address_type`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`),
  ADD KEY `idx_order_items_variant` (`variant_id`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_status_history_order` (`order_id`,`created_at`),
  ADD KEY `fk_order_status_history_administrator` (`administrator_id`);

--
-- Indexes for table `page_sections`
--
ALTER TABLE `page_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_page_sections_key` (`page_key`,`section_key`),
  ADD KEY `idx_page_sections_page_sort` (`page_key`,`is_enabled`,`sort_order`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payments_idempotency_key` (`idempotency_key`),
  ADD KEY `idx_payments_order` (`order_id`),
  ADD KEY `idx_payments_provider_reference` (`provider`,`provider_reference`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_products_slug` (`slug`),
  ADD KEY `idx_products_status_featured` (`status`,`featured`),
  ADD KEY `idx_products_name` (`name`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`product_id`,`category_id`),
  ADD KEY `idx_product_categories_category` (`category_id`);

--
-- Indexes for table `product_collections`
--
ALTER TABLE `product_collections`
  ADD PRIMARY KEY (`product_id`,`collection_id`),
  ADD KEY `idx_product_collections_collection_sort` (`collection_id`,`sort_order`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product_sort` (`product_id`,`sort_order`),
  ADD KEY `idx_product_images_variant` (`variant_id`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_reviews_product_status_date` (`product_id`,`status`,`published_at`,`submitted_at`),
  ADD KEY `idx_product_reviews_status_date` (`status`,`submitted_at`),
  ADD KEY `idx_product_reviews_email_product` (`reviewer_email`,`product_id`);

--
-- Indexes for table `product_review_media`
--
ALTER TABLE `product_review_media`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_review_media_asset` (`media_asset_id`),
  ADD KEY `idx_product_review_media_review_sort` (`review_id`,`sort_order`,`id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_variants_sku` (`sku`),
  ADD KEY `idx_product_variants_product` (`product_id`);

--
-- Indexes for table `product_videos`
--
ALTER TABLE `product_videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_videos_product_sort` (`product_id`,`sort_order`);

--
-- Indexes for table `review_submission_attempts`
--
ALTER TABLE `review_submission_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_submission_attempts_ip_time` (`ip_address`,`attempted_at`),
  ADD KEY `idx_review_submission_attempts_product_time` (`product_id`,`attempted_at`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sales_slug` (`slug`),
  ADD KEY `idx_sales_status_sort` (`status`,`sort_order`,`created_at`);

--
-- Indexes for table `sale_products`
--
ALTER TABLE `sale_products`
  ADD PRIMARY KEY (`sale_id`,`product_id`),
  ADD KEY `idx_sale_products_product` (`product_id`),
  ADD KEY `idx_sale_products_sale_sort` (`sale_id`,`sort_order`);

--
-- Indexes for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`migration_name`);

--
-- Indexes for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shipping_methods_zone` (`zone_id`,`is_active`,`sort_order`);

--
-- Indexes for table `shipping_zones`
--
ALTER TABLE `shipping_zones`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shipping_zone_countries`
--
ALTER TABLE `shipping_zone_countries`
  ADD PRIMARY KEY (`zone_id`,`country_code`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `idx_site_settings_group` (`setting_group`),
  ADD KEY `fk_site_settings_updated_by` (`updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `administrators`
--
ALTER TABLE `administrators`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `administrator_password_resets`
--
ALTER TABLE `administrator_password_resets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_login_attempts`
--
ALTER TABLE `admin_login_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `checkout_attempts`
--
ALTER TABLE `checkout_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `collections`
--
ALTER TABLE `collections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `contact_form_attempts`
--
ALTER TABLE `contact_form_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discounts`
--
ALTER TABLE `discounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_assets`
--
ALTER TABLE `media_assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_addresses`
--
ALTER TABLE `order_addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `page_sections`
--
ALTER TABLE `page_sections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=235;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_review_media`
--
ALTER TABLE `product_review_media`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT for table `product_videos`
--
ALTER TABLE `product_videos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review_submission_attempts`
--
ALTER TABLE `review_submission_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping_zones`
--
ALTER TABLE `shipping_zones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `administrator_password_resets`
--
ALTER TABLE `administrator_password_resets`
  ADD CONSTRAINT `fk_administrator_password_resets_admin` FOREIGN KEY (`administrator_id`) REFERENCES `administrators` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD CONSTRAINT `fk_admin_sessions_administrator` FOREIGN KEY (`administrator_id`) REFERENCES `administrators` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_administrator` FOREIGN KEY (`administrator_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bundle_items`
--
ALTER TABLE `bundle_items`
  ADD CONSTRAINT `fk_bundle_items_bundle` FOREIGN KEY (`bundle_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bundle_items_component` FOREIGN KEY (`component_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `fk_coupons_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  ADD CONSTRAINT `fk_coupon_redemptions_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  ADD CONSTRAINT `fk_coupon_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `discount_categories`
--
ALTER TABLE `discount_categories`
  ADD CONSTRAINT `fk_discount_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discount_categories_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `discount_collections`
--
ALTER TABLE `discount_collections`
  ADD CONSTRAINT `fk_discount_collections_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discount_collections_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `discount_products`
--
ALTER TABLE `discount_products`
  ADD CONSTRAINT `fk_discount_products_discount` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discount_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD CONSTRAINT `fk_media_assets_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `administrators` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_addresses`
--
ALTER TABLE `order_addresses`
  ADD CONSTRAINT `fk_order_addresses_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_order_status_history_administrator` FOREIGN KEY (`administrator_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD CONSTRAINT `fk_product_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_categories_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_collections`
--
ALTER TABLE `product_collections`
  ADD CONSTRAINT `fk_product_collections_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_collections_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_review_media`
--
ALTER TABLE `product_review_media`
  ADD CONSTRAINT `fk_product_review_media_asset` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets` (`id`),
  ADD CONSTRAINT `fk_product_review_media_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_videos`
--
ALTER TABLE `product_videos`
  ADD CONSTRAINT `fk_product_videos_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `review_submission_attempts`
--
ALTER TABLE `review_submission_attempts`
  ADD CONSTRAINT `fk_review_submission_attempts_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_products`
--
ALTER TABLE `sale_products`
  ADD CONSTRAINT `fk_sale_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sale_products_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD CONSTRAINT `fk_shipping_methods_zone` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipping_zone_countries`
--
ALTER TABLE `shipping_zone_countries`
  ADD CONSTRAINT `fk_shipping_zone_countries_zone` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD CONSTRAINT `fk_site_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `administrators` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
