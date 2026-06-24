# Arquitectura del Sistema, Seguridad e Inquilino Múltiple (Multi-tenancy)

> **Última actualización:** 2026-06-24
> **Estado del proyecto:** ~87% completo

Este documento detalla los pilares arquitectónicos de Zentral, enfocándose en el aislamiento estricto de datos, la interceptación criptográfica en el Edge y la estrategia de Control de Acceso Basado en Roles (RBAC).

---

## 🏛️ Modelo de Multi-tenancy (Aislamiento Lógico)

Zentral utiliza un modelo de **solución de aislamiento lógico en una base de datos compartida**. Todas las empresas (*workspaces*) comparten la misma instancia y colecciones de MongoDB, pero están segregadas de forma estricta mediante descriptores de contexto inyectados en tiempo de ejecución.

### Flujo de Peticiones Seguras:
1. **Cliente / Navegador:** Envía una petición HTTP acompañada de una Cookie httpOnly.
2. **Edge Proxy Middleware:** Intercepta la petición y valida el JWT de forma criptográfica en sub-milisegundos.
3. **Inyección de Contexto:** Inyecta los headers seguros `x-workspace-id`, `x-user-role` y `x-user-id` hacia las rutas internas, limpiando cualquier entrada externa maliciosa.
4. **Aislamiento en Base de Datos:** Mongoose ejecuta consultas estrictamente filtradas por el ID del workspace inyectado, bloqueando accesos cruzados (*cross-tenant*).

### Mecanismos de Aislamiento en la Capa de Datos:
* **Workspace Isolation Nativo:** Ningún Endpoint operativo o Server Action acepta el `workspaceId` directamente desde los parámetros del cuerpo o la URL del cliente de forma desprotegida. El identificador del workspace se extrae exclusivamente de los headers de control inyectados por el Proxy de seguridad.
* **Índices Compuestos de Alta Eficiencia:** Para mitigar la degradación del rendimiento a medida que escala la base de datos, los modelos con alta densidad de inserción (`TransferCheckLog`, `ModuleSubscription`, `WorkspacePurchase`) implementan índices compuestos que anteponen el campo `workspace`. Esto fuerza a MongoDB a realizar búsquedas indexadas ultra-rápidas limitadas al subconjunto del inquilino:
  * `TransferCheckLog`: `{ workspace: 1, status: 1, createdAt: -1 }`
  * `ModuleSubscription`: `{ workspace: 1, moduleKey: 1, tier: 1 }`

---

## 🛡️ Edge Proxy Middleware (`src/proxy.ts`)

La primera línea de defensa de Zentral se ejecuta en la capa del Edge de Next.js. Al actuar antes de que la petición toque los servidores de renderizado o las APIs funcionales, reducimos el consumo de cómputo innecesario ante peticiones maliciosas o no autenticadas.

### Justificación del Stack de Seguridad:
* **`jose` en lugar de `jsonwebtoken`:** Las APIs nativas de Node.js no están totalmente disponibles en entornos Edge Runtime. Se seleccionó `jose` debido a su footprint ultra-ligero y compatibilidad nativa con Web Crypto APIs, permitiendo firmas y verificaciones criptográficas asíncronas en sub-milisegundos.
* **Estrategia de Cookies Defensivas:** El JWT se almacena en la cookie de sesión `zentral_session` bajo las siguientes directivas de producción:
  * `httpOnly: true`: Inmune a ataques de Cross-Site Scripting (XSS) al no ser accesible vía JavaScript.
  * `SameSite: 'Strict'`: Blindaje total contra ataques de Cross-Site Request Forgery (CSRF).
  * `Secure: true`: Restringido exclusivamente a conexiones cifradas mediante HTTPS en producción.

### Ciclo de Vida y Propósitos del Token (`verifyJwt`):
El validador de tokens inspecciona estrictamente el campo estructurado `purpose` para evitar la reutilización de credenciales en contextos incorrectos:
* `'session'`: Token estándar de navegación con expiración rígida de 7 días.
* `'email-verification'`: Emitido en el registro (`isActive: false`). Bloquea el inicio de sesión hasta que el flujo asíncrono valida el token (expiración: 24 horas).
* `'password-reset'`: Token de un solo uso para flujos de recuperación de credenciales (expiración: 15 minutos).

### Control de Inactividad Recurrente (`SessionTimeout`):
Para proteger estaciones de trabajo desatendidas en entornos operativos corporativos, el componente cliente `SessionTimeout` escucha eventos globales del DOM. Si no se detecta actividad en un intervalo de **15 minutos**, el cliente destruye los estados en memoria e invoca automáticamente al endpoint `/api/auth/logout`.

