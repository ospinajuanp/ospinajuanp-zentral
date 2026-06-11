# Panel de Administracion (Superadmin)

El panel de superadmin esta en `/admin` y solo es accesible con rol `superadmin`.

---

## Dashboard

El dashboard muestra metricas agrupadas en 3 secciones + accesos rapidos con cards clicables. Usa `countDocuments` en vez de cargar colecciones completas.

### Facturacion (siempre arriba)
| Card | Descripcion |
|---|---|
| MRR estimado | Suma de monthlyPrice de workspaces activos con pago confirmado |
| Pago confirmado | Workspaces con `isPayReady: true` |
| Pago pendiente | Workspaces activos con `isPayReady: false` |
| Enterprise activas | Suscripciones con tier `enterprise` (manuales desde superadmin) |

### Workspaces y Usuarios
| Card | Descripcion |
|---|---|
| Workspaces activos | Workspaces con `isActive: true` |
| Workspaces totales | Todos los workspaces registrados |
| Usuarios activos | Usuarios con `isActive: true` |
| Usuarios totales | Todos los usuarios del sistema |

### Modulos y Suscripciones
| Card | Descripcion |
|---|---|
| Modulos activos | Modulos con `status: active` en el catalogo |
| Suscripciones activas | Total de subs con `status: active` |
| Suscripciones plan | Subs con tier `free` o `premium` (de planes) |
| Suscripciones enterprise | Subs con tier `enterprise` (manuales) |

### Accesos rapidos
Links directos a: Workspaces, Modulos, Planes, Usuarios.

---

## Gestion de Workspaces

### Lista (`/admin/workspaces`)
- Muestra todos los workspaces con nombre, slug, admin, estado
- **Paginacion**: selector de 5/10/20/50/100 registros

### Detalle (`/admin/workspaces/[id]`)
- **Informacion**: editar nombre, slug, activo/inactivo
- **Pago confirmado**: checkbox `isPayReady`
- **Planes contratados**: lista de planes vinculados al workspace
- **Usuarios**: lista de usuarios del workspace
- **Modulos**: gestion de suscripciones
  - **Agregar modulo (Enterprise)**: seleccionar cualquier modulo del catalogo, cuota mensual manual, checkbox auto-renovacion. Tier siempre `enterprise` (agregacion manual). Si el workspace ya tiene el modulo, se crea una nueva suscripcion independiente. La cuota se suma a la del plan.
  - **Editar modulo**: tier (`free`/`premium`/`enterprise`), status, cuota mensual, auto-renovacion
  - **Quitar modulo (enterprise)**: elimina la suscripcion y el `WorkspacePurchase` manual asociado del historial de compras
- **Zona de peligro**: eliminar workspace

---

## Gestion de Modulos

### Lista (`/admin/modules`)
- Muestra todos los modulos con key, nombre, tier, estado, visible, cuota default
- **Paginacion**: selector de 5/10/20/50/100
- Columna "Visible": badge Si/No que controla aparicion en landing y seleccion en planes

### Crear (`/admin/modules/create`)
- Key, nombre, descripcion, tier (free/premium), estado, cuota default
- Checkbox "Visible en landing y planes" (default: true)

---

## Gestion de Planes

### Lista (`/admin/plans`)
- Cards con nombre, precio, estado, destacado, modulos incluidos
- **Paginacion**: selector de 5/10/20/50/100

### Crear (`/admin/plans/create`)
- Nombre, precio, modulos incluidos (herencia "Basado en"), caracteristicas, soporte, onboarding, configuracion visual

---

## Gestion de Usuarios

### Lista (`/admin/users`)
- Usuarios con nombre, email, rol, workspace, estado
- **Paginacion**: selector de 5/10/20/50/100

### Detalle (`/admin/users/[id]`)
- Informacion, cambio de rol, estado

---

## Configuracion Global (`/admin/settings`)

19 feature toggles agrupados en 5 secciones. Solo accesible para superadmin.

### Auth
| Toggle | Default | Efecto |
|--------|---------|--------|
| Registro | ON | Bloquea `POST /api/auth/register` |
| Login | ON | Bloquea `POST /api/auth/login` (superadmin siempre exento) |
| Verificacion de email | ON | Si OFF: usuarios se crean activos, login no requiere verificacion |
| Recuperacion de contrasena | ON | Bloquea forgot/reset password |
| Emails transaccionales | ON | Si OFF: no envia emails, loguea en consola en dev |

### Funcionalidades
| Toggle | Default | Efecto |
|--------|---------|--------|
| Compra simulada | ON | Bloquea pasarela de pago |
| TransferCheck | ON | Bloquea process-image, sync-email, debug-search |
| Gmail OAuth | ON | Bloquea connect/callback/disconnect |
| API publica de planes | ON | Bloquea GET /api/plans |
| Endpoints de debug | OFF | debug-search devuelve 404 (no 403, no revela que existe) |

### Superadmin CRUD
| Toggle | Default | Efecto |
|--------|---------|--------|
| Workspaces | ON | Bloquea CRUD de workspaces |
| Modulos | ON | Bloquea CRUD de modulos |
| Planes | ON | Bloquea CRUD de planes |
| Usuarios | ON | Bloquea CRUD de usuarios globales |

### Admin / Operador
| Toggle | Default | Efecto |
|--------|---------|--------|
| Acceso a modulos | ON | Si OFF: redirect a `/dashboard` (superadmin exento) |
| Gestion de usuarios | ON | Bloquea `/api/users/*` para admin |
| Gestion de planes | ON | Bloquea purchase API para admin |

### Mantenimiento
| Toggle | Default | Efecto |
|--------|---------|--------|
| Modo mantenimiento | OFF | Bloquea todo el sitio. Solo superadmin navega. APIs publicas accesibles. |
| Mensaje | configurable | Se muestra en `/maintenance` |

---

## Audit Logs (`/admin/audit-logs`)

Registro de todas las operaciones CRUD realizadas desde el panel superadmin.

### Campos registrados
| Campo | Descripcion |
|-------|-------------|
| Fecha | Timestamp de la operacion |
| Accion | create, update, delete, activate, deactivate |
| Entidad | User, Workspace, Plan, Module, ModuleSubscription |
| Usuario | Email y rol del usuario que realizo la accion |
| Cambios | Campos modificados (antes/despues) |
| IP | Direccion IP del cliente |
| Metadata | Datos adicionales segun la operacion |

### Filtros
- Por entidad (Usuario, Workspace, Plan, Modulo)
- Por accion (Crear, Actualizar, Eliminar, Activar, Desactivar)
- Busqueda por email de usuario

### APIs relacionadas
- `GET /api/admin/audit-logs` - Lista de logs con paginacion y filtros

---

## Modelo de Datos

### AuditLog
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| action | enum | create, update, delete, activate, deactivate, login, logout |
| entity | enum | User, Workspace, Plan, Module, ModuleSubscription, AppSettings |
| entityId | String | ID del objeto afectado |
| userId | ObjectId | Usuario que realizo la accion |
| userEmail | String | Email del usuario |
| userRole | String | Rol del usuario |
| workspaceId | ObjectId | Workspace asociado (null para superadmin) |
| changes | Mixed | Campos modificados {old, new} |
| metadata | Mixed | Datos adicionales |
| ip | String | IP del cliente |
| userAgent | String | User agent del navegador |
| createdAt | Date | Timestamp |
