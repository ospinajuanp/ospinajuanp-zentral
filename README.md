# Zentral — Micro-SaaS Studio

Ecosistema modular de herramientas de gestión empresarial (B2B) construido con Next.js.

Cada módulo es independiente, validable contra el estado de suscripción del workspace y accesible según el rol del usuario.

---

## Tech Stack

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 16.2.6 (Turbopack) | Framework full-stack |
| React | 19.2.4 | UI |
| TypeScript | ^5 | Tipado |
| MongoDB + Mongoose | ^9 | Base de datos |
| Tailwind CSS | ^4 | Estilos |
| jose | ^6 | JWT (Edge-compatible) |
| bcryptjs | ^3 | Hashing de contraseñas |

---

## RBAC (Role-Based Access Control)

| Rol | Acceso |
|---|---|
| **superadmin** | Global — gestiona workspaces, usuarios, suscripciones. Bypass de todas las guards |
| **admin** | Dueño del workspace — gestiona usuarios hijos y activa módulos |
| **hijo** | Operativo restringido — solo módulos asignados por el admin |

---

## Estado Actual

### Implementado

- [x] Auth custom con JWT (jose) + httpOnly cookie + SameSite=Strict
- [x] Edge proxy (`proxy.ts`) — verifica JWT, inyecta headers, protege rutas
- [x] Middleware de ruta (`authenticate`, `withAuth`, `requireRole`, `requireModule`)
- [x] Registro + login con email/contraseña
- [x] Creación automática de workspace + admin + módulo gratuito TransferCheck
- [x] Landing page: header, hero, features, módulos, pricing, about, CTA, footer
- [x] Dashboard del workspace (módulos activos, link a admin)
- [x] Panel SuperAdmin: dashboard, workspaces list/detail, users list/detail
- [x] Aislamiento por workspace (cada workspace tiene sus propios datos)
- [x] Seed script (`pnpm run seed`)
- [x] Logout (`POST /api/auth/logout`) + botón en sidebar/navbar
- [x] Sesión por inactividad (15 min, auto-logout vía `SessionTimeout`)
- [x] Redirección automática en `/login` si ya hay sesión activa
- [x] Páginas de error personalizadas (404, 500) + loading spinners por segmento
- [x] Recuperación de contraseña (Resend + JWT de 15 min)
- [x] Verificación de email (registro con `isActive: false`, correo con enlace, token JWT 24h, endpoint `/verify-email`)
- [x] Rate limiting en login/register (Upstash Redis, fixed window, 5/15min login — 3/30min register)

### Pendiente

- [ ] Módulos: AntecedentesCheck, Facturación, WhatsApp CRM, Cuentas de Cobro, Reportes SG-SST, Reservas PH, Agendamiento, Optimizador de Rutas, Cobro Preventivo
- [ ] UI de activación/gestión de módulos
- [ ] Edición de usuarios y workspaces
- [ ] Paginación en listas

---

## Route Map

| Ruta | Acceso | Propósito |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de empresa |
| `/dashboard` | Autenticado | Dashboard del workspace |
| `/transfercheck` | Autenticado + módulo activo | Módulo TransferCheck |
| `/admin` | superadmin | Dashboard admin |
| `/admin/workspaces` | superadmin | Lista de workspaces |
| `/admin/workspaces/[id]` | superadmin | Detalle de workspace |
| `/admin/users` | superadmin | Lista de usuarios |
| `/admin/users/[id]` | superadmin | Detalle de usuario |
| `POST /api/auth/login` | Público | Login endpoint |
| `POST /api/auth/register` | Público | Registro endpoint |
| `POST /api/auth/logout` | Autenticado | Cerrar sesión |
| `GET /api/auth/session` | — | Verificar si hay sesión activa |
| `/forgot-password` | Público | Solicitar recuperación de contraseña |
| `/reset-password` | Público | Restablecer contraseña (vía token) |
| `/verify-email` | Público | Verificar correo (vía token) |
| `POST /api/auth/forgot-password` | Público | Enviar email con enlace de recuperación |
| `POST /api/auth/reset-password` | Público | Ejecutar cambio de contraseña |
| `POST /api/auth/verify-email` | Público | Verificar correo electrónico |

---

## Getting Started

### Prerrequisitos

- Node.js >= 18
- pnpm
- MongoDB (local o Atlas)

### Instalación

```bash
pnpm install
```

### Variables de entorno

```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/zentral
JWT_SECRET=tu-secreto-seguro-aqui
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=tu-token-upstash
```

### Seed

```bash
pnpm run seed
```

Crea:
- SuperAdmin: `admin@zentral.dev` / `admin123`
- Demo workspace + admin: `admin@demo-corp.com` / `demo123`
- Suscripción gratuita a TransferCheck para el workspace demo

### Desarrollo

```bash
pnpm run dev
```

---

## Estructura del Proyecto

