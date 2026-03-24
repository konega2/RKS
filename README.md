# RKS Gestión - Next.js Fullstack

Aplicación fullstack con Next.js (App Router), TypeScript, TailwindCSS y Prisma + SQLite, diseñada con enfoque mobile-first.

## Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Prisma ORM
- SQLite
- Server Actions para login/logout

## Configuración

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno (`.env`):

```env
DATABASE_URL="file:./dev.db"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
```

3. Crear la base de datos y aplicar migración:

```bash
npx prisma migrate dev --name init
```

4. Levantar el entorno local:

```bash
npm run dev
```

## Rutas principales

- `/login` - Login de administrador
- `/admin` - Panel principal
- `/admin/pilotos`
- `/admin/pre-carrera`
- `/admin/entrenamiento`
- `/admin/qualy`
- `/admin/carrera`

## Autenticación

- Sin registro de usuarios
- Credenciales por variables de entorno (`ADMIN_USER`, `ADMIN_PASSWORD`)
- Sesión en cookie `httpOnly`
- Protección de rutas `/admin/*`
- Logout con limpieza de cookie y sesión en DB

## Despliegue en Vercel

El proyecto está listo para desplegar en Vercel. Antes del deploy:

- Configurar variables de entorno en Vercel (`DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD`)
- Ejecutar migraciones en el entorno correspondiente
