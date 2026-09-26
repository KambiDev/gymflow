# GymFlow

Plataforma SaaS multi-tenant para la gestión integral de gimnasios, control de membresías, clientes y cobranzas.

## Descripción del Proyecto

GymFlow permite a gimnasios operar de forma independiente garantizando el aislamiento total de sus datos. La plataforma contempla tres niveles de acceso:

- **Super Administrador**: Gestión global de la plataforma, alta de gimnasios, registro manual de pagos de suscripción del SaaS y métricas consolidadas sin acceso a datos personales de clientes.
- **Administrador de Gimnasio**: Gestión completa de su gimnasio, definición de planes de membresía, administración de clientes, cobros, reportes financieros y gestión de personal de recepción.
- **Recepción**: Registro de clientes, cobros de membresías y seguimiento de estados de cuenta.

## Stack Tecnológico

- **Frontend**: React, Tailwind CSS, Vite, Axios, React Router.
- **Backend**: Node.js, Express, mysql2/promise, JWT, Bcryptjs.
- **Base de Datos**: MySQL con motor InnoDB y claves foráneas en cascada.

## Estructura del Repositorio

```text
gymflow/
├── server/                     # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Configuración de base de datos y entorno
│   │   ├── controllers/        # Controladores de la API
│   │   ├── middlewares/        # Autenticación JWT, RBAC y aislamiento de tenant
│   │   ├── routes/             # Definición de rutas
│   │   ├── services/           # Lógica de cálculo de vencimientos y estados
│   │   └── app.js              # Punto de entrada del servidor
│   ├── migrations/             # Scripts SQL de estructura de base de datos
│   ├── scripts/                # Utilidades de migración
│   └── package.json
│
├── client/                     # Aplicación web (React + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Cliente HTTP centralizado
│   │   ├── components/         # Componentes visuales y de navegación
│   │   ├── context/            # Contexto global de autenticación
│   │   ├── pages/              # Vistas de autenticación, super admin y gimnasio
│   │   └── App.jsx             # Enrutamiento protegido
│   └── package.json
│
└── package.json                # Scripts generales del proyecto
```

## Requisitos Previos

- Node.js (versión 18 o superior)
- MySQL / MariaDB (versión 8.0 o superior / 10.4 o superior)

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/KambiDev/gymflow.git
cd gymflow
```

### 2. Configuración de Variables de Entorno

Crear el archivo `.env` dentro del directorio `server/` tomando como referencia `server/.env.example`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=gymflow

JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

### 3. Migración de Base de Datos

Ejecutar la creación automática de base de datos y tablas:

```bash
npm run migrate
```

### 4. Ejecución en Desarrollo

Iniciar el servidor backend:

```bash
npm run dev:server
```

Iniciar la aplicación frontend:

```bash
npm run dev:client
```

El backend estará disponible en `http://localhost:5000` y el cliente en `http://localhost:5173`.