```
src/
├── proxy.ts                    # Edge proxy — JWT + route protection
├── types/
│   └── index.ts                # Tipos compartidos (Role, ModuleTier, etc.)
├── components/
│   ├── session-timeout.tsx     # Client component: auto-logout 15 min inactividad
│   ├── logout-button.tsx       # Botón "Cerrar Sesión"
│   └── landing/
│       ├── header.tsx
│       ├── hero.tsx
│       ├── features.tsx
│       ├── modules-grid.tsx
│       ├── pricing.tsx
│       ├── about.tsx
│       ├── cta.tsx
│       └── footer.tsx
├── lib/
│   ├── auth/
│   │   ├── jwt.ts              # signJwt / verifyJwt + signResetToken / verifyResetToken (jose)
│   │   ├── password.ts         # hashPassword / verifyPassword (bcryptjs)
│   │   └── session.ts          # getSession (server components)
│   ├── email/
│   │   └── resend.ts           # sendResetPasswordEmail (Resend)
│   ├── db/
│   │   └── mongoose.ts         # Conexión a MongoDB (singleton)
│   ├── middleware/
│   │   ├── auth.ts             # authenticate() + withAuth()
│   │   ├── require-role.ts     # requireRole()
│   │   ├── require-module.ts   # requireModule()
│   │   └── rate-limit.ts       # Upstash Redis rate limiter
│   ├── models/
│   │   ├── user.ts             # User schema
│   │   ├── workspace.ts        # Workspace schema
│   │   └── module-subscription.ts  # ModuleSubscription schema
│   └── seed.ts                 # Lógica de seed
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── not-found.tsx           # 404 personalizada
│   ├── error.tsx               # Error boundary global
│   ├── loading.tsx             # Loading spinner global
│   ├── globals.css             # Tailwind v4
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (core)/
│   │   ├── layout.tsx          # Navbar + SessionTimeout + logout
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── dashboard/page.tsx
│   ├── (modules)/
│   │   └── transfercheck/page.tsx
│   ├── admin/
│   │   ├── layout.tsx          # Sidebar + SessionTimeout + logout
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── workspaces/page.tsx
│   │   ├── workspaces/[id]/page.tsx
│   │   ├── users/page.tsx
│   │   └── users/[id]/page.tsx
│   └── api/auth/
│       ├── login/route.ts
│       ├── register/route.ts
│       ├── logout/route.ts
│       ├── forgot-password/route.ts
│       ├── reset-password/route.ts
│       └── session/route.ts
```

---

## Modelos de Datos

### User
| Campo | Tipo | Detalle |
|---|---|---|
| email | String | único, lowercase |
| passwordHash | String | bcrypt |
| name | String | — |
| role | enum | superadmin \| admin \| hijo |
| workspace | ref → Workspace | nullable (superadmin no tiene) |
| isActive | Boolean | default: true |

### Workspace
| Campo | Tipo | Detalle |
|---|---|---|
| name | String | — |
| slug | String | único, lowercase |
| owner | ref → User | nullable |
| isActive | Boolean | default: true |

### ModuleSubscription
| Campo | Tipo | Detalle |
|---|---|---|
| workspace | ref → Workspace | index |
| moduleKey | String | ej. "transfercheck" |
| tier | enum | free \| premium |
| status | enum | active \| inactive \| suspended |
| expiresAt | Date | nullable |
| price, currency, billingPeriod, paymentProvider | ... | campos futuros de pago |

Índice único compuesto: `{ workspace, moduleKey }`

---

## Seguridad

- **Cookies**: httpOnly + SameSite=Strict + Secure (producción)
- **JWT**: HS256, expiración 7 días, firmado con jose
- **Proxy Edge**: verifica token antes de llegar a la ruta, inyecta headers `x-user-id`, `x-user-role`, `x-workspace-id`
- **Route Guards**: middleware de ruta verifica headers + DB en cada request
- **RBAC**: superadmin bypass, admin/hijo validados contra su workspace y rol
- **Workspace Isolation**: cada query filtra por workspace del usuario
- **Inactivity Timeout**: 15 min sin interacción → logout automático (SessionTimeout)
- **Rate Limiting**: Upstash Redis, fixed window por IP (`x-forwarded-for`), login 5 intentos / 15 min, register 3 intentos / 30 min. Headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` en respuestas 429. Bypass silencioso si Redis falla.
- **Email Verification**: registro crea usuario `isActive: false`, se envía correo con token JWT (24h), login bloqueado hasta verificar en `/verify-email`.

---

## Design System

Ver [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) para la paleta completa: fondos, tipografía, inputs, botones, spinners e iconografía del estilo "Zentral Tech Core" (modo oscuro profesional).

---

## Despliegue

Construcción estándar de Next.js:

```bash
pnpm run build
```

Compatible con Vercel, Railway, o cualquier host que soporte Next.js.

---

## Licencia

MIT
