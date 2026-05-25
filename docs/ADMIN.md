# Panel de Administración (Superadmin)

El panel de superadmin está en `/admin` y solo es accesible con rol `superadmin`.

---

## Dashboard

El dashboard muestra métricas agrupadas en 4 secciones con cards clicables:

### Workspaces
| Card | Descripción |
|---|---|
| Total | Todos los workspaces registrados |
| Activos | Workspaces con `isActive: true` |
| Inactivos | Workspaces con `isActive: false` |
| Pago pendiente | Workspaces con `isPayReady: false` |

### Módulos
| Card | Descripción |
|---|---|
| Total | Todos los módulos del catálogo |
| Activos | Módulos con `status: active` |
| Gratis | Módulos con `tier: free` |
| Premium | Módulos con `tier: premium` |

### Planes
| Card | Descripción |
|---|---|
| Total | Todos los planes |
| Activos | Planes visibles en landing |
| Enterprise | Planes con `isEnterprise: true` |
| MRR | Suma de `monthlyPrice` de workspaces activos con pago confirmado |

### Usuarios + Suscripciones
| Card | Descripción |
|---|---|
| Total usuarios | Todos los usuarios del sistema |
| Activos | Usuarios con email verificado (`isActive: true`) |
| Pend. verificación | Usuarios sin verificar email |
| Admins | Usuarios con rol `admin` |
| Suscripciones activas | Subs con `status: active` |
| Premium | Subs con `tier: premium` |
| Gratis | Subs con `tier: free` |
| Workspaces activos | Total de workspaces activos |

---

## Gestión de Workspaces

### Lista (`/admin/workspaces`)
- Muestra todos los workspaces con nombre, slug, estado, plan asociado y fecha de creación

### Detalle (`/admin/workspaces/[id]`)
- **Información**: editar nombre, slug, activo/inactivo
- **Pago confirmado**: checkbox `isPayReady`. Al activarlo, todas las suscripciones `inactive` pasan a `active`. Al desactivarlo, las `active` pasan a `inactive`
- **Planes contratados**: lista de planes vinculados al workspace con nombre, precio, badge Enterprise
- **Usuarios**: lista de usuarios del workspace
- **Módulos**: gestión de suscripciones
  - Agregar módulo: seleccionar de los disponibles (no suscritos), tier y cuota
  - Editar módulo: tier, status, cuota mensual
  - Quitar módulo: confirmación con modal
- **Zona de peligro**: eliminar workspace (cascade: desvincula usuarios, elimina suscripciones)

### Crear (`/admin/workspaces/create`)
- Formulario con nombre, slug (auto-generado), owner opcional

---

## Gestión de Módulos

### Lista (`/admin/modules`)
- Muestra todos los módulos con key, nombre, tier, estado, cuota default

### Crear (`/admin/modules/create`)
- Key (slug único), nombre, descripción, tier (free/premium), estado (active/inactive/coming_soon), cuota default

### Editar (`/admin/modules/[id]`)
- Mismos campos que crear
- Zona de peligro: eliminar módulo

---

## Gestión de Planes

### Lista (`/admin/plans`)
- Muestra todos los planes con nombre, precio, estado, destacado, enterprise

### Crear (`/admin/plans/create`)
- **Información**: nombre, precio (opcional), precio mensual, usuarios máximos, descripción
- **Módulos incluidos**:
  - "Basado en": hereda módulos + datos de otro plan (solo lectura para los heredados)
  - Módulos heredados visibles sin checkbox
  - Módulos adicionales seleccionables con filtros rápidos (Gratis/Premium/Todos/Ninguno)
  - Cuota override por módulo
- **Características adicionales**: textarea, una por línea
- **Soporte y Onboarding**: dropdowns con opciones predefinidas
- **Configuración**:
  - Texto del botón (dropdown: Empezar gratis, Ver módulos, Contactar, Cotizar, Más información, Personalizado)
  - Link del botón (autogenerado: `/register?plan=ID` o manual)
  - Enterprise: muestra campo de WhatsApp number, autogenera link `https://wa.me/NUMBER`
  - Orden (auto-incremental: cantidad de planes + 1)
  - Plan destacado (badge "Más popular")

### Editar (`/admin/plans/[id]`)
- Mismos campos que crear
- Zona de peligro: eliminar plan

---

## Gestión de Usuarios

### Lista (`/admin/users`)
- Muestra todos los usuarios con nombre, email, rol, workspace, estado
- Filtros disponibles en UI (activos, por rol, etc.)

### Detalle (`/admin/users/[id]`)
- Información del usuario, cambio de rol, estado

### Crear (`/admin/users/create`)
- Deshabilitado (retorna 501) — los usuarios se crean por registro

---

## API Admin Endpoints

| Ruta | Método | Descripción |
|---|---|---|
| `/api/admin/stats` | GET | Datos agregados del dashboard |
| `/api/admin/modules` | GET/POST | Listar/Crear módulo |
| `/api/admin/modules/[id]` | GET/PUT/DELETE | CRUD módulo |
| `/api/admin/plans` | GET/POST | Listar/Crear plan |
| `/api/admin/plans/[id]` | GET/PUT/DELETE | CRUD plan |
| `/api/admin/workspaces` | GET/POST | Listar/Crear workspace |
| `/api/admin/workspaces/[id]` | GET/PUT/DELETE | CRUD workspace (incluye isPayReady toggle) |
| `/api/admin/workspaces/[id]/subscriptions` | GET/POST | Listar/Crear suscripción |
| `/api/admin/workspaces/[id]/subscriptions/[subId]` | PUT/DELETE | Editar/Eliminar suscripción |
| `/api/admin/users` | GET | Lista usuarios global |
| `/api/admin/users/[id]` | GET/PUT/DELETE | CRUD usuario |
