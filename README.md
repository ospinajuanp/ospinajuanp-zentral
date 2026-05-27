# Zentral — Micro-SaaS de Herramientas Empresariales

Ecosistema modular de herramientas de gestión B2B construido con Next.js 16.  
Cada módulo es independiente, validable contra el estado de suscripción del workspace y accesible según el rol del usuario.

---

## Tech Stack

| Tecnología | Propósito |
|---|---|---|
| Next.js 16.2 (Turbopack) | Framework full-stack |
| React 19.2 | UI |
| TypeScript | Tipado |
| MongoDB + Mongoose | Base de datos |
| Tailwind CSS v4 | Estilos |
| jose | JWT Edge-compatible |
| bcryptjs | Hashing de contraseñas |
| Upstash Redis | Rate limiting |
| Resend | Emails transaccionales |
| Embla Carousel | Carrusel de planes en landing |
| Google Generative AI (Gemini 2.0 Flash) | Extracción IA de comprobantes |
| Gmail API (googleapis) | Búsqueda de correos de transferencia |
| OCR.space | OCR para lectura de comprobantes |

---

## RBAC

| Rol | Acceso |
|---|---|---|
| **superadmin** | Global — dashboard con stats, CRUD de workspaces, usuarios, modulos, planes, suscripciones |
| **admin** | Dueno del workspace — dashboard, usuarios, planes, configuracion, compra de planes |
| **operador** | Usuario operativo — acceso a modulos asignados, puede conciliar comprobantes |
| **hijo** | (Legado — retrocompatible, mismo comportamiento que operador, no visible en UI) |

---

## Estado Actual

### Landing Page
- Header, Hero, Features, Modulos (desde BD), Precios (desde BD, carrusel Embla v8 sin ResizeObserver), About, CTA, Footer
- SEO: metadata (OG, Twitter, keywords), viewport, sitemap.xml, robots.ts, skip-link
- A11y: aria-labelledby en secciones, emoji aria-hidden, footer flex-wrap, links absolutos

### Auth
- JWT custom (jose) con httpOnly cookie, SameSite=Strict, 7d expiracion
- Login, registro, logout, recuperacion de contrasena, verificacion de email
- Rate limiting: 25 intentos / 5 min para login y register (Upstash Redis, fixed window)
- Sesion por inactividad (15 min, auto-logout)
- Registro con plan: `/register?plan=PLAN_ID` asocia el workspace al plan seleccionado

### Planes y Modulos (Catalogo Dinamico)
- **Module CRUD**: superadmin puede crear/editar/eliminar modulos
- **Plan CRUD**: planes configurables con herencia "Basado en", maxUsers (0 = ilimitado)
  - Enterprise: borde punteado, WhatsApp CTA
  - ctaLink autogenerado: `/register?plan=ID` o `https://wa.me/NUMBER`
- **Sistema multi-plan**: workspace.plans[] soporta multiples compras simultaneas
  - Free siempre incluido (max 1), planes pagos acumulativos
  - `recalculateQuotas()` agrega cuotas de todas las compras activas
- **Pasarela de pago simulada**: modal con formulario TC pre-llenado, procesamiento simulado
  - Estados: idle → gateway → processing → success/rejected
  - Solo planes de pago visibles (Free y Enterprise ocultos)
- **Historial de compras**: Plan | Estado | Periodo | Monto | Accion (DD/MM/YYYY)
  - Desactivar: `PATCH cancelled` → quita cuotas del workspace
  - Reactivar (dentro del periodo): `PATCH active` sobre el mismo registro, sin duplicar
  - Renovar (expirado): abre pasarela de pago → nueva compra
- **WorkspacePurchase**: `paymentMethod: 'simulated' | 'reactivated'`

### Webhook de Pago / isPayReady
- `Workspace.isPayReady`: flag booleano
- Superadmin togglea desde el panel de workspace → activa/desactiva suscripciones

### Paneles de Administracion
- **Dashboard Superadmin**: stats de Facturacion, Workspaces, Modulos, Usuarios + Suscripciones
- **Paginacion en todas las listas**: PaginationBar reusable con selector 5/10/20/50/100
  - Admin users, admin workspaces, admin modules, admin plans, workspace users, purchase history
- **Admin**: dashboard, usuarios CRUD, workspace settings
- **Superadmin**: workspaces, users, modulos, planes CRUD, gestion de suscripciones

### UI/UX
- Responsive: sidebar desktop sticky + bottom nav mobile + bottom sheet "Mas"
- Sidebar bottom sheet: aria-expanded, aria-labels, Escape key
- Tablas responsive (stack a cards en mobile)
- Sesion timeout con `SessionTimeout`
- Error pages 404/500, loading spinners
- Componentes compartidos: AuthLayout, InputField, Button, StatusCard, ErrorMessage, ConfirmDialog, PaginationBar
- SidebarShell con NavLink activo por pathname
- Quota helper: `checkQuota()` y `getQuotaInfo()` para control de consumo por modulo

