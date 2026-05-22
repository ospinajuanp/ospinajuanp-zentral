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

### Pendiente

- [ ] Módulos: AntecedentesCheck, Facturación, WhatsApp CRM, Cuentas de Cobro, Reportes SG-SST, Reservas PH, Agendamiento, Optimizador de Rutas, Cobro Preventivo
- [ ] UI de activación/gestión de módulos
- [ ] Edición de usuarios y workspaces
- [ ] Logout endpoint
- [ ] Rate limiting en login/register
- [ ] Paginación en listas
- [ ] Páginas de error personalizadas (404, 500, loading)
- [ ] Verificación de email
- [ ] Recuperación de contraseña

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
├── lib/
│   ├── auth/
│   │   ├── jwt.ts              # signJwt / verifyJwt (jose)
│   │   ├── password.ts         # hashPassword / verifyPassword (bcryptjs)
│   │   └── session.ts          # getSession (server components)
│   ├── db/
│   │   └── mongoose.ts         # Conexión a MongoDB (singleton)
│   ├── middleware/
│   │   ├── auth.ts             # authenticate() + withAuth()
│   │   ├── require-role.ts     # requireRole()
│   │   └── require-module.ts   # requireModule()
│   ├── models/
│   │   ├── user.ts             # User schema
│   │   ├── workspace.ts        # Workspace schema
│   │   └── module-subscription.ts  # ModuleSubscription schema
│   └── seed.ts                 # Lógica de seed
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind v4
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (core)/
│   │   └── dashboard/page.tsx
│   ├── (modules)/
│   │   └── transfercheck/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── workspaces/page.tsx
│   │   ├── workspaces/[id]/page.tsx
│   │   ├── users/page.tsx
│   │   └── users/[id]/page.tsx
│   └── api/auth/
│       ├── login/route.ts
│       └── register/route.ts
└── components/landing/
    ├── header.tsx
    ├── hero.tsx
    ├── features.tsx
    ├── modules-grid.tsx
    ├── pricing.tsx
    ├── about.tsx
    ├── cta.tsx
    └── footer.tsx
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
