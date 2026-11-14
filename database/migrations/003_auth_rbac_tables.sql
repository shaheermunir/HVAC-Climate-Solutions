-- Migration 003: Authentication, RBAC Permissions, Sessions & Password Reset Tokens

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL UNIQUE AFTER id,
  ADD COLUMN IF NOT EXISTS permissions JSON NULL AFTER role,
  ADD COLUMN IF NOT EXISTS technician_id VARCHAR(100) NULL AFTER permissions,
  ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER active;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_sessions_user (user_id),
  INDEX idx_auth_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pwd_reset_user (user_id),
  INDEX idx_pwd_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
