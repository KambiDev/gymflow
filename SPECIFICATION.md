# GymFlow SaaS — Especificación Técnica & Blueprint de Desarrollo

> **Propósito del documento**: Servir como la única fuente de la verdad (_Single Source of Truth_) para el desarrollo del sistema mediante modelos de lenguaje (como DeepSeek). Contiene las reglas de negocio, esquemas de bases de datos, contratos de API, algoritmos de cálculo y la guía de prompts paso a paso.

---

## 1. Visión General y Modelo de Negocio

**GymFlow** es un software como servicio (SaaS) multi-inquilino (_multi-tenant_) diseñado para gimnasios medianos y pequeños.

- **Modelo B2B**: El dueño de la plataforma (Super Admin) vende suscripciones mensuales a los gimnasios (Tenants).
- **Cobro Manual del SaaS**: Muchos dueños de gimnasio se manejan en efectivo o transferencias directas; no se requiere pasarela de pago inicial. El Super Admin registra los pagos y activa/extiende las suscripciones.
- **Aislamiento Estricto y Privacidad**: Cada gimnasio solo ve y opera sus propios clientes, planes y cobros. **El Super Admin NUNCA tiene acceso a datos personales de clientes ni cobros individuales de los gimnasios**; solo visualiza métricas agregadas (totales numéricos).

### 1.1 Actores y Roles

| Rol               | Ámbito                    | Responsabilidades                                                                                                                                                               | Restricciones de Privacidad                                                                               |
| :---------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **`super_admin`** | Plataforma Global         | • Alta de gimnasios (manual con cobro inicial).<br>• Registrar pagos de suscripción del SaaS.<br>• Activar / Suspender gimnasios.<br>• Ver métricas globales (MRR, total gyms). | **PROHIBIDO**: Ver listas de clientes, nombres, teléfonos o pagos individuales de cualquier gimnasio.     |
| **`admin`**       | Su Gimnasio (`tenant_id`) | • Configurar planes de membresía.<br>• Gestión total de clientes y cobros.<br>• Ver reportes financieros (caja, ingresos).<br>• Crear usuarios con rol `reception`.             | Solo opera dentro de su `tenant_id`.                                                                      |
| **`reception`**   | Su Gimnasio (`tenant_id`) | • Buscar clientes.<br>• Registrar nuevos clientes.<br>• Registrar pagos y renovaciones.<br>• Ver alertas de clientes por vencer / vencidos.                                     | **PROHIBIDO**: Modificar configuración de planes, crear usuarios o ver reportes financieros consolidados. |

---

## 2. Esquema de Base de Datos MySQL (DDL Definitivo)

- Motor: `InnoDB`
- Codificación: `utf8mb4_unicode_ci`
- Identificadores: `VARCHAR(36)` con UUID v4 generado por aplicación (evita ataques de enumeración secuencial entre tenants).

```sql
CREATE DATABASE IF NOT EXISTS gymflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gymflow;

-- ============================================================================
-- 1. TENANTS (Gimnasios)
-- ============================================================================
CREATE TABLE tenants (
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

-- ============================================================================
-- 2. USERS (Usuarios del sistema)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NULL, -- NULL únicamente para super_admin
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

-- ============================================================================
-- 3. SUBSCRIPTION_PAYMENTS (Pagos del SaaS de Gyms al Super Admin)
-- ============================================================================
CREATE TABLE subscription_payments (
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

-- ============================================================================
-- 4. PLANS (Membresías ofrecidas por cada gimnasio)
-- ============================================================================
CREATE TABLE plans (
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

-- ============================================================================
-- 5. CLIENTS (Clientes de cada gimnasio)
-- ============================================================================
CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    photo_url TEXT NULL,
    notes TEXT NULL,
    current_expiration_date DATE NULL, -- Fecha límite de membresía
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_clients_search (tenant_id, full_name, phone),
    INDEX idx_clients_expiration (tenant_id, current_expiration_date)
) ENGINE=InnoDB;

-- ============================================================================
-- 6. PAYMENTS (Pagos de clientes al gimnasio)
-- ============================================================================
CREATE TABLE payments (
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
```

---

## 3. Algoritmos y Reglas de Negocio

### 3.1 Cálculo Dinámico del Estado del Gimnasio (Tenant)

```javascript
function getTenantSubscriptionStatus(tenant) {
  const now = new Date();

  if (tenant.is_suspended) {
    return { status: "suspended", label: "Suspendido" };
  }

  if (tenant.subscription_ends_at) {
    const subEnd = new Date(tenant.subscription_ends_at);
    if (subEnd < now) {
      return { status: "suspended", label: "Vencido / Suspendido" };
    }
    const daysRemaining = Math.ceil((subEnd - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 5) {
      return { status: "expiring_soon", label: "Por Vencer", daysRemaining };
    }
    return { status: "active", label: "Activo", daysRemaining };
  }

  const trialEnd = new Date(tenant.trial_ends_at);
  if (trialEnd >= now) {
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return { status: "trial", label: "Periodo de Prueba", daysRemaining };
  }

  return { status: "suspended", label: "Trial Expirado" };
}
```

### 3.2 Cálculo de Vencimiento de Membresía del Cliente al Pagar

$$\text{fechaBase} = \max(\text{hoy}, \text{vencimientoActual})$$
$$\text{nuevoVencimiento} = \text{fechaBase} + \text{diasDelPlan}$$

```javascript
function calculateClientNewExpiration(currentExpirationDate, durationDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = new Date(today);

  if (currentExpirationDate) {
    const currentExp = new Date(currentExpirationDate);
    currentExp.setHours(0, 0, 0, 0);
    if (currentExp > today) {
      baseDate = new Date(currentExp);
    }
  }

  const periodStart = new Date(baseDate);
  const periodEnd = new Date(baseDate);
  periodEnd.setDate(periodEnd.getDate() + Number(durationDays));

  return {
    periodStart: periodStart.toISOString().split("T")[0], // YYYY-MM-DD
    periodEnd: periodEnd.toISOString().split("T")[0], // YYYY-MM-DD
    daysAdded: Number(durationDays),
  };
}
```

---

## 4. Contratos de API REST

Headers obligatorios en endpoints protegidos:
`Authorization: Bearer <jwt_token>`

JWT Payload:

```json
{
  "id": "uuid-user",
  "email": "admin@gym.com",
  "role": "super_admin" | "admin" | "reception",
  "tenantId": "uuid-tenant" | null,
  "fullName": "Carlos Gómez"
}
```

---

## 5. Estructura del Código

```text
gymflow/
├── server/                    # Backend Node.js + Express
│   ├── src/
│   │   ├── config/            # db.js, env.js
│   │   ├── middlewares/       # auth, role, tenant
│   │   ├── services/          # date, tenant
│   │   ├── controllers/       # auth, superadmin, clients, payments, plans, reports
│   │   ├── routes/            # auth, superadmin, gym
│   │   └── app.js             # Express app
│   ├── migrations/            # DDL SQL
│   ├── scripts/               # migrate.js
│   ├── .env.example
│   └── package.json
│
├── client/                    # Frontend React + Tailwind (Vite)
│   ├── src/
│   │   ├── api/               # axiosClient.js
│   │   ├── context/           # AuthContext.jsx
│   │   ├── components/        # ui, layout, common
│   │   ├── pages/             # auth, superadmin, gym
│   │   ├── App.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
```
