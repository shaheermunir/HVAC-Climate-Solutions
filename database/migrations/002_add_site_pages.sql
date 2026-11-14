-- ========================================================
-- AIRFLOW CLIMATE SOLUTIONS - HOSTINGER MYSQL PRODUCTION SCHEMA
-- Migration: 002_add_site_pages.sql
-- Adds site_pages table for full page section CMS editing
-- ========================================================

CREATE TABLE IF NOT EXISTS site_pages (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  meta_description TEXT NULL,
  nav_label VARCHAR(100) NULL,
  sections JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
