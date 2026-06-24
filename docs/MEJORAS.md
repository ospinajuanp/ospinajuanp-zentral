# Mejoras Planificadas — Zentral

> Análisis completo del proyecto.
> **Última actualización:** 2026-06-24
> **Total:** 131 items (25 completados ✓, 106 pendientes) + Personal Finance (7 iteraciones)

---

## 📊 Estado Actual del Proyecto

**Avance:** ~87% completo

### Completados Recientemente (25 items)
- [x] `passwordHash` expuesto en APIs → `select: false` + `toJSON.transform`
- [x] Bugs de autorización en transfercheck (S-C4, S-C5)
- [x] Plan DELETE checkea campo incorrecto (B-C1)
- [x] ErrorBoundary + Toast system (F-C1, F-C2)
- [x] Race condition en cuotas (S-H3) → operaciones atómicas
- [x] Cache invalidation (F-H10) → `router.refresh()`
- [x] Índices MongoDB en todos los modelos (B-H1)
- [x] Perfil de usuario con cambio de password (F-C4)
- [x] `<DataTable>` + `usePaginatedData` (F-H3, F-H4) → -476 líneas
- [x] Stats cargan 5 colecciones → `countDocuments` (B-C2)
- [x] Seed imprimía credenciales en consola (S-H7)
- [x] Dashboard workspace owner rediseñado (N-H3)
- [x] Módulo `visible`: campo booleano
- [x] Suscripciones enterprise coexistiendo con planes
- [x] `consumeQuota` oldest-first
- [x] Dashboard superadmin rediseñado: 12 cards
- [x] WorkspacePurchase con `plan: null` + `paymentMethod: 'manual'`
- [x] Enterprise en historial: badge ambar, sin acciones
- [x] Gmail OAuth2 scope: `gmail.readonly`
- [x] DELETE enterprise: borra ModuleSubscription + WorkspacePurchase
- [x] Feature toggles: 19 toggles en AppSettings
- [x] API `/admin/settings` GET/PATCH + UI
- [x] Guard `checkFeatureEnabled()` con exenciones superadmin
- [x] Checks integrados en 30+ rutas
- [x] Maintenance mode: `MaintenanceGuard` + página `/maintenance`

---

## 🎯 Prioridades para Siguiente Iteración

### 🔥 ALTA PRIORIDAD

| ID | Issue | Solución | Razón |
|----|-------|----------|-------|
| **P1** | GEMINI_API_KEY sin quota real | Reemplazar con key que tenga cuota | Módulo IA no funcional |
| **P2** | 3 módulos sin implementar (Antecedentes, Cartera, Facturación) | Implementar UI + APIs funcionales | Revenue potencial |
| **P3** | `recalculateQuotas()` N+1 queries | Usar `bulkWrite` con upsert | Rendimiento a escala |
| **P4** | `processPendingMatches` secuencial (50 logs = minutos) | `Promise.allSettled()` con concurrency limit | Performance crítico |
| **P5** | Rate limiting solo en auth endpoints | Extender a purchase, process-image, admin CRUD | Seguridad incompleta |
| **P6** | `protected-layout` re-fetch en cada navegación | `React.cache()` wrapper | Consulta innecesaria |
| **P7** | Search/filter faltante en listas admin | Search bar + filtros server-side | Usabilidad |

### ⭐ MEDIA PRIORIDAD

| ID | Issue | Solución |
|----|-------|----------|
| M1 | Integración pagos reales (Stripe/Wompi) | Reemplazar `paymentMethod: 'simulated'` |
| M2 | Audit logging incompleto | Modelo `AuditLog` con UI `/admin/audit-logs` |
| M3 | Sin breadcrumbs | Componente `<Breadcrumbs>` auto-generado |
| M4 | Password mínimo 6 chars sin complejidad | Min 8-12 chars, `zxcvbn` |
| M5 | Gmail OAuth re-fetchea settings en cada llamada | Cache LRU (5 min TTL) |
| M6 | `register/route.ts` queries secuenciales | `Promise.all()` |
| M7 | `purchase/route.ts` busca workspace y plan secuencial | `Promise.all()` |

### 📋 BAJA PRIORIDAD

| ID | Issue | Solución |
|----|-------|----------|
| B1 | Sin tests automatizados | Suite de tests |
| B2 | Sin PWA support | Service worker + manifest |
| B3 | Sin i18n | next-intl o similar |
| B4 | Workspace owner analytics dashboard | Gráficos de uso |
| B5 | Webhooks para integraciones externas | Eventos configurables |
| B6 | CSV/Excel export en admin lists | Botón exportar |
| B7 | Dark/light mode toggle | CSS custom properties |
| B8 | Health check endpoint | `GET /api/health` |
| B9 | API documentation (OpenAPI/Swagger) | Zod + route handlers |
| B10 | Skeleton screens en data-rich views | Componente `<Skeleton>` |

