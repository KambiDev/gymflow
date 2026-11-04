# Preparación del piloto

Este procedimiento no despliega GymFlow ni sustituye un administrador de base de datos. Antes de abrir el piloto, elige el proveedor de alojamiento, una base PostgreSQL persistente y un responsable de operaciones. **Prisma Dev es solo para desarrollo**, no para almacenar datos del piloto.

## Antes de dar acceso

1. Configura `DATABASE_URL` hacia PostgreSQL persistente, `AUTH_SECRET` generado con `npx auth secret` y `AUTH_URL` con la URL pública **HTTPS** canónica. Guarda los secretos en el gestor del proveedor, nunca en Git, logs o capturas. Asegura TLS, un proxy confiable y que los encabezados `Host`/`X-Forwarded-Host` no puedan ser manipulados por clientes; Auth.js usa `trustHost: true`.
2. Instala dependencias y genera el cliente con `npm ci`. Haz una copia verificada **antes** de cada despliegue con cambios de esquema. Aplica migraciones pendientes con `npx prisma migrate deploy`; comprueba después con `npx prisma migrate status`. No ejecutes `prisma migrate dev`, `prisma db push` ni `npm run db:seed` sobre los datos del piloto.
3. Ejecuta `npm run pilot:check` con las variables del entorno de destino. Comprueba la longitud de `AUTH_SECRET`, la URL de PostgreSQL y, si `NODE_ENV=production`, que `AUTH_URL` sea HTTPS; luego consulta las cinco tablas principales sin modificar datos. **No** valida la versión de migraciones ni realiza una prueba HTTP, de copias o de acceso por roles: ejecuta también `npx prisma migrate status`, `npm run build` y la comprobación manual de abajo.
4. Inicializa la primera cuenta del dueño de plataforma **antes** de habilitar el acceso. Define `BOOTSTRAP_OWNER_EMAIL`, `BOOTSTRAP_OWNER_NAME` y `BOOTSTRAP_OWNER_PASSWORD` (12–72 bytes) **solo en el entorno del comando** y ejecuta `npm run pilot:bootstrap-owner`. No pongas la contraseña en argumentos, archivos versionados ni logs; retírala del entorno tras usarla. El comando solo crea un `platform_owner` si todavía no existe ninguno; no restablece contraseñas, no crea un gimnasio demo y solo guarda el hash bcrypt. Si ya hay un dueño, usa su cuenta o el procedimiento de recuperación acordado, no intentes reejecutar el seed. Entra y cambia la contraseña inicial desde `/account/password`. Crea el gimnasio y su administrador desde el panel; entrega la contraseña inicial en privado.

## Respaldo y recuperación

- Define una frecuencia de respaldo y retención conforme al riesgo aceptado por el gimnasio. Haz copias automáticas del proveedor y una prueba de restauración **antes de abrir el piloto** y periódicamente. El CSV del padrón no incluye pagos, usuarios ni configuraciones: **no es un respaldo**.
- Para una copia manual, configura `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` y `PGPASSFILE` fuera del repositorio y con permisos restringidos. Usa una versión de `pg_dump` compatible con la versión del servidor. No pongas contraseñas ni URLs con contraseña en argumentos de comandos (visibles en listados de procesos):

  ```sh
  pg_dump --format=custom --no-owner --no-acl --file=/ruta/segura/gymflow-YYYYMMDD.dump
  ```

- Verifica que el comando terminó correctamente, que el archivo está protegido y que puedes restaurarlo **en una base temporal vacía y aislada**, nunca sobre la base activa:

  ```sh
  # En el entorno de restauración, configura las variables PG* para la base TEMPORAL.
  pg_restore --exit-on-error --no-owner --no-acl --dbname="$PGDATABASE" /ruta/segura/gymflow-YYYYMMDD.dump
  ```

  Confirma en esa base las tablas, gimnasios y cobros esperados sin publicar datos personales ni reutilizarla como entorno de prueba accesible. Elimina la copia temporal según la política de retención y registra fecha y responsable de la prueba. Protege los respaldos con cifrado y acceso restringido.

## Comprobación funcional y contingencia

- En un entorno de ensayo con datos autorizados, verifica inicio de sesión, suspensión manual del gimnasio, aislamiento entre **dos** gimnasios, alta de socios/planes, un cobro y su comprobante, cierre diario con hora de Nicaragua, alertas, exportación y una importación CSV de prueba con revisión previa. Comprueba que staff no accede a importación/exportación ni gestión de usuarios.
- Define quién atenderá incidencias y cómo reportarlas sin compartir contraseñas ni padrones por canales públicos. Si una migración o despliegue falla, detén nuevos cobros, conserva logs sin secretos y restaura el servicio desde un respaldo verificado según el procedimiento del proveedor; no ejecutes comandos de restauración sobre producción sin confirmar el destino. Documenta el incidente y reconcilia los cobros hechos fuera de línea antes de reanudar.

**Pendiente para el lanzamiento real:** seleccionar alojamiento y base persistente, configurar HTTPS, supervisión y respaldos automáticos, y completar una restauración de ensayo. Este repositorio por sí solo no despliega el servicio.
