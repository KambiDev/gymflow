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
| `platform_owner` | Plataforma | Crear y suspender gimnasios, ver estado de cobro global y restablecer contraseñas de administradores |
| `admin` | Un gimnasio | Todo dentro de su gimnasio, incluida la gestión de usuarios del staff y el restablecimiento de sus contraseñas |
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
| `subscriptionPaidUntil` | `DateTime?` | Último día pagado a la plataforma (fecha local de Nicaragua, inclusiva) |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

### users

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `String` (cuid) | PK |
| `email` | `String` | Único |
| `passwordHash` | `String` | bcrypt |
| `sessionVersion` | `Int` | Versión de sesión; al cambiar la contraseña sube y revoca JWT anteriores |
| `name` | `String` | Nombre visible |
| `role` | `String` | `platform_owner` \| `admin` \| `staff` |
| `active` | `Boolean` | Acceso reversible; desactivar bloquea inicio de sesión y siguientes solicitudes |
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
2. **Alertas de vencimiento**: se consideran solo socios `active` del gimnasio. La fecha se interpreta en el calendario de Nicaragua (UTC−06:00 en el período operativo actual). **Atrasado**: `nextPaymentDate` anterior al inicio de hoy en Nicaragua; un vencimiento de hoy todavía no está atrasado. **Próximo**: vence hoy o en los seis días siguientes. **Sin pagos**: fecha vacía; no se clasifica como atraso. El panel resume las tres categorías y muestra los cinco vencimientos más cercanos; `/dashboard/alerts` permite consultar las listas paginadas y abrir los cobros. Son alertas dentro de la aplicación, sin envíos por SMS, correo o WhatsApp.
3. **Baja lógica**: los socios no se eliminan; pasan a `inactive` para conservar el historial de pagos y pueden reactivarse.
4. **Plan asignado**: al crear o editar un socio se comprueba que el plan pertenezca al mismo gimnasio. Solo se pueden asignar planes activos; un socio puede conservar uno ya asignado aunque luego se desactive.
5. **Suspensión de gimnasio**: el dueño de la plataforma cambia `organizations.status` a `suspended`; el login del gimnasio se rechaza y las sesiones activas dejan de operar.
6. **Alta y cobro B2B**: el dueño de la plataforma registra el gimnasio junto con su primer usuario `admin` en una operación atómica. Ingresa una contraseña inicial que solo se guarda como hash y debe compartir de forma privada; no se recupera ni muestra en el panel. Puede marcar manualmente la fecha hasta la que está pagada la suscripción (día inclusive en Nicaragua) y suspender o reactivar el acceso por separado. La fecha vencida **no suspende automáticamente**.
7. **Personal del gimnasio**: solo `admin` crea cuentas `staff` en su propio gimnasio y las desactiva o reactiva; el rol `staff` no puede administrar usuarios ni alterar cuentas `admin`. Los correos son únicos en toda la plataforma y las contraseñas iniciales solo se guardan como hash bcrypt. El login y los accesos protegidos consultan `users.active` en la base de datos: una cuenta desactivada pierde acceso en la siguiente solicitud, aunque el JWT siga vigente.
8. **Cambio de contraseña**: cualquier usuario activo (dueño de plataforma, administrador o personal) puede cambiar su propia contraseña tras verificar la actual. La nueva tiene mínimo 12 caracteres y se guarda solo como hash bcrypt; la actualización verifica versión y hash anteriores para evitar cambios simultáneos. El cambio incrementa `sessionVersion`: todas las sesiones previas dejan de funcionar en su próxima solicitud y se cierra la sesión actual.
9. **Restablecimiento manual**: el administrador de un gimnasio puede asignar una contraseña nueva solo a cuentas `staff` de su organización. El dueño de plataforma puede restablecer las cuentas `admin` del gimnasio elegido, pero no su propia cuenta desde esa interfaz. El servidor comprueba organización y rol en cada operación, guarda únicamente el hash y aumenta `sessionVersion` para invalidar sesiones existentes. El estado activo/inactivo y la suspensión del gimnasio no cambian. La contraseña se entrega por un canal privado; no hay recuperación automática por correo, SMS ni WhatsApp.
10. **Cierre diario de cobros**: `/dashboard/payments` es una consulta para personal y administradores del gimnasio, no un asiento contable ni un bloqueo de caja. La fecha seleccionada es un día calendario de Nicaragua: se incluyen pagos con `paidAt` en `[06:00 UTC del día, 06:00 UTC del día siguiente)`. Los totales y conteos por método abarcan todos los pagos del día (incluso socios dados de baja); el detalle se pagina de 20 en 20. La descarga CSV incluye **todos** los cobros de la fecha, no solo la página visible; se genera por lotes, con fecha y hora locales, importes decimales exactos y texto escapado contra fórmulas de hoja de cálculo. Las sumas usan Decimal, no coma flotante. Todas las consultas y la descarga se filtran por el `organizationId` de la sesión. No se editan ni eliminan pagos históricos.
11. **Comprobante imprimible**: desde el historial del socio y el cierre diario se puede abrir un comprobante de un cobro específico. La lectura exige coincidencia de `organizationId` de la sesión, socio y cobro; funciona incluso si el socio ya fue dado de baja. Se muestran monto, método, fecha/hora local, período cubierto y referencia del pago registrado; el fin del período es exclusivo. No se guarda ninguna copia adicional ni se modifica el cobro. El nombre del socio es el actual (no existe una instantánea histórica de su nombre). Es una constancia operativa, **no una factura fiscal**.
12. **Historial completo por socio**: `/dashboard/members/[id]/payments` pagina todos los cobros históricos del socio (20 por página, orden por `paidAt` y `id` descendentes), en lugar de cortar los últimos 50. La consulta de filas y el conteo exigen tanto `organizationId` de la sesión como `memberId`. Las páginas fuera de rango redirigen a la última válida; los comprobantes de cobros antiguos siguen disponibles.
13. **Exportación del padrón**: solo el `admin` del gimnasio puede descargar `/dashboard/members/export`. Es un CSV UTF-8 generado por lotes para **todos** los socios de su organización, activos e inactivos, sin depender de búsqueda ni página visible. Incluye ID, nombre, apellido, teléfono, correo, estado, plan actual y fechas en calendario de Nicaragua; no incluye notas privadas ni historial de pagos. El servidor deriva la organización de la sesión, escapa fórmulas de hoja de cálculo y prohíbe cachear el archivo. Contiene datos personales: descargarlo solo cuando sea necesario y almacenarlo de forma segura. No sustituye un respaldo de la base de datos.
14. **Carga inicial desde CSV**: solo el `admin` puede importar en `/dashboard/members/import`. Se aceptan archivos UTF-8 de hasta 256 KB y 200 filas, con encabezado exacto `Nombre,Apellido,Teléfono,Correo` o `Nombre,Apellido,Teléfono,Correo,Plan`. Se comprueba el CSV completo (comillas, número de columnas, nombres y contactos con las mismas reglas del formulario) antes de escribir nada. La columna `Plan` es opcional para el archivo completo; una celda vacía deja al socio sin plan. El nombre se recorta y debe coincidir exactamente con un plan **activo del gimnasio de la sesión**; si no existe, está inactivo o pertenece a otro gimnasio, se rechaza todo el lote con el número de fila. Los correos se normalizan a minúsculas; uno repetido en el archivo o ya presente en el **mismo gimnasio** rechaza toda la carga. La inserción es atómica y siempre crea socios activos, sin cobros, notas ni vencimientos; asignar un plan no implica pago. No modifica registros anteriores. **No existe clave única de correo para socios**, por lo que importaciones simultáneas y filas sin correo requieren revisión humana para evitar duplicados; un fallo de concurrencia obliga a revisar y repetir. El CSV exportado del padrón no es un formato válido de importación: contiene ID y otras columnas que no se aceptan.
15. **Plantilla de importación**: solo el `admin` puede descargar `/dashboard/members/import/template`. El archivo UTF-8 con BOM contiene únicamente el encabezado `Nombre,Apellido,Teléfono,Correo,Plan` y se entrega como adjunto privado sin caché; antes de importarlo hay que agregar al menos una fila. No consulta datos del padrón ni contiene socios de ejemplo.

## Decisiones

| Decisión | Motivo |
| --- | --- |
| PostgreSQL + Prisma | Tipado seguro, migraciones versionadas y camino directo a producción en Neon/Supabase. |
| Sesión JWT (no de base de datos) | El proveedor de credenciales de Auth.js no soporta sesiones en base de datos; JWT permite incluir `organizationId` y `role`. |
| Cobro manual B2B al inicio | Evita depender de pasarelas limitadas en Nicaragua; la suspensión de acceso es el mecanismo de cobro. |
| Sin enums de Prisma | Portabilidad y migraciones más simples; los valores válidos se validan con Zod en la capa de servidor. |
