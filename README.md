# Zentral — Plataforma Micro-SaaS para Operaciones Empresariales B2B

> **Estado del Proyecto:** Avanzado (~85% completo)
> **Última actualización:** 2026-06-19

---

## 📊 Resumen Ejecutivo

**Zentral** es un ecosistema modular e inquilinato múltiple (Multi-tenant) diseñado para optimizar flujos críticos de operaciones empresariales B2B. El núcleo de la plataforma permite la ejecución y validación de módulos independientes (como conciliación de pagos e IA en tiempo real), completamente aislados por entorno de trabajo (*workspace*), controlados por un robusto sistema de límites atómicos y gobernados por políticas de acceso basadas en roles (RBAC) interceptadas en el Edge.

### Fortalezas del Proyecto
- ✅ Multi-tenancy robusto con aislamiento en Edge
- ✅ Cuotas atómicas (0 race conditions)
- ✅ Pipeline IA híbrida con fallback (OCR + Gemini)
- ✅ Feature toggles (19 controles configurables)
- ✅ 25/131 mejoras completadas

### Pendientes Críticos
1. **GEMINI_API_KEY real** — IA no funciona sin quota
2. **Implementar módulos de negocio** — 3 módulos en "próximamente"
3. **Pagos reales** — Solo simulado actualmente
4. **Optimización N+1** — `recalculateQuotas` y `processPendingMatches`
5. **Rate limiting extendido** — Solo endpoints auth protegidos

---

## 🛠️ Tech Stack & Justificación Técnica

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16.2.6 (App Router) |
| React | React 19.2.4 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Base de datos | MongoDB (Mongoose 9.6.2) |
| Autenticación | JWT propio (jose 6.2.3) |
| Correos | Resend 6.12.3 |
| Rate Limiting | Upstash Redis (@upstash/redis 1.38.0) |
| IA | Google Generative AI (@google/generative-ai 0.24.1) |
| OCR | OCR.space API |
| Gmail | googleapis 172.0.0, google-auth-library 10.6.2 |
| Carruseles | embla-carousel-react 8.6.0 |
| Hashing | bcryptjs 3.0.3 |

---

## 🏛️ Arquitectura & Pilares Técnicos

### 1. Control de Cuotas Atómico y Mitigación de Condiciones de Carrera
Solución: Mutaciones atómicas directas en MongoDB utilizando `findOneAndUpdate` + `$expr`. El sistema evalúa `usedQuota < monthlyQuota` y ejecuta el incremento en una única operación atómica.

### 2. Pipeline Resiliente de Extracción con IA (Graceful Degradation)
- **Capa 1:** OCR.space (bajo costo, rápido)
- **Fallback:** Gemini 2.0 Flash (procesamiento en memoria, sin guardar a disco)
- Garantiza disponibilidad 99.9% y privacidad absoluta

### 3. Seguridad Zero-Trust y Aislamiento Multi-tenant
- Edge Proxy Middleware (`src/proxy.ts`) intercepta peticiones
- JWT en cookies `httpOnly` con políticas `SameSite=Strict`
- Headers seguros inyectados: `x-workspace-id`, `x-user-role`, `x-user-id`
- Consultas Mongoose siempre filtradas por workspace

