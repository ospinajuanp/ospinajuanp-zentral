# Panel de Administracion (Superadmin)

El panel de superadmin esta en `/admin` y solo es accesible con rol `superadmin`.

---

## Dashboard

El dashboard muestra metricas agrupadas en secciones con cards clicables:

### Facturacion
| Card | Descripcion |
|---|---|
| MRR (USD) | Suma de monthlyPrice de workspaces activos con pago confirmado |
| Pago confirmado | Workspaces con `isPayReady: true` |
| Pago pendiente | Workspaces con `isPayReady: false` |
| Planes de pago activos | Workspaces con al menos un plan pago contratado |

### Workspaces
| Card | Descripcion |
|---|---|
| Total | Todos los workspaces registrados |
| Activos | Workspaces con `isActive: true` |
| Inactivos | Workspaces con `isActive: false` |

### Modulos
| Card | Descripcion |
|---|---|
| Total | Todos los modulos del catalogo |
| Activos | Modulos con `status: active` |
| Gratis | Modulos con `tier: free` |
| Premium | Modulos con `tier: premium` |

### Usuarios + Suscripciones
| Card | Descripcion |
|---|---|
| Total usuarios | Todos los usuarios del sistema |
| Activos | Usuarios con email verificado (`isActive: true`) |
| Pend. verificacion | Usuarios sin verificar email |
| Admins | Usuarios con rol `admin` |
| Suscripciones activas | Subs con `status: active` |
| Premium | Subs con `tier: premium` |
| Gratis | Subs con `tier: free` |

---

## Gestion de Workspaces

### Lista (`/admin/workspaces`)
- Muestra todos los workspaces con nombre, slug, admin, estado
- **Paginacion**: selector de 5/10/20/50/100 registros con navegacion de paginas

### Detalle (`/admin/workspaces/[id]`)
- **Informacion**: editar nombre, slug, activo/inactivo
- **Pago confirmado**: checkbox `isPayReady`. Al activarlo, todas las suscripciones `inactive` pasan a `active`. Al desactivarlo, las `active` pasan a `inactive`
- **Planes contratados**: lista de planes vinculados al workspace (array `plans[]`)
- **Usuarios**: lista de usuarios del workspace
- **Modulos**: gestion de suscripciones
  - Agregar modulo: seleccionar de los disponibles (no suscritos), tier y cuota
  - Editar modulo: tier, status, cuota mensual
  - Quitar modulo: confirmacion con modal
- **Zona de peligro**: eliminar workspace (cascade: desvincula usuarios, elimina suscripciones)

---

## Gestion de Modulos

### Lista (`/admin/modules`)
- Muestra todos los modulos con key, nombre, tier, estado, cuota default
- **Paginacion**: selector de 5/10/20/50/100 registros

### Crear (`/admin/modules/create`)
- Key (slug unico), nombre, descripcion, tier (free/premium), estado (active/inactive/coming_soon), cuota default

---

## Gestion de Planes

### Lista (`/admin/plans`)
- Muestra todos los planes como cards con nombre, precio, estado, destacado, modulos incluidos
- **Paginacion**: selector de 5/10/20/50/100 registros

### Crear (`/admin/plans/create`)
- **Informacion**: nombre, precio (opcional), precio mensual, usuarios maximos (0 = ilimitado), descripcion
- **Modulos incluidos**:
  - "Basado en": hereda modulos + datos de otro plan (solo lectura para los heredados)
  - Modulos adicionales seleccionables con filtros rapidos (Gratis/Premium/Todos/Ninguno)
  - Cuota override por modulo
- **Caracteristicas adicionales**: textarea, una por linea
- **Soporte y Onboarding**: dropdowns con opciones predefinidas
- **Configuracion**:
  - Texto del boton (dropdown con opciones + personalizado)
  - Link del boton (autogenerado: `/register?plan=ID` o `https://wa.me/NUMBER` para enterprise)
  - Plan destacado (badge "Mas popular")
  - Orden (auto-incremental)

---

## Gestion de Usuarios

### Lista (`/admin/users`)
- Muestra todos los usuarios con nombre, email, rol, workspace, estado
- Boton "Crear usuario" deshabilitado (los usuarios se crean por registro o desde el workspace)
- **Paginacion**: selector de 5/10/20/50/100 registros

### Detalle (`/admin/users/[id]`)
- Informacion del usuario, cambio de rol, estado

---

## API Admin Endpoints

| Ruta | Metodo | Descripcion |
|---|---|---|
| `/api/admin/stats` | GET | Datos agregados del dashboard |
| `/api/admin/modules` | GET/POST | Listar/Crear modulo (paginado: `?page=&limit=`) |
| `/api/admin/modules/[id]` | GET/PUT/DELETE | CRUD modulo |
| `/api/admin/plans` | GET/POST | Listar/Crear plan (paginado: `?page=&limit=`) |
| `/api/admin/plans/[id]` | GET/PUT/DELETE | CRUD plan |
| `/api/admin/workspaces` | GET/POST | Listar/Crear workspace (paginado: `?page=&limit=`) |
| `/api/admin/workspaces/[id]` | GET/PUT/DELETE | CRUD workspace (incluye isPayReady toggle) |
| `/api/admin/workspaces/[id]/subscriptions` | GET/POST | Listar/Crear suscripcion |
| `/api/admin/workspaces/[id]/subscriptions/[subId]` | PUT/DELETE | Editar/Eliminar suscripcion |
| `/api/admin/users` | GET | Lista usuarios global (paginado: `?page=&limit=&workspace=`) |
| `/api/admin/users/[id]` | GET/PUT/DELETE | CRUD usuario |
