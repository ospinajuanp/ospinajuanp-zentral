# Planes de Precios Flexibles

## Free — $0/mes
Para empezar a usar Zentral.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck |
| Usuarios | 1 |
| Consultas | 100 / mes por módulo |
| Soporte | — |

## Premium — $12/mes
Para equipos que necesitan más.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck + AntecedentesCheck + Facturación + Cartera + beta |
| Usuarios | 5 |
| Consultas | 500 / mes por módulo |
| Soporte | Email |
| Beta | Acceso anticipado a nuevos módulos |

## Enterprise — A medida
Solución personalizada para tu negocio.

| Característica | Incluye |
|---|---|
| Módulos | Todos disponibles |
| Usuarios | Ilimitados |
| Consultas | Ilimitadas por módulo |
| Soporte | Prioritario |
| Factura | Personalizada |
| Onboarding | Dedicado |
| SLA | 48–72 h |

---

## Comparativa rápida

| | Free | Premium | Enterprise |
|---|---|---|---|
| Precio | $0/mes | $12/mes | A medida |
| Usuarios | 1 | 5 | Ilimitados |
| Módulos | 1 free | Premium + beta | Todos |
| Consultas | 100/mes por módulo | 500/mes por módulo | Ilimitadas |
| Soporte | — | Email | Prioritario |

---

## Modelo de Datos

### Plan (catálogo de precios)
| Campo | Tipo | Descripción |
|---|---|---|
| `name` | String | Nombre comercial del plan |
| `price` | String | Texto del precio ("$12", "A medida") |
| `monthlyPrice` | Number or null | Precio numérico mensual |
| `description` | String | Descripción corta |
| `features` | String[] | Lista de características |
| `cta` | String | Texto del botón |
| `highlighted` | Boolean | Si se muestra como "Más popular" |
| `sortOrder` | Number | Orden de aparición |
| `isActive` | Boolean | Si está visible en la landing |
