# Despliegue de GymFlow: opciones y configuración

GymFlow requiere un servidor Next.js (Auth.js, Server Actions, Proxy y rutas dinámicas) y PostgreSQL **persistente**. No funciona como sitio HTML estático. No hay un proveedor contratado ni un despliegue creado desde este repositorio.

## Rutas viables

| Ruta | Ventaja | Responsabilidad adicional |
| --- | --- | --- |
| **Vercel + PostgreSQL administrado** (recomendación para evaluar el piloto) | Adaptador verificado para Next.js 16, HTTPS y funciones gestionadas | Revisar precios/límites actuales, elegir base con pooler y respaldos, proteger previews y coordinar migraciones por separado |
| **Node.js o Docker + PostgreSQL administrado** | Un proceso `next start` soporta todas las funciones de Next.js; mayor control del despliegue | Operar servidor, proxy HTTPS, procesos, monitoreo, parches, límites de conexión y respaldos |

No se recomienda `Prisma Dev`, SQLite, exportación estática ni una base de datos que se borre al reiniciar el servicio. La elección final depende de presupuesto, acceso a cuentas, región, backups y quién operará el servicio.

## Configuración ya disponible en el repositorio

- Node.js compatible con Prisma 7: 20.19+, 22.12+ o 24+; scripts `npm run build` y `npm run start`. `npm ci` genera Prisma Client durante `postinstall`.
- `DATABASE_URL`: conexión PostgreSQL de la **aplicación** (preferiblemente agrupada/pooled en serverless). `src/lib/db.ts` la usa con `@prisma/adapter-pg`.
- `DATABASE_URL_UNPOOLED`: conexión **directa** para Prisma CLI; `prisma7.config.ts` la usa si está definida, o usa `DATABASE_URL` para desarrollo local o proveedores sin pooler. Mantenla solo en el entorno seguro que corre migraciones; **no** la publiques como variable de funciones serverless ni en previews. No intercambies conexiones de diferentes bases.
- `AUTH_SECRET`: valor aleatorio de al menos 32 bytes (generar con `npx auth secret`); `AUTH_URL`: URL pública HTTPS canónica, requerida por `pilot:check` en producción. Configura ambas por entorno; nunca en `NEXT_PUBLIC_*` ni en Git. Auth.js v5 puede inferir la URL, pero el preflight de GymFlow exige una URL de producción explícita. Revisa los encabezados de host que acepta el proxy (`trustHost: true`).
- `npm run pilot:check`: verifica variables esenciales y consulta las tablas principales sin escribir; no sustituye la prueba de login, `npx prisma migrate status` ni la restauración. `npm run pilot:bootstrap-owner` crea una sola cuenta de dueño con contraseña temporal entregada por entorno, sin datos demo (ver [procedimiento del piloto](pilot.md)).

## Secuencia recomendada para el primer entorno

1. Elige proveedor y PostgreSQL persistente; configura copias automáticas y prueba una restauración en otra base **antes** de cargar datos reales. Crea bases y secretos independientes para producción y cualquier preview/ensayo. No uses el seed demo en producción.
2. En el entorno del proveedor, define `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` y `NODE_ENV=production`. Para serverless, selecciona la URL pooled del proveedor para `DATABASE_URL`; configura acceso SSL según las instrucciones del proveedor. Mantén `DATABASE_URL_UNPOOLED` únicamente en el entorno de mantenimiento, apuntando **a la misma base de destino**, para `prisma migrate deploy/status`.
3. Desde un entorno de mantenimiento seguro con acceso a esa base, ejecuta `npm ci`, `npx prisma migrate deploy` y `npx prisma migrate status`. Es una operación deliberada, **no** parte de `next build` ni de cada despliegue preview. No ejecutes `migrate dev` ni `db push` sobre producción.
4. Con variables de la base del piloto, ejecuta `npm run pilot:check` y, solo si aún no existe un dueño, `npm run pilot:bootstrap-owner`. Retira la contraseña inicial del entorno y cámbiala tras el primer login.
5. Construye con `npm run build`. En Vercel conecta el repositorio como proyecto Next.js, selecciona rama/entorno y configura variables en el panel; en Node/Docker ejecuta el servidor con `npm run start` detrás de un proxy HTTPS confiable. No conectes `main` a despliegues automáticos de producción hasta decidir cómo se ordenarán copias, migraciones y publicación. Verifica el dominio, login, aislamiento por gimnasio y cobros con el [checklist del piloto](pilot.md).

**Actualizaciones:** prepara cambios de esquema compatibles, respalda y valida la restauración; después ejecuta `prisma migrate deploy` con conexión directa y publica la nueva versión de la app en el orden acordado. Vigila errores y conexiones. No ejecutes migraciones automáticamente durante builds: un preview jamás debe modificar la base de producción. Si no puedes mantener bases separadas para preview, desactiva esos despliegues antes de conectar datos reales.

## Referencias oficiales consultadas

- [Next.js 16: opciones de despliegue](https://nextjs.org/docs/app/getting-started/deploying) y [requisitos de plataformas](https://nextjs.org/docs/app/guides/deploying-to-platforms).
- [Prisma 7: Vercel, generación de cliente, previews y pooling](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel).
- [Auth.js: variables, proxy y despliegue](https://authjs.dev/getting-started/deployment).
- [Neon: URLs pooled y directas con Prisma 7](https://neon.com/docs/guides/prisma). Neon es un ejemplo posible de PostgreSQL administrado, no un proveedor ya elegido.
