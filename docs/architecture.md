# Arquitectura

## Visión general

GymFlow es una aplicación **multi-tenant** de una sola instancia: todos los gimnasios comparten el mismo esquema de base de datos y el aislamiento se garantiza con la columna `organizationId` presente en cada tabla de negocio.

```text
┌─────────────────────────────────────────────┐
│              Next.js (App Router)           │
│  Server Components + Server Actions         │
│  Auth.js (sesión JWT con org y rol)         │
└──────────────────┬──────────────────────────┘
                   │ Prisma
┌──────────────────▼──────────────────────────┐
│                PostgreSQL                   │
│  organizations · users · plans              │
│  members · payments                         │
└─────────────────────────────────────────────┘
```

## Multi-tenancy

- Cada gimnasio es una fila en `organizations`.
- Cada usuario pertenece a exactamente una organización (`users.organizationId`).
- **Toda** consulta a `plans`, `members` y `payments` debe filtrar por la organización de la sesión.
- La organización y el rol viajan en la sesión de Auth.js (JWT).
- Un gimnasio con estado `suspended` no puede iniciar sesión ni operar en la plataforma.

### Regla de oro

Ninguna consulta de negocio se ejecuta sin `organizationId`. La lógica de acceso a datos vive en `src/server/` y recibe siempre el contexto de la sesión, nunca un `organizationId` proveniente del cliente.

## Roles

| Rol | Alcance | Permisos |
| --- | --- | --- |
| `platform_owner` | Plataforma | Crear y suspender gimnasios, ver estado de cobro global |
| `admin` | Un gimnasio | Todo dentro de su gimnasio, incluida la gestión de usuarios del staff |
| `staff` | Un gimnasio | Socios, planes y pagos; no gestiona usuarios |

## Modelo de datos

### organizations

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `name` | `String` | Nombre del gimnasio |
| `status` | `String` | `active` \| `suspended` |
| `contactName` | `String?` | Persona de contacto |
| `contactPhone` | `String?` | Teléfono |
| `contactEmail` | `String?` | Correo |
| `subscriptionPaidUntil` | `DateTime?` | Último mes pagado a la plataforma |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

### users

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `email` | `String` | Único |
| `passwordHash` | `String` | bcrypt |
| `name` | `String` | Nombre visible |
| `role` | `String` | `platform_owner` \| `admin` \| `staff` |
| `organizationId` | `String?` | Nulo solo para `platform_owner` |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

### plans

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `organizationId` | `String` | FK → organizations |
| `name` | `String` | Ej. "Mensual" |
| `price` | `Decimal` | Precio en córdobas |
| `durationDays` | `Int` | 30, 90, 365… |
| `active` | `Boolean` | Baja lógica |

### members

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `organizationId` | `String` | FK → organizations |
| `firstName` / `lastName` | `String` | |
| `phone` | `String?` | |
| `email` | `String?` | |
| `planId` | `String?` | FK → plans |
| `status` | `String` | `active` \| `inactive` |
| `nextPaymentDate` | `DateTime?` | Próximo vencimiento |
| `startedAt` | `DateTime` | Alta en el gimnasio |
| `notes` | `String?` | |

### payments

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `organizationId` | `String` | FK → organizations |
| `memberId` | `String` | FK → members |
| `amount` | `Decimal` | Monto cobrado |
| `paidAt` | `DateTime` | Fecha del pago |
| `method` | `String` | `cash` \| `transfer` \| `card` \| `other` |
| `periodStart` / `periodEnd` | `DateTime` | Periodo cubierto |
| `notes` | `String?` | |

## Reglas de negocio

1. **Registro de pago**: un socio activo con plan asignado (aunque ese plan haya sido desactivado después) puede registrar cobros en córdobas. Se guarda el monto realmente recibido y el método. El servidor fija `paidAt` a la fecha actual; `periodStart` = `paidAt` o el vencimiento anterior si todavía es futuro; `periodEnd` = `periodStart + durationDays` del plan vigente. Los períodos son semiabiertos `[periodStart, periodEnd)`; se suman días calendario UTC sin alterar la hora. Pago, período y `members.nextPaymentDate = periodEnd` se escriben en una transacción serializable, con reintentos si hay conflicto simultáneo. No se borran cobros históricos. Cambiar el plan no cambia los períodos ya cobrados.
2. **Atraso**: un socio está atrasado cuando `nextPaymentDate < hoy` y su estado es `active`. Sin cobros la fecha permanece vacía; `active` significa inscrito, no al día con sus pagos. El panel de atrasos y las alertas aún no están implementados.
3. **Baja lógica**: los socios no se eliminan; pasan a `inactive` para conservar el historial de pagos y pueden reactivarse.
4. **Plan asignado**: al crear o editar un socio se comprueba que el plan pertenezca al mismo gimnasio. Solo se pueden asignar planes activos; un socio puede conservar uno ya asignado aunque luego se desactive.
5. **Suspensión de gimnasio**: el dueño de la plataforma cambia `organizations.status` a `suspended`; el login del gimnasio se rechaza y las sesiones activas dejan de operar.

## Decisiones

| Decisión | Motivo |
| --- | --- |
| PostgreSQL + Prisma | Tipado seguro, migraciones versionadas y camino directo a producción en Neon/Supabase. |
| Sesión JWT (no de base de datos) | El proveedor de credenciales de Auth.js no soporta sesiones en base de datos; JWT permite incluir `organizationId` y `role`. |
| Cobro manual B2B al inicio | Evita depender de pasarelas limitadas en Nicaragua; la suspensión de acceso es el mecanismo de cobro. |
| Sin enums de Prisma | Portabilidad y migraciones más simples; los valores válidos se validan con Zod en la capa de servidor. |