### Seguridad y SEO
- Seguridad: headers CSP/HSTS en `next.config.ts`
- Metadata OG/locale es_CO, sitemap.ts, robots.ts
- Proxy Edge protege rutas, inyecta headers de sesion
- Workspace isolation en todas las queries

---

## Route Map

| Ruta | Acceso | Propósito |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Inicio de sesión |
| `/register?plan=ID` | Público | Registro con plan opcional |
| `/forgot-password` | Público | Recuperar contraseña |
| `/reset-password` | Público | Restablecer contraseña |
| `/verify-email` | Público | Verificar email |
| `/dashboard` | Autenticado | Dashboard del workspace |
| `/transfercheck` | Autenticado | Módulo TransferCheck |
| `/admin` | superadmin | Dashboard con stats |
| `/admin/workspaces` | superadmin | Lista de workspaces |
| `/admin/workspaces/create` | superadmin | Crear workspace |
| `/admin/workspaces/[id]` | superadmin | Detalle + gestión de suscripciones |
| `/admin/modules` | superadmin | Lista de módulos |
| `/admin/modules/create` | superadmin | Crear módulo |
| `/admin/modules/[id]` | superadmin | Editar módulo |
| `/admin/plans` | superadmin | Lista de planes |
| `/admin/plans/create` | superadmin | Crear plan |
| `/admin/plans/[id]` | superadmin | Editar plan |
| `/admin/users` | superadmin | Lista global de usuarios |
| `/admin/users/[id]` | superadmin | Detalle de usuario |
| `/users` | admin | Lista de usuarios del workspace (paginado) |
| `/users/create` | admin | Crear usuario |
| `/users/[id]` | admin | Editar usuario |
| `/workspace` | admin | Configuracion del workspace |
| `/workspace/plan` | admin | Compra y gestion de planes + historial |
| `/antecedentes` | Autenticado | Modulo AntecedentesCheck (proximamente) |
| `/cartera` | Autenticado | Modulo Cartera (proximamente) |
| `/facturacion` | Autenticado | Modulo Facturacion Electronica (proximamente) |

### API Routes

| Ruta | Método | Acceso | Propósito |
|---|---|---|---|
| `/api/auth/login` | POST | Público | Login |
| `/api/auth/register` | POST | Público | Registro (acepta planId) |
| `/api/auth/logout` | POST | Autenticado | Cerrar sesión |
| `/api/auth/forgot-password` | POST | Público | Enviar email de recuperación |
| `/api/auth/reset-password` | POST | Público | Cambiar contraseña |
| `/api/auth/verify-email` | POST | Público | Verificar email |
| `/api/auth/session` | GET | — | Estado de sesión |
| `/api/admin/stats` | GET | superadmin | Stats del dashboard |
| `/api/admin/modules` | GET/POST | superadmin | Listar/Crear módulo |
| `/api/admin/modules/[id]` | GET/PUT/DELETE | superadmin | CRUD módulo |
| `/api/admin/plans` | GET/POST | superadmin | Listar/Crear plan |
| `/api/admin/plans/[id]` | GET/PUT/DELETE | superadmin | CRUD plan |
| `/api/admin/workspaces` | GET/POST | superadmin | Listar/Crear workspace |
| `/api/admin/workspaces/[id]` | GET/PUT/DELETE | superadmin | CRUD workspace (con isPayReady) |
| `/api/admin/workspaces/[id]/subscriptions` | GET/POST | superadmin | Gestionar suscripciones |
| `/api/admin/workspaces/[id]/subscriptions/[subId]` | PUT/DELETE | superadmin | Editar/Eliminar suscripción |
| `/api/admin/users` | GET | superadmin | Lista usuarios (filtrable) |
| `/api/admin/users/[id]` | GET/PUT/DELETE | superadmin | CRUD usuario global |
| `/api/users` | GET/POST | admin | Listar/Crear usuario del workspace |
| `/api/users/[id]` | GET/PUT/DELETE | admin | CRUD usuario del workspace |
| `/api/workspaces/[id]` | GET/PUT | admin | Ver/renombrar workspace |
| `/api/workspaces/[id]/purchase` | POST | admin | Comprar plan (simulado) |
| `/api/workspaces/[id]/purchases` | GET | admin | Historial de compras (paginado) |
| `/api/workspaces/[id]/purchases/[purchaseId]` | PATCH | admin | Activar/Desactivar compra |
| `/api/plans` | GET | Autenticado | Listar planes disponibles |
| `/api/modules/transfercheck/process-image` | POST | Autenticado | Subir comprobante → OCR/Gemini → log + match Gmail |
| `/api/modules/transfercheck/logs` | GET/PUT | Autenticado | Listar logs con filtros / Conciliación manual |
| `/api/modules/transfercheck/sync-email` | POST | Autenticado | Verificar pagos pendientes contra Gmail |
| `/api/modules/transfercheck/gmail-status` | GET | Autenticado | Estado de conexión Gmail |
| `/api/modules/transfercheck/gmail-disconnect` | POST | Autenticado | Desconectar Gmail |
| `/api/auth/gmail/connect` | GET | Público | Iniciar OAuth2 Gmail |
| `/api/auth/gmail/callback` | GET | Público | Callback OAuth2 Gmail |

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

