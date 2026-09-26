# 🏋️‍♂️ GymFlow SaaS — Plataforma Multi-Tenant para Gimnasios

Plataforma SaaS responsive (móvil y escritorio) para que gimnasios gestionen sus clientes, membresías y cobranzas en efectivo/transferencia/tarjeta, con administración centralizada de suscripciones por el dueño de la plataforma (Super Admin).

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Vite 8, Axios, React Router v7.
* **Backend**: Node.js, Express, `mysql2/promise`, JWT, Bcryptjs.
* **Base de Datos**: MySQL / MariaDB (con InnoDB y claves foráneas en cascada).

---

## 🚀 Inicio Rápido

### 1. Variables de Entorno y Migración de Base de Datos
El backend ya cuenta con su archivo `server/.env` preconfigurado para MySQL local (puerto 3307 sin contraseña por defecto, o personalizable a 3306).

Para ejecutar o reiniciar las tablas en MySQL:
```bash
npm run migrate
```

### 2. Iniciar Backend (Puerto 5000)
```bash
npm run dev:server
```

### 3. Iniciar Frontend (Puerto 5173)
```bash
npm run dev:client
```

---

## 📂 Estructura del Proyecto

```text
gymflow/
├── server/                     # Backend API Node.js + Express
│   ├── src/
│   │   ├── config/             # Conexión MySQL pool y variables
│   │   ├── controllers/        # Controladores con firmas preparadas para DeepSeek
│   │   ├── middlewares/        # JWT, RBAC y aislamiento de tenant
│   │   ├── routes/             # Rutas Express (auth, superadmin, gym)
│   │   ├── services/           # Lógica de cálculo de vencimientos y estado del gym
│   │   └── app.js              # Servidor Express
│   ├── migrations/             # DDL SQL de creación de tablas
│   ├── scripts/                # Script runner de migración
│   └── package.json
│
├── client/                     # Frontend React + Tailwind CSS
│   ├── src/
│   │   ├── api/                # Cliente Axios con interceptor JWT
│   │   ├── context/            # AuthContext (sesión y permisos)
│   │   ├── components/         # Navbar, MobileNav táctil, StatusBadge
│   │   ├── pages/              # Login, Register, SuperAdmin, Gym Dashboard, etc.
│   │   └── App.jsx             # Enrutador con guardias de rol
│   └── package.json
│
├── SPECIFICATION.md            # Especificación técnica exhaustiva (Blueprint)
└── package.json                # Scripts raíz
```

---

## 🤖 Guía de Prompts para Desarrollar con DeepSeek

Consulta el archivo [SPECIFICATION.md](file:///k:/Proyectos/gymflow/SPECIFICATION.md) para detalles matemáticos y contratos de API.

### Prompt Fase 2 (Auth y Tenancy):
> *"Trabajaremos en la Fase 2 en la rama `feature/phase-2-auth-and-tenancy`. Con base en `SPECIFICATION.md`, implementa completamente `server/src/controllers/auth.controller.js` (registro de gym con 7 días de trial, login y me) y conecta las rutas en `server/src/routes/auth.routes.js`. Recuerda usar `bcryptjs` para hashear passwords y generar JWT con el payload `{ id, email, role, tenantId, fullName }`."*

### Prompt Fase 3 (Super Admin):
> *"Trabajaremos en la Fase 3 en la rama `feature/phase-3-superadmin`. Implementa los métodos en `server/src/controllers/superadmin.controller.js` y las rutas en `server/src/routes/superadmin.routes.js`: listar gimnasios con conteos numéricos agregados (COUNT), alta manual con primer pago en efectivo, suspensión/activación manual y registro de pagos de suscripción calculando la nueva fecha con `calculateTenantSubscriptionExtension`."*

### Prompt Fase 4 (Planes y Clientes de Gym):
> *"Trabajaremos en la Fase 4 en la rama `feature/phase-4-gym-clients`. Implementa `plans.controller.js` y `clients.controller.js`. Asegúrate de que TODAS las consultas SQL filtren por `WHERE tenant_id = req.tenantId`. Incluye búsqueda por nombre o teléfono en clientes y cálculo de estado dinámico."*

### Prompt Fase 5 (Pagos y Alertas WhatsApp):
> *"Trabajaremos en la Fase 5 en la rama `feature/phase-5-payments-and-alerts`. Implementa `payments.controller.js` utilizando `calculateClientNewExpiration` de `date.service.js`. Actualiza `current_expiration_date` en la tabla `clients` e implementa el endpoint de alertas para cobro."*
