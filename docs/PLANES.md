# Planes de Precios

Los planes se gestionan dinámicamente desde la BD y se muestran en la landing page.

Cada plan puede heredar módulos de otro plan ("Basado en") más módulos adicionales seleccionados manualmente.

---

## Free — $0/mes

Para empezar a usar Zentral.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck (heredable) |
| Usuarios | 1 |
| Consultas | 100 / mes por módulo |
| Soporte | Ninguno |
| Onboarding | Ninguno |

## Premium — $12/mes

Para equipos que necesitan más.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck + AntecedentesCheck + Facturación + Cartera |
| Usuarios | 5 |
| Consultas | 500 / mes por módulo |
| Soporte | Email |
| Onboarding | Autoguiado |
| Extra | Módulos en beta gratis |

## Enterprise — A medida

Solución personalizada para tu negocio.  
Contacto vía WhatsApp.

| Característica | Incluye |
|---|---|
| Módulos | Todos disponibles |
| Usuarios | Ilimitados |
| Consultas | Ilimitadas por módulo |
| Soporte | Prioritario |
| Onboarding | Dedicado |
| Factura | Personalizada |
| SLA | 48–72 h |

---

## Comparativa rápida

| | Free | Premium | Enterprise |
|---|---|---|---|
| Precio | $0/mes | $12/mes | A medida |
| Usuarios | 1 | 5 | Ilimitados |
| Módulos | 1 free | Todos (free + premium) | Todos |
| Consultas | 100/mes | 500/mes por módulo | Ilimitadas |
| Soporte | Ninguno | Email | Prioritario |
| Onboarding | Ninguno | Autoguiado | Dedicado |
| isPayReady | true (auto-activado) | false (pendiente pago) | false (pendiente contacto) |

---

## Modelo de Datos: Plan

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | String | Nombre comercial del plan |
| `price` | String | Texto del precio ("$12", "", "A medida") — opcional |
| `monthlyPrice` | Number or null | Precio numérico mensual (para cálculos de MRR) |
| `description` | String | Descripción corta |
| `includedModules` | Array | Módulos incluidos (ref a Module + quotaOverride) |
| `maxUsers` | Number | Usuarios máximos (0 = ilimitado) |
| `extraFeatures` | String[] | Características extra (una por línea en formulario) |
| `support` | String | `ninguno` / `email` / `prioritario` / `canales` / `dedicado` |
| `onboarding` | String | `ninguno` / `autoguiado` / `videos` / `documentacion` / `dedicado` |
| `cta` | String | Texto del botón (dropdown con opciones + personalizado) |
| `ctaLink` | String | Link del botón. Auto-generado: `/register?plan=ID` o `https://wa.me/NUMBER` |
| `highlighted` | Boolean | Se muestra como "Más popular" |
| `isEnterprise` | Boolean | Plan a medida — borde punteado en landing, sin precio, CTA WhatsApp |
| `whatsappNumber` | String | Número de WhatsApp (solo visible si isEnterprise) |
| `sortOrder` | Number | Orden de aparición (auto-incremental al crear) |
| `isActive` | Boolean | Visible en la landing |

---

## Flujo de Registro con Plan

1. Usuario hace clic en el CTA de un plan en la landing → va a `/register?plan=PLAN_ID`
2. El formulario de registro envía `planId` al backend
3. El backend busca el plan y crea el workspace con:
   - `plan`: referencia al Plan seleccionado
   - `isPayReady`: `true` si es plan gratuito (monthlyPrice = 0), `false` si es de pago
   - `ModuleSubscription`s: según los `includedModules` del plan
4. Si `isPayReady = false`: subs se crean con `status: 'inactive'`
5. El workspace muestra los módulos en el dashboard pero con overlay "Pago pendiente"
6. Superadmin togglea `isPayReady = true` → todas las subs pasan a `active`

---

## Basado en (Herencia de Planes)

Al crear un plan, se puede seleccionar "Basado en" otro plan existente. Esto:

- **Hereda**: módulos, maxUsers, extraFeatures, description, support, onboarding del plan base
- **Módulos heredados**: se muestran en una sección de solo lectura (no aparecen en los checkboxes)
- **Módulos adicionales**: solo los módulos NO heredados son seleccionables
- **Al guardar**: `includedModules = heredados + seleccionados`

Esto permite crear planes como "Premium Plus" que parten de Premium y agregan módulos extra.
