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
- [x] Landing page: header, hero, features, módulos, pricing, about, CTA, footer (Free: TransferCheck + 1 usuario)
- [x] Dashboard del workspace (módulos activos)
- [x] Panel SuperAdmin: dashboard, workspaces list/detail/create, users list/detail
- [x] Panel Admin: dashboard, users CRUD (admin/hijo), workspace rename
- [x] Aislamiento por workspace (cada workspace tiene sus propios datos)
- [x] Seed script (`pnpm run seed`)
- [x] Logout (`POST /api/auth/logout`) + botón en sidebar/navbar
- [x] Sesión por inactividad (15 min, auto-logout vía `SessionTimeout`)
- [x] Redirección automática en `/login` si ya hay sesión activa
- [x] Páginas de error personalizadas (404, 500) + loading spinners por segmento
- [x] Recuperación de contraseña (Resend + JWT de 15 min)
- [x] Verificación de email (registro con `isActive: false`, correo con enlace, token JWT 24h, endpoint `/verify-email`)
- [x] Rate limiting en login/register (Upstash Redis, fixed window, 5/15min login — 3/30min register)
- [x] Componentes UI compartidos: AuthLayout, InputField, Button, StatusCard, ErrorMessage, ConfirmDialog
- [x] Tablas responsive (stack a cards en mobile)
- [x] ConfirmDialog modal para confirmación de eliminación
- [x] NavLink con estado activo (exact/startsWith)
- [x] SidebarShell responsive: sidebar desktop + bottom nav mobile + bottom sheet "Más"
- [x] Layout con sidebar para módulos (`(modules)/layout.tsx`)
- [x] Seguridad: headers CSP/HSTS en `next.config.ts`, metadata OG/locale es_CO, sitemap/robots

### Pendiente

- [ ] Módulos: AntecedentesCheck, Facturación, Cartera, etc.
- [ ] UI de activación/gestión de módulos
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
| `/users` | admin | Lista de usuarios del workspace |
| `/users/create` | admin | Crear usuario |
| `/users/[id]` | admin | Editar usuario |
| `/workspace` | admin | Configuración del workspace |
| `/admin` | superadmin | Dashboard admin |
| `/admin/workspaces` | superadmin | Lista de workspaces |
| `/admin/workspaces/create` | superadmin | Crear workspace |
| `/admin/workspaces/[id]` | superadmin | Detalle de workspace |
| `/admin/users` | superadmin | Lista de usuarios global |
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
| `GET /api/admin/users` | superadmin | Lista usuarios (filtrable por workspace) |
| `GET/PUT/DELETE /api/admin/users/[id]` | superadmin | CRUD usuario global |
| `GET/POST /api/admin/workspaces` | superadmin | Lista/Crear workspace |
| `GET/PUT/DELETE /api/admin/workspaces/[id]` | superadmin | CRUD workspace (cascade delete) |
| `GET/POST /api/users` | admin | Lista/Crear usuario del workspace |
| `GET/PUT/DELETE /api/users/[id]` | admin | CRUD usuario del workspace |
| `GET/PUT /api/workspaces/[id]` | admin | Ver/renombrar workspace |

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
│   ├── nav-link.tsx            # NavLink con estado activo (usePathname)
│   ├── sidebar-shell.tsx       # Sidebar desktop + bottom nav mobile + bottom sheet
│   ├── ui/
│   │   ├── auth-layout.tsx     # Layout para páginas de auth
│   │   ├── button.tsx          # Botón reutilizable con loading
│   │   ├── confirm-dialog.tsx  # Modal de confirmación
│   │   ├── error-message.tsx   # Mensaje de error
│   │   ├── input-field.tsx     # Input con label + toggle password
│   │   ├── status-card.tsx     # Card de estado (éxito/error)
│   │   └── index.ts            # Barrel export
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
│   │   ├── jwt.ts              # signJwt / verifyJwt (sesión) + signResetToken/verifyResetToken (reset pwd) + signVerificationToken/verifyVerificationToken (email)
│   │   ├── password.ts         # hashPassword / verifyPassword (bcryptjs)
│   │   ├── session.ts          # getSession (server components)
│   │   └── api.ts              # getApiAuth() (API routes)
│   ├── email/
│   │   └── resend.ts           # sendResetPasswordEmail + sendVerificationEmail (Resend)
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
│   ├── sitemap.ts              # Sitemap dinámico
│   ├── robots.ts               # Robots.txt
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (core)/
│   │   ├── layout.tsx          # Sidebar + bottom nav (admin/hijo)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── users/create/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   └── workspace/page.tsx
│   ├── (modules)/
│   │   ├── layout.tsx          # Sidebar + bottom nav para módulos
│   │   └── transfercheck/page.tsx
│   ├── admin/
│   │   ├── layout.tsx          # Sidebar + bottom nav (superadmin)
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── workspaces/page.tsx
│   │   ├── workspaces/create/page.tsx
│   │   ├── workspaces/[id]/page.tsx
│   │   ├── users/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   └── users/delete-button.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── logout/route.ts
│       │   ├── forgot-password/route.ts
│       │   ├── reset-password/route.ts
│       │   ├── session/route.ts
│       │   └── verify-email/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── users/[id]/route.ts
│       │   ├── workspaces/route.ts
│       │   └── workspaces/[id]/route.ts
│       ├── users/route.ts
│       ├── users/[id]/route.ts
│       └── workspaces/[id]/route.ts
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
| isActive | Boolean | default: true (false al registrarse, se activa al verificar email) |

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