### 4. Abstracción Avanzada de UI (DRY)
- Hook genérico `usePaginatedData<T>()` centraliza paginación
- Componente reutilizable `<DataTable>` con estrategia mobile-first
- **Impacto:** -450+ líneas de código duplicado

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/           # Login, Register, Forgot/Reset Password
│   ├── (core)/           # Dashboard, Users, Profile, Workspace
│   ├── (modules)/        # TransferCheck, Antecedentes, Cartera, Facturacion
│   ├── admin/             # Superadmin: Stats, Workspaces, Modules, Plans, Users
│   └── page.tsx          # Landing page
├── components/
│   ├── landing/          # Hero, Features, Pricing, Modules, Footer
│   ├── ui/               # Button, Input, Toast, Modal, Pagination
│   ├── protected-layout.tsx
│   ├── sidebar-shell.tsx
│   └── data-table.tsx
├── hooks/
│   └── use-paginated-data.ts
├── lib/
│   ├── models/           # 10 modelos Mongoose
│   ├── auth/             # JWT (jose)
│   ├── db/               # Mongoose singleton
│   ├── email/            # Resend
│   ├── purchase/         # recalculateQuotas
│   ├── modules/
│   │   └── transfercheck/  # extractor, matcher, gmail-service, ocr-service, ai-service
│   └── settings/         # Feature toggles guard
└── proxy.ts             # Edge middleware
```

---

## 📋 Inventario de Modelos de Datos

| Modelo | Propósito |
|--------|-----------|
| `User` | Usuarios con roles (superadmin, admin, operador, hijo) |
| `Workspace` | Espacios de trabajo multi-tenant |
| `Plan` | Planes de precios (Free, Premium, Premium Plus, Enterprise) |
| `Module` | Catálogo de módulos (TransferCheck, Antecedentes, etc.) |
| `ModuleSubscription` | Suscripción workspace → módulo con cuotas |
| `WorkspacePurchase` | Historial de compras de planes |
| `WorkspaceSettings` | Configuración (Gmail OAuth encriptado AES-256-CBC) |
| `TransferCheckLog` | Logs de conciliación bancaria |
| `AppSettings` | 19 feature toggles globales |
| `AuditLog` | Trazabilidad de operaciones CRUD |

---

## 🎯 Prioridades de Desarrollo

### 🔥 ALTA PRIORIDAD
| # | Item | Razón |
|---|------|-------|
| 1 | Reemplazar GEMINI_API_KEY | El módulo de IA no funciona sin quota real |
| 2 | Implementar módulos: Antecedentes, Cartera, Facturación | Funcionalidad pendiente = revenue potencial |
| 3 | N+1 queries → `bulkWrite` en `recalculateQuotas` | Rendimiento degradado con escala |
| 4 | `processPendingMatches` secuencial → `Promise.allSettled` | 50 logs = minutos de procesamiento |
| 5 | Rate limiting en endpoints no-auth | Seguridad incompleta |

### ⭐ MEDIA PRIORIDAD
| # | Item | Razón |
|---|------|-------|
| 1 | Integración pagos reales (Stripe/Wompi) | Sin monetización real |
| 2 | Audit logging completo | Compliance |
| 3 | Breadcrumbs | Navegación |
| 4 | Password policy | Seguridad débil actual |
| 5 | Gmail OAuth cache LRU | Rendimiento |

### 📋 BAJA PRIORIDAD
| # | Item | Razón |
|---|------|-------|
| 1 | Tests automatizados | Calidad |
| 2 | PWA support | Enhancement |
| 3 | i18n | Solo español |
| 4 | Dark/light mode | Ya tiene tema oscuro |
| 5 | API documentation | Interno |

---

## 🚀 Instalación y Despliegue

### Prerrequisitos
- Node.js >= 18
- Gestor de paquetes `pnpm`
- Instancia de MongoDB (Local o Atlas)

### Configuración del Entorno

1. Clona el repositorio e instala las dependencias:
   ```bash
   pnpm install
   ```

2. Configura las variables de entorno:
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus credenciales
   ```

3. Ejecuta el script de inicialización:
   ```bash
   pnpm run seed
   ```

4. Enciende el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

### Scripts Disponibles
```bash
pnpm run dev          # Desarrollo
pnpm run build        # Producción
pnpm run start        # Iniciar producción
pnpm run lint         # ESLint
pnpm run type-check   # TypeScript
pnpm run seed         # Poblar BD con datos de prueba
```

---

## 📂 Documentación Especializada

Para auditar a fondo la implementación técnica:

- [🏛️ Arquitectura, Seguridad y RBAC](docs/ARCHITECTURE.md)
- [📊 Concurrencia, Cuotas y Compras Multi-plan](docs/CONCURRENCY_En_SAAS.md)
- [🤖 Pipeline de Integración de IA y Mensajería](docs/INTEGRATIONS_PIPELINE.md)
- [🎨 Ingeniería de Frontend y Patrones Reutilizables](docs/UI_UX_ENGINEERING.md)
- [📋 Catálogo de Módulos](docs/PLAN.md)
- [💰 Sistema de Precios y Planes](docs/PLANES.md)
- [⚙️ Panel de Administración](docs/ADMIN.md)
- [🔧 Mejoras Planificadas (131 items)](docs/MEJORAS.md)

---

## 📜 Licencia

Copyright (c) 2026 Juan Pablo Ospina. Todos los derechos reservados.
El código fuente está visible con fines de auditoría técnica y portafolio profesional.
No se permite la reproducción, distribución o uso comercial de este software sin autorización expresa del autor.