---

## 🎛️ Propagación de Contexto y Desacoplamiento de Rutas

Una vez que el Edge Proxy valida satisfactoriamente el JWT, realiza una mutación limpia de los headers de la petición HTTP antes de redirigirla al sub-sistema interno de Next.js, introduciendo tres variables de control garantizadas: `x-user-id`, `x-user-role`, y `x-workspace-id`.

Esto permite que tus API Routes y Server Components estén completamente desacoplados de la lógica de descifrado de cookies:

```typescript
// Ejemplo de consumo seguro dentro de una API interna de Zentral
export async function GET(request: Request) {
  const workspaceId = request.headers.get('x-workspace-id');
  const userRole = request.headers.get('x-user-role');

  if (!workspaceId) {
    return NextResponse.json({ error: 'Contexto de Workspace ausente' }, { status: 401 });
  }
  
  // La consulta de datos nace segura y aislada de manera mandatoria
  const logs = await TransferCheckLog.find({ workspace: workspaceId }).lean();
  return NextResponse.json(logs);
}
```

## 👥 Control de Acceso Basado en Roles (RBAC)

Zentral implementa un modelo jerárquico estricto donde los privilegios están completamente delimitados entre la gestión global de la infraestructura y la operación interna del negocio.

| Rol | Capacidad de Gestión de Infraestructura | Capacidad dentro del Workspace |
| :--- | :--- | :--- |
| **`superadmin`** | **Total**. Acceso a `/admin`. CRUD de planes, módulos globales y visibilidad de inquilinos. | Bypass completo de cuotas y visibilidad multi-tenant con fines de soporte técnico. |
| **`admin`** | Ninguna. Rutas `/admin` devuelven 403 o redirección forzada. | **Dueño de Workspace**. Puede invocar compras simuladas, renombrar el slug, y hacer CRUD de usuarios (`operador`). |
| **`operador`** | Ninguna. | **Solo Lectura / Escritura Operativa**. Limitado estrictamente a los módulos contratados y activos. No tiene acceso a facturación ni gestión de usuarios. |
| **`hijo`** | *(Rol legado)* Retrocompatible en backend, tratado con la misma jerarquía operativa que el rol operador. | Limitado estrictamente al alcance del rol operador. Oculto en las interfaces modernas de usuario. |

### El Interruptor Global de Negocio: `isPayReady`

El modelo de datos del Workspace cuenta con el flag crítico `isPayReady`. Este campo actúa como un interruptor maestro controlado por el `superadmin` desde su panel global o modificado automáticamente por el sistema de compras.

* **Efecto de Bloqueo Inmediato:** Si `isPayReady === false`, el middleware o los guards de ruta despropagan el estado `active` de todas las suscripciones del espacio de trabajo en caliente. Los usuarios del inquilino verán bloqueado el acceso a las herramientas operativas de forma inmediata, mitigando pérdidas financieras por impagos sin necesidad de alterar los registros históricos de suscripción del cliente.

---

## 📊 Estructura del Proyecto

```
src/
├── proxy.ts              # Edge middleware (JWT validation, context injection)
├── app/
│   ├── (auth)/           # Login, Register, Password reset
│   ├── (core)/           # Dashboard, Users, Profile
│   ├── (modules)/        # TransferCheck, PersonalFinance, Antecedentes, Cartera, Facturacion
│   ├── admin/            # Superadmin panel
│   └── api/              # API routes (auth, modules, admin)
├── components/
│   ├── protected-layout.tsx
│   ├── sidebar-shell.tsx
│   └── ui/               # Reusable UI components
└── lib/
    ├── models/           # Mongoose models (10+)
    ├── auth/             # JWT utilities
    ├── db/               # Mongoose connection
    └── settings/         # Feature toggles guard
```

---

## ⚠️ Consideraciones de Seguridad Pendientes

| ID | Issue | Prioridad |
|----|-------|-----------|
| S-C2 | `.env.local` contiene credenciales reales | ALTA |
| S-C3 | `ENCRYPTION_KEY` deriva del JWT_SECRET con fallback | ALTA |
| S-H1 | Sin rate limiting en endpoints no-auth | ALTA |
| S-H2 | Sin validación de tamaño en uploads | ALTA |
| S-H6 | Sin estrategia de backup de BD | MEDIA |
| S-M2 | JWT expira en 7 días sin revocación | MEDIA |
| S-M3 | Password mínimo 6 chars sin complejidad | MEDIA |

Ver `docs/MEJORAS.md` para lista completa de 131 mejoras planificadas.
