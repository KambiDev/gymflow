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

En desarrollo, Prisma levanta un PostgreSQL local integrado (`prisma dev`). Para producción se usa cualquier PostgreSQL administrado (Neon, Supabase, RDS…).

## Puesta en marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/KambiDev/gymflow.git
cd gymflow

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Ajusta DATABASE_URL con la URL TCP que muestra `npx prisma dev ls`
# y genera un AUTH_SECRET con:
# npx auth secret

# 4. Levantar la base de datos local y aplicar migraciones
npx prisma dev -d
npm run db:migrate

# 5. Levantar el servidor de desarrollo
npm run dev
```

> **Nota**: si reinicias la máquina, vuelve a levantar la base local con `npx prisma dev -d` antes de correr la app.

## Datos de desarrollo

Define en tu `.env` local (nunca se commitea):

```bash
SEED_OWNER_PASSWORD="…"
SEED_DEMO_PASSWORD="…"
```

Después de aplicar las migraciones, carga los datos de ejemplo:

```bash
npm run db:seed
```

El seed imprime en consola los correos de los usuarios creados. Usa contraseñas distintas a las de producción.

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint |
| `npm run db:migrate` | Crea y aplica migraciones de Prisma |
| `npm run db:generate` | Regenera el cliente de Prisma |
| `npm run db:studio` | Abre Prisma Studio |

## Estructura del proyecto

```text
src/
  app/
    (auth)/login/            # Inicio de sesión
    (dashboard)/dashboard/   # Área del gimnasio
    (admin)/admin/           # Panel del dueño de la plataforma
    api/auth/[...nextauth]/  # Endpoints de Auth.js
  components/                # Componentes de UI
  lib/                       # db, auth, session y utilidades
  server/actions/            # Server Actions
  types/                     # Tipos compartidos (sesión de Auth.js)
  proxy.ts                   # Protección de rutas (Next.js 16)
prisma/
  schema.prisma              # Modelo de datos
  seed.ts                    # Datos iniciales de desarrollo
  migrations/                # Migraciones versionadas
docs/
  architecture.md            # Decisiones de arquitectura y modelo de datos
```

## Roadmap

- [x] **Fase 0.1** — Scaffold del proyecto y documentación base
- [x] **Fase 0.2** — Esquema de datos y migraciones
- [x] **Fase 0.3** — Autenticación, roles y multi-tenancy
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