---

## 1. Backend & Rendimiento

### Crítico

| ID | Issue | Solución |
|----|-------|----------|
| B-C1 ✓ | Plan DELETE checkea campo `plan` en vez de `plans` | Cambiar a `Workspace.countDocuments({ plans: id })` |
| B-C2 ✓ | Stats cargan 5 colecciones enteras en memoria | `countDocuments` + filtros |
| B-C3 | `recalculateQuotas()` N+1 queries | `bulkWrite` con upsert |
| B-C4 | `processPendingMatches` secuencial (50 logs = minutos) | `Promise.allSettled()` con concurrency limit (5 concurrentes) |
| B-C5 | `protected-layout` consulta subscriptions en cada página | `React.cache()` wrapper |

### Alto

| ID | Issue | Solución |
|----|-------|----------|
| B-H1 ✓ | Índices compuestos en todos los modelos | Agregar índices compuestos |
| B-H2 | Varias queries `.findOne()` sin `.lean()` | Agregar `.lean()` en queries de solo lectura |
| B-H3 | `register/route.ts` hace 3 queries de Plan secuenciales | `Promise.all()` |
| B-H4 | `admin/workspaces/[id]` hace users + subs secuencial | `Promise.all()` |
| B-H5 | `purchase/route.ts` busca workspace y plan secuencial | `Promise.all()` |
| B-H6 | 3 módulos sin implementación funcional | Priorizar por negocio |
| B-H7 | Gmail search hace llamadas secuenciales (21 para 20 msgs) | `Promise.all` o Gmail batch |
| B-H8 | Gmail OAuth re-fetchea settings en cada llamada | Cache LRU (5 min TTL) |

### Medio

| ID | Issue | Solución |
|----|-------|----------|
| B-M1 | Módulos placeholder duplican código | Extraer a `ModuleShell` server component |
| B-M2 | `transfercheck/consolidado` carga todos los logs en memoria | Aggregation pipeline de MongoDB |
| B-M3 | OCR service no cachea resultados | SHA-256 hash del buffer |
| B-M4 | Extractor cae a Gemini incluso en errores no-quota | Solo fallback si error es `QUOTA_EXHAUSTED` |
| B-M5 | Sin `Cache-Control` en `/api/plans` | `max-age=300, stale-while-revalidate=600` |
| B-M6 | Seed sin protección de fallo parcial | `try/catch`, considerar transacciones |
| B-M7 | Seed checkea solo superadmin para idempotencia | `findOneAndUpdate` con `upsert: true` |
| B-M8 | `createPurchase` en seed sin type safety | Runtime check o utilidad compartida |

---

## 2. Seguridad & Integridad de Datos

### Crítico

| ID | Issue | Riesgo | Solución |
|----|-------|--------|----------|
| S-C1 ✓ | `passwordHash` se expone en APIs | Filtración hashes bcrypt | `select: false` + `toJSON.transform` |
| S-C2 | `.env.local` contiene credenciales reales | Compromiso total | Rotar credenciales, secrets manager |
| S-C3 | `ENCRYPTION_KEY` deriva del JWT_SECRET con fallback | Encriptación débil | Key dedicada de 32 bytes |
| S-C4 ✓ | `debug-search` no verifica workspace | Cross-workspace access | Validar `log.workspace === auth.workspaceId` |
| S-C5 ✓ | `logs` PUT tiene lógica invertida | Operaciones cross-workspace | Corregir validación |

### Alto

| ID | Issue | Riesgo | Solución |
|----|-------|--------|----------|
| S-H1 | Sin rate limiting en endpoints no-auth | Brute-force, DoS | Extender `CONFIGS` en rate-limit.ts |
| S-H2 | Sin validación de tamaño en uploads | DoS | Max 10MB, validar dimensiones |
| S-H3 ✓ | Race condition en checkQuota/consumeQuota | Bypass de límite | Operación atómica con `$expr` |
| S-H4 | Race condition en recalculateQuotas | Inconsistencia | Transacciones MongoDB o `$addToSet` |
| S-H5 ✓ | Audit logging para operaciones críticas | Sin trazabilidad | Modelo `AuditLog` + UI |
| S-H6 | Sin estrategia de backup de BD | Pérdida de datos | Backups automáticos en Atlas |
| S-H7 ✓ | Seed imprime credenciales en consola | Filtración | Solo loggear email |
| S-H8 | Catch blocks vacíos en extractor | Fallos silenciosos | `console.error` mínimo |

### Medio

