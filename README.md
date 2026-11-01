# GymFlow

Plataforma SaaS de gestión para gimnasios: control de socios, membresías y pagos, con cobro B2B por suscripción.

> **Estado**: Fase 0 — configuración base y autenticación (en desarrollo).

## ¿Qué resuelve?

Los gimnasios pequeños suelen llevar el control de sus socios en cuadernos o hojas de cálculo: no saben con certeza quién pagó, cuándo vence cada membresía ni quién está atrasado. GymFlow centraliza esa información en un panel web simple, multi-gimnasio, pensado para funcionar bien incluso con conexiones lentas.

Cada gimnasio administra sus propios socios, planes y pagos. El dueño de la plataforma gestiona el acceso de los gimnasios y su estado de cobro.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + TypeScript |
| UI | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Base de datos | [PostgreSQL](https://www.postgresql.org) |
| ORM | [Prisma](https://www.prisma.io) |
| Autenticación | [Auth.js](https://authjs.dev) (NextAuth v5) |
| Deploy | [Vercel](https://vercel.com) |

## Requisitos

- Node.js **20.9+**
- PostgreSQL **14+**

## Puesta en marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/KambiDev/gymflow.git
cd gymflow

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL y genera un AUTH_SECRET con:
# npx auth secret

# 4. Crear la base de datos y aplicar migraciones
npx prisma migrate dev

# 5. Levantar el servidor de desarrollo
npm run dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint |

## Estructura del proyecto

```text
src/
  app/                # Rutas (App Router)
    (auth)/           # Login
    (dashboard)/      # Área del gimnasio
    admin/            # Panel del dueño de la plataforma
  components/         # Componentes de UI
  lib/                # Cliente de base de datos, auth y utilidades
  server/             # Server Actions y lógica de negocio
prisma/
  schema.prisma       # Modelo de datos
  seed.ts             # Datos iniciales de desarrollo
docs/
  architecture.md     # Decisiones de arquitectura y modelo de datos
```

## Roadmap

- [x] **Fase 0.1** — Scaffold del proyecto y documentación base
- [ ] **Fase 0.2** — Esquema de datos y migraciones
- [ ] **Fase 0.3** — Autenticación, roles y multi-tenancy
- [ ] **Fase 1** — Gestión de socios y planes
- [ ] **Fase 2** — Registro de pagos y vencimientos
- [ ] **Fase 3** — Dashboard y alertas de atrasos
- [ ] **Fase 4** — Panel del dueño (alta/suspensión de gimnasios)
- [ ] **Fase 5** — Deploy y piloto con gimnasios reales

## Convenciones de trabajo

- `main` solo recibe merges; nunca se commitea directamente sobre ella.
- Ramas por tipo: `feature/…`, `fix/…`, `chore/…`, `docs/…`.
- Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/): `feat(members): add member creation form`.
- Un commit = un cambio coherente. Una rama = un avance pequeño y revisable.

## Documentación

- [Arquitectura y modelo de datos](docs/architecture.md)