### Variables de entorno (`.env.local`)

```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/zentral
JWT_SECRET=tu-secreto-seguro-aqui
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=tu-token-upstash
GEMINI_API_KEY=AIza...
OCR_SPACE_API_KEY=K...
GMAIL_CLIENT_ID=...apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

### Seed

```bash
pnpm run seed
```

Crea 4 módulos, 4 planes, 2 workspaces y 4 usuarios con datos de prueba.

> Las credenciales exactas (usuarios, contraseñas, workspaces) están en `.seed-credentials.md` (incluido en `.gitignore` para no exponerlas en el repositorio).

### Desarrollo

```bash
pnpm run dev     # Next.js dev server (Turbopack)
pnpm run build   # Build de producción
pnpm run seed    # Poblar base de datos
```

---

## Modelos de Datos

### User
| Campo | Tipo | Detalle |
|---|---|---|
| email | String | único, lowercase |
| passwordHash | String | bcrypt |
| name | String | — |
| role | enum | superadmin \| admin \| operador \| hijo |
| workspace | ref → Workspace | nullable |
| isActive | Boolean | default: false (registro), se activa al verificar email |
| createdBy | ref → User | nullable |

### Workspace
| Campo | Tipo | Detalle |
|---|---|---|
| name | String | — |
| slug | String | único, lowercase |
| owner | ref → User | nullable |
| isActive | Boolean | default: true |
| isPayReady | Boolean | default: false (pago pendiente hasta confirmación) |
| plans | ObjectId[] | Array de planes contratados |

### Module
| Campo | Tipo | Detalle |
|---|---|---|
| key | String | Identificador único (slug) |
| name | String | Nombre comercial |
| description | String | Descripción |
| tier | enum | free \| premium |
| status | enum | active \| inactive \| coming_soon |
| defaultQuota | Number | Cuota por defecto |
| icon | String | Icono (opcional) |

### ModuleSubscription
| Campo | Tipo | Detalle |
|---|---|---|
| workspace | ref → Workspace | Índice |
| moduleKey | String | ej. "transfercheck" |
| tier | enum | free \| premium |
| status | enum | active \| inactive \| suspended |
| monthlyQuota | Number | Límite mensual |
| usedQuota | Number | Consultas consumidas |
| quotaResetAt | Date | Fecha de reseteo |

### Plan
| Campo | Tipo | Detalle |
|---|---|---|
| name | String | Nombre del plan |
| price | String | Texto del precio ("$12", "", "A medida") |
| monthlyPrice | Number or null | Precio numérico mensual |
| description | String | Descripción corta |
| includedModules | Array | Módulos con cuota override |
| maxUsers | Number | Usuarios máximos (0 = ilimitado) |
| extraFeatures | String[] | Características extra |
| support | String | Tipos: ninguno, email, prioritario, canales, dedicado |
| onboarding | String | Tipos: ninguno, autoguiado, videos, documentación, dedicado |
| cta | String | Texto del botón |
| ctaLink | String | Link del botón (autogenerado `/register?plan=ID`) |
| highlighted | Boolean | "Más popular" |
| isEnterprise | Boolean | Plan a medida |
| whatsappNumber | String | Solo para enterprise |
| sortOrder | Number | Orden de aparición |
| isActive | Boolean | Visible en landing |

### WorkspacePurchase
| Campo | Tipo | Detalle |
|---|---|---|
| workspace | ref → Workspace | Índice |
| plan | ref → Plan | Plan comprado |
| planName | String | Nombre del plan |
| amount | Number | Monto pagado |
| currency | String | COP |
| status | enum | active \| expired \| cancelled |
| paymentMethod | String | simulated |
| modules | Array | [{ moduleKey, quota, tier }] |
| purchasedAt | Date | Fecha de compra |

---

## Documentacion

- [Catalogo de Modulos](docs/PLAN.md)
- [Planes de Precios](docs/PLANES.md)
- [Panel de Administracion](docs/ADMIN.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Mejoras Planificadas](docs/MEJORAS.md)

---

## Seguridad

- **Cookies**: httpOnly + SameSite=Strict + Secure (producción)
- **JWT**: HS256, 7d sesión, 15min reset, 24h verificación
- **Rate Limiting**: Upstash Redis, fixed window por IP, 25 intentos / 5 min
- **RBAC**: superadmin bypass, admin/hijo validados contra su workspace
- **Workspace Isolation**: cada query filtra por workspace del usuario
- **Email Verification**: bloqueo de login hasta verificación
- **Edge Proxy**: protege rutas, inyecta headers de sesión

---

## Despliegue

```bash
pnpm run build
```

Compatible con Vercel, Railway, o cualquier host que soporte Next.js.

---

## Licencia

MIT