| ID | Issue | Riesgo | Solución |
|----|-------|--------|----------|
| S-M1 | Cookie `secure` depende de NODE_ENV | Session hijacking | Variable `FORCE_SECURE_COOKIE` |
| S-M2 | JWT expira en 7 días sin revocación | Tokens robados válidos 1 semana | Reducir a 1-24h, agregar `tokenVersion` |
| S-M3 | Password mínimo 6 chars sin complejidad | Brute-force trivial | Min 8-12 chars, `zxcvbn` |
| S-M4 | Compra duplicada de planes pagos posible | Cargos duplicados | `countDocuments` previo |
| S-M5 | Toggle permite cancelar último plan activo | Workspace sin módulos | Bloquear cancelación |
| S-M6 | `console.error/log` en vez de logging estructurado | Sin monitoreo centralizado | `pino` o `winston` |
| S-M7 | Errores de API externas pasan crudos al cliente | Information disclosure | Mensajes genéricos en prod |
| S-M8 | `gmailAccessToken` en texto plano | Acceso Gmail si BD comprometida | Encriptar o no persistir |
| S-M9 | `debug-search` accesible en producción | Exposición emails | `NODE_ENV !== 'production'` guard |
| S-M10 | Sin CSRF protection | CSRF en navegadores viejos | Double-submit cookie |
| S-M11 | Sin health check endpoint | Sin monitoreo | `GET /api/health` |
| S-M12 | `delete workspace` deja datos huérfanos | Inconsistencia | Soft-delete o cascade cleanup |

### Bajo

| ID | Issue | Riesgo | Solución |
|----|-------|--------|----------|
| S-L1 | Sin sanitización XSS en user-provided strings | Stored XSS (mitigado por CSP) | `DOMPurify` |
| S-L2 | Sin escaneo automático de vulnerabilidades | Paquetes con CVEs | `pnpm audit` en CI, Dependabot |
| S-L3 | Rate limiter fail-open si Redis falla | Sin rate limiting si Redis cae | Fallback en memoria, alertas |
| S-L4 | Gmail OAuth state parameter sin firma HMAC | Token a workspace equivocado | Firmar state con HMAC |
| S-L5 | Email from address usa dominio de prueba | Emails a spam | Dominio verificado en prod |
| S-L6 | `email` no se checkea por unicidad al actualizar | Duplicate key error | `findOne` previo |
| S-L7 | Sin protección contra auto-modificación de rol | Admin se cambia su propio rol | Bloquear `userId === auth.userId` |

---

## 3. Frontend & UX

### Crítico

| ID | Issue | Solución |
|----|-------|----------|
| F-C1 ✓ | Sin ErrorBoundary en client components | Crear `<ErrorBoundary>` wrapper |
| F-C2 ✓ | Sin sistema de notificaciones (toasts) | `<ToastProvider>` + `useToast()` |
| F-C3 | Sin wrapper de fetch centralizado | `useApi()` hook o `apiClient` |
| F-C4 ✓ | Sin perfil de usuario | Página `/profile` con cambio password |
| F-C5 | Antecedentes, Cartera, Facturación stubs | Implementar UI funcional |

### Alto

| ID | Issue | Solución |
|----|-------|----------|
| F-H1 | `SidebarShell`, `PricingCards` sin `React.memo` | `React.memo()` en componentes pesados |
| F-H2 | `ProtectedLayout` recalcula sin `useMemo` | `useMemo` para arrays derivados |
| F-H3 ✓ | Duplicación masiva de código de tablas | Componente `<DataTable>` |
| F-H4 ✓ | Patrón de paginación repetido en 8+ páginas | Hook `usePaginatedData<T>()` |
| F-H5 | Sin search/filter en listas admin | Search bar + filtros server-side |
| F-H6 | Modales no cierran con Escape consistentemente | `onKeyDown` handler |
| F-H7 | Sin focus trap en modales | Implementar focus trapping |
| F-H8 | Sin breadcrumbs | Componente `<Breadcrumbs>` |
| F-H9 | Sin React Context para auth/session | `AuthProvider` + `useAuth()` |
| F-H10 ✓ | Sin cache invalidation consistente | `router.refresh()` post-mutación |
| F-H11 | Admin stats sin refresh | Botón refresh o polling |
| F-H12 | Sin export de datos en listas admin | Botón CSV/Excel |

### Medio

| ID | Issue | Solución |
|----|-------|----------|
| F-M1 | Componentes `Button` e `InputField` no se usan consistentemente | Enforced usage, crear `SelectField` |
| F-M2 | Spinners duplicados en 11+ lugares | Usar siempre `<Spinner />` |
| F-M3 | `SessionTimeout` anidado en algunos layouts | Garantizar una sola instancia |
| F-M4 | Sin skeleton screens | Componente `<Skeleton>` |
| F-M5 | Sin `<Suspense>` en client components | `<Suspense>` boundaries |
| F-M6 | Sin dark/light mode toggle | CSS custom properties |
| F-M7 | Sin pull-to-refresh en mobile | Botón refresh + overscroll |
| F-M8 | Admin "Crear usuario" disabled sin ETA | Implementar o remover |
| F-M9 | TransferCheck usa PaginationBar propio | Reemplazar con `<PaginationBar />` |
| F-M10 | `window.location.href` en Gmail connect/disconnect | Usar `router.push()` |
| F-M11 | Sin optimistic updates en toggles | Actualizar local primero, rollback en error |
| F-M12 | Sin shortcuts de teclado | Hook `useKeyboardShortcuts` |

