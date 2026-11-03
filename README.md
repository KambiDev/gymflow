<div align="center">

# GymFlow

**La plataforma que ordena tu gimnasio: socios, membresías y pagos en un solo lugar.**

[![Estado](https://img.shields.io/badge/estado-en_desarrollo-orange)](#estado)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)

</div>

---

## El problema

Los gimnasios pequeños llevan el control de sus socios en cuadernos y hojas de cálculo. El resultado: no saben con certeza quién pagó, cuándo vence cada membresía ni quién está atrasado. Cobrar se vuelve una conversación incómoda y se pierde dinero.

GymFlow centraliza esa información en un panel web simple, pensado para funcionar bien incluso con conexiones lentas.

## Qué ofrece GymFlow

| Capacidad | Qué resuelve |
| --- | --- |
| 👥 **Socios** | Altas, búsqueda, estados y baja lógica sin perder el historial. |
| 💳 **Planes y membresías** | Mensual, trimestral o anual: precio y duración configurables. |
| ✅ **Pagos** | Registro de cobros, historial completo paginado y comprobante imprimible. |
| 📋 **Cierre diario** | Consulta de ingresos y métodos de pago por fecha de Nicaragua, con detalle paginado y descarga CSV. |
| 🔔 **Atrasos** | Sabe quién debe, cuánto y desde cuándo, al instante. |
| 🏢 **Multi-gimnasio** | Cada gimnasio ve únicamente sus datos, con aislamiento por organización. |
| 🔐 **Roles** | Dueño de la plataforma, administrador del gimnasio y staff. |
| 👤 **Personal** | El administrador crea cuentas de recepción y puede desactivar o reactivar su acceso. |
| 🔑 **Acceso** | Cambio de contraseña personal y restablecimiento manual por responsables autorizados. |
| 🛠️ **Panel de plataforma** | Alta y suspensión de gimnasios, con control de su suscripción. |

## Tecnología

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma 7 · PostgreSQL · Auth.js

## Arranque rápido

Requisitos: Node.js 20.9+ y npm.

```bash
git clone https://github.com/KambiDev/gymflow.git
cd gymflow
npm install
cp .env.example .env        # completa AUTH_SECRET y SEED_*
npx prisma dev -d           # PostgreSQL local integrado
npx prisma dev ls           # copia la URL TCP en DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con las credenciales que definiste en tu `.env`.

> Si reinicias la máquina, vuelve a levantar la base local con `npx prisma dev -d` antes de arrancar la app.

## Documentación

- [Arquitectura y modelo de datos](docs/architecture.md)

## Estado

GymFlow está en **desarrollo activo**. Ya funcionan la autenticación, los roles, el modelo multi-gimnasio, los planes, el registro de socios (alta, edición, búsqueda y baja/reactivación), los cobros, el panel de vencimientos y la administración de gimnasios desde el panel de plataforma (alta, suspensión y registro manual del pago B2B). Aún no hay notificaciones por SMS, correo ni WhatsApp.
