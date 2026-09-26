-- ============================================================================
-- GYMFLOW SAAS - MIGRACIÓN INICIAL
-- ============================================================================

-- 1. TENANTS (Gimnasios)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    trial_ends_at DATETIME NOT NULL,
    subscription_ends_at DATETIME NULL,
    is_suspended TINYINT(1) NOT NULL DEFAULT 0,
    suspended_reason TEXT NULL,
    alert_days_before_expiration INT NOT NULL DEFAULT 5,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenants_status (is_suspended, subscription_ends_at, trial_ends_at)
) ENGINE=InnoDB;

-- 2. USERS (Usuarios del sistema)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('super_admin', 'admin', 'reception') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_users_tenant_role (tenant_id, role)
) ENGINE=InnoDB;

-- 3. SUBSCRIPTION_PAYMENTS (Pagos del SaaS de Gyms al Super Admin)
CREATE TABLE IF NOT EXISTS subscription_payments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('cash', 'transfer', 'card', 'other') NOT NULL DEFAULT 'cash',
    notes TEXT NULL,
    registered_by_user_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by_user_id) REFERENCES users(id),
    INDEX idx_sub_payments_tenant (tenant_id, created_at DESC)
) ENGINE=InnoDB;

-- 4. PLANS (Membresías ofrecidas por cada gimnasio)
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_plans_tenant (tenant_id, is_active)
) ENGINE=InnoDB;

-- 5. CLIENTS (Clientes de cada gimnasio)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    photo_url TEXT NULL,
    notes TEXT NULL,
    current_expiration_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_clients_search (tenant_id, full_name, phone),
    INDEX idx_clients_expiration (tenant_id, current_expiration_date)
) ENGINE=InnoDB;

-- 6. PAYMENTS (Pagos de clientes al gimnasio)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('cash', 'card', 'transfer') NOT NULL DEFAULT 'cash',
    days_added INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT NULL,
    registered_by_user_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
    FOREIGN KEY (registered_by_user_id) REFERENCES users(id),
    INDEX idx_payments_client (client_id, created_at DESC),
    INDEX idx_payments_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB;