---

## 4. Responsive & Accesibilidad

### Crítico

| ID | Issue | Solución |
|----|-------|----------|
| R-C1 | Tablas responsive a 320px pueden desbordar | `min-w-0`, `truncate`, testear a 320px |
| R-C2 | `#main-content` skip-link solo en landing | Agregar en `SidebarShell` |

### Alto

| ID | Issue | Solución |
|----|-------|----------|
| R-H1 | Touch targets < 44px en varios elementos | `min-h-[44px] min-w-[44px]` |
| R-H2 | Hero `min-h-[70vh]` en landscape phone | `min-h-[60vh]` |
| R-H3 | TransferCheck tabs overflow en 320px | Scroll horizontal o dropdown |
| R-H4 | Plan create/edit muy larga en mobile | Floating save o accordion |
| R-H5 | Sin `aria-label` en iconos y nav secundario | Agregar `aria-label` |

---

## 5. Funcionalidades Nuevas

### Alto

| ID | Feature | Descripción |
|----|---------|-------------|
| N-H0 ✓ | Feature toggles globales | 19 toggles con UI `/admin/settings` |
| N-H1 | Integración de pagos real (Stripe/Wompi) | Reemplazar `paymentMethod: 'simulated'` |
| N-H2 ✓ | Audit logging | Modelo `AuditLog` + UI `/admin/audit-logs` |
| N-H3 ✓ | Dashboard workspace con analytics | Gráficos de uso, tendencias |
| N-H4 | Webhooks | Eventos configurables por workspace |
| N-H5 | Módulo Finanzas Personales | Ingresos, gastos, deudas, metas, reglas, simuladores |

### Medio

| ID | Feature | Descripción |
|----|---------|-------------|
| N-M10 | Export datos Personal Finance | CSV/Excel para transacciones |
| N-M11 | Goals con notificaciones | Alerts de progreso o atrasos |

### Medio

| ID | Feature | Descripción |
|----|---------|-------------|
| N-M1 | API versioning (`/api/v1/`) | Prefijo de versión |
| N-M2 | API documentation (OpenAPI/Swagger) | Auto-generado de Zod schemas |
| N-M3 | Error tracking (Sentry) | Centralizar errores |
| N-M4 | Emails transaccionales | Compra confirmada, cuota agotada, etc. |
| N-M5 | Data export GDPR | `GET /api/workspaces/[id]/export` |
| N-M6 | Soft-delete pattern | `deletedAt` en vez de borrado físico |
| N-M7 | Health check endpoint | `GET /api/health` |
| N-M8 | CORS configuration | Headers explícitos |
| N-M9 | File upload mejorado (drag-drop, preview) | Reemplazar input básico |

---

## 📁 Archivos Afectados por Categoría

### Modelos (10 archivos)
- `src/lib/models/user.ts`
- `src/lib/models/workspace.ts`
- `src/lib/models/plan.ts`
- `src/lib/models/module.ts`
- `src/lib/models/module-subscription.ts`
- `src/lib/models/workspace-settings.ts`
- `src/lib/models/transfercheck-log.ts`
- `src/lib/models/workspace-purchase.ts`
- `src/lib/models/app-settings.ts`
- `src/lib/models/audit-log.ts`

### API Routes (30+ archivos)
- `src/app/api/admin/*`
- `src/app/api/users/*`
- `src/app/api/workspaces/*`
- `src/app/api/modules/transfercheck/*`
- `src/app/api/auth/*`

### Frontend Pages (30+ archivos)
- `src/app/(core)/**`
- `src/app/admin/**`
- `src/app/(modules)/**`
- `src/app/(auth)/**`

### Componentes (25+ archivos)
- `src/components/sidebar-shell.tsx`
- `src/components/protected-layout.tsx`
- `src/components/pagination.tsx`
- `src/components/data-table.tsx`
- `src/components/landing/*`
- `src/components/ui/*`

### Lib/Utils (10+ archivos)
- `src/lib/auth/*`
- `src/lib/db/mongoose.ts`
- `src/lib/purchase/*`
- `src/lib/modules/transfercheck/*`
- `src/lib/email/*`
- `src/proxy.ts`
- `src/lib/seed.ts`
