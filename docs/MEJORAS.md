# Mejoras Planificadas — Zentral

> Analisis completo del proyecto generado el 2026-05-25. Ultima actualizacion: 2026-05-27.
> **No comitear sin revision.** Se usa como hoja de ruta para siguientes iteraciones.
> Total: **131 items** (9 completados ✓, 122 pendientes)

---

## 1. Backend & Rendimiento

### Critico

| ID | Issue | Solucion |
|----|-------|----------|
| B-C1 ✓ | Plan DELETE checkea campo `plan` en vez de `plans` — nunca bloquea borrados | Cambiar a `Workspace.countDocuments({ plans: id })` |
| B-C2 | Stats (admin page + API) cargan 5 colecciones enteras en memoria. Crash a escala | Reemplazar con aggregation pipeline de MongoDB. Extraer logica a `src/lib/services/admin-stats.ts` |
| B-C3 | `recalculateQuotas()` hace N+1 queries en loop | Usar `bulkWrite` con upsert |
| B-C4 | `processPendingMatches` procesa logs secuencialmente. 50 logs = minutos | `Promise.allSettled()` con concurrency limit (p-limit, 5 concurrentes) |
| B-C5 | `protected-layout` consulta subscriptions en cada pagina. Mismo dato, cada navegacion | `React.cache()` wrapper o mover a nivel de layout raiz |

### Alto

| ID | Issue | Solucion |
|----|-------|----------|
| B-H1 ✓ | Faltan indices compuestos en todos los modelos (User, Workspace, Plan, Module, ModuleSubscription) | Agregar indices: `{workspace, createdAt}`, `{isActive, sortOrder}`, etc. |
| B-H2 | Varias queries `.findOne()` sin `.lean()` — overhead de Mongoose | Agregar `.lean()` en queries de solo lectura |
| B-H3 | `register/route.ts` hace 3 queries de Plan secuenciales | `Promise.all()` |
| B-H4 | `admin/workspaces/[id]` y `workspaces/[id]` hacen users + subs secuencial | `Promise.all()` |
| B-H5 | `purchase/route.ts` busca workspace y plan secuencial | `Promise.all()` |
| B-H6 | 3 modulos (Antecedentes, Cartera, Facturacion) sin implementacion | Priorizar implementacion por negocio |
| B-H7 | Gmail search hace llamadas secuenciales por mensaje (21 llamadas para 20 msgs) | Usar `Promise.all` o Gmail batch endpoint |
| B-H8 | Gmail OAuth client re-fetcha settings de DB en cada llamada | Cache LRU en memoria (5 min TTL) por workspaceId |

### Medio

| ID | Issue | Solucion |
|----|-------|----------|
| B-M1 | Paginas placeholder de modulos duplican codigo (3 archivos identicos) | Extraer a `ModuleShell` server component |
| B-M2 | `transfercheck/consolidado` carga todos los logs en memoria para calcular stats en JS | Usar aggregation pipeline de MongoDB |
| B-M3 | OCR service no cachea resultados por imagen | SHA-256 hash del buffer, checkear TransferCheckLog existente |
| B-M4 | Extractor cae a Gemini incluso en errores no-quota de OCR | Solo fallback si error es `QUOTA_EXHAUSTED` |
| B-M5 | Sin `Cache-Control` en endpoint publico `/api/plans` | Agregar `max-age=300, stale-while-revalidate=600` |
| B-M6 | Seed no tiene proteccion de fallo parcial. Si User falla tras Workspace, estado inconsistente | Wrappear en `try/catch`, considerar transacciones MongoDB |
| B-M7 | Seed checkea solo superadmin para idempotencia, no entidades individuales | `findOneAndUpdate` con `upsert: true` por entidad |
| B-M8 | `createPurchase` en seed asume plan populado sin type safety | Runtime check o mover a utilidad compartida |

---

## 2. Seguridad & Integridad de Datos

### Critico

| ID | Issue | Riesgo | Solucion |
|----|-------|--------|----------|
| S-C1 ✓ | `passwordHash` se expone en respuestas de API de usuarios (GET, POST, PUT) | Filtracion de hashes bcrypt | `select: false` en schema, o `toJSON.transform` |
| S-C2 | `.env.local` contiene credenciales reales de produccion (MongoDB, JWT, Resend, Upstash, Gemini, Gmail OAuth) | Compromiso total del sistema | Rotar TODAS las credenciales. Usar secrets manager |
| S-C3 | `ENCRYPTION_KEY` deriva del JWT_SECRET con fallback hardcodeado `'default-key-change-me'` | Encriptacion debil de tokens Gmail | Key dedicada de 32 bytes, sin fallback |
| S-C4 ✓ | `debug-search` no verifica que el log pertenezca al workspace del usuario | Cross-workspace data access | Validar `log.workspace === auth.workspaceId` |
| S-C5 ✓ | `logs` PUT tiene logica de autorizacion invertida (superadmin usa `auth.workspaceId` que puede ser null) | Operaciones cross-workspace | Corregir: `if (role !== 'superadmin' && log.workspace !== auth.workspaceId) → 403` |

### Alto

| ID | Issue | Riesgo | Solucion |
|----|-------|--------|----------|
| S-H1 | Sin rate limiting en endpoints no-auth (solo 5 endpoints protegidos) | Brute-force, DoS, agotamiento de cuotas AI/OCR | Extender `CONFIGS` en rate-limit.ts. Minimo: purchase, process-image, sync-email, admin CRUD |
| S-H2 | Sin validacion de tamano en upload de imagenes (process-image) | DoS, consumo de memoria | Max 10MB, validar dimensiones |
| S-H3 ✓ | Race condition en checkQuota/consumeQuota — dos requests concurrentes pueden exceder cuota | Bypass de limite mensual | Operacion atomica: `findOneAndUpdate` con `$expr: { $gt: ['$monthlyQuota', '$usedQuota'] }` |
| S-H4 | Race condition en recalculateQuotas — compras concurrentes pueden perder cuotas | Inconsistencia de datos | Transacciones MongoDB o `$addToSet` atomico |
| S-H5 | Sin audit logging para operaciones criticas (crear/borrar usuarios, compras, cambios de rol) | Imposibilidad de auditoria | Modelo `AuditLog`, loggear en cada ruta admin |
| S-H6 | Sin estrategia de backup de BD | Perdida de datos | Configurar backups automaticos en MongoDB Atlas |
| S-H7 | Seed imprime credenciales en consola (`admin@zentral.dev / admin123`) | Filtracion en logs | Remover de output, solo loggear email |
| S-H8 | Catch blocks vacios en extractor (OCR/AI) y registro (email) | Fallos silenciosos sin alerta | `console.error` como minimo, alertas para fallos repetidos |

### Medio

| ID | Issue | Riesgo | Solucion |
|----|-------|--------|----------|
| S-M1 | Cookie `secure` depende de NODE_ENV — en staging/desarrollo va por HTTP | Session hijacking | Variable dedicada `FORCE_SECURE_COOKIE` |
| S-M2 | JWT expira en 7 dias sin mecanismo de revocacion | Tokens robados validos 1 semana | Reducir a 1-24h, agregar `tokenVersion` en User |
| S-M3 | Password minimo 6 caracteres sin requisitos de complejidad | Brute-force trivial | Min 8-12 chars, requerir mayuscula, usar `zxcvbn` |
| S-M4 | Compra duplicada de planes pagos posible (solo Free tiene check) | Cargos duplicados | `countDocuments({ workspace, plan, status: 'active' })` |
| S-M5 | Toggle de compra permite cancelar el plan Free (ultimo plan activo) | Workspace se queda sin modulos | Bloquear cancelacion del ultimo plan activo |
| S-M6 | `console.error/log` en vez de logging estructurado en 42+ lugares | Sin monitoreo centralizado | Adoptar `pino` o `winston` con JSON y correlation IDs |
| S-M7 | Errores de API externas (OCR, Gmail) se pasan crudos al cliente | Information disclosure | Mensajes genericos en prod, detalle solo en dev |
| S-M8 | `gmailAccessToken` se guarda en texto plano (solo refreshToken esta encriptado) | Acceso a Gmail si la BD se compromete | Encriptar tambien, o no persistir — derivar del refresh |
| S-M9 | `debug-search` accesible en produccion sin guard `NODE_ENV` | Exposicion de contenido de emails | `NODE_ENV !== 'production'` guard |
| S-M10 | Sin CSRF protection en endpoints state-changing | CSRF en navegadores viejos | Double-submit cookie o header token |
| S-M11 | Sin health check endpoint | Sin monitoreo operacional | `GET /api/health` con estado de BD, Redis, externals |
| S-M12 | `delete workspace` deja datos huerfanos (purchases, transfercheck logs, settings) | Inconsistencia de datos | Soft-delete o cascade cleanup |

### Bajo

| ID | Issue | Riesgo | Solucion |
|----|-------|--------|----------|
| S-L1 | Sin sanitizacion XSS en user-provided strings (nombres, descripciones) | Stored XSS (mitigado por CSP y React) | `DOMPurify` o asegurar escaping JSX consistente |
| S-L2 | Sin escaneo automatico de vulnerabilidades en dependencias | Paquetes con CVEs conocidos | `pnpm audit` en CI, Dependabot |
| S-L3 | Rate limiter hace fail-open si Redis falla (bypass total) | Sin rate limiting si Redis cae | Fallback en memoria, alertas, fail-closed para auth |
| S-L4 | Gmail OAuth state parameter sin firma HMAC (contiene `workspaceId`) | Teorico: token a workspace equivocado | Firmar state con HMAC |
| S-L5 | Email from address usa `onboarding@resend.dev` (dominio de prueba) | Emails a spam en prod | Usar dominio verificado en prod |
| S-L6 | `email` no se checkea por unicidad al actualizar usuario | Error MongoDB duplicate key | `findOne({ email, _id: { $ne: userId } })` previo |
| S-L7 | Sin proteccion contra auto-modificacion de rol | Admin cambiandose su propio rol | Bloquear `userId === auth.userId` en cambios de rol |

---

## 3. Frontend & UX

### Critico

| ID | Issue | Solucion |
|----|-------|----------|
| F-C1 ✓ | Sin ErrorBoundary en ningun client component. Crash = pantalla blanca | Crear `<ErrorBoundary>` wrapper |
| F-C2 ✓ | Sin sistema de notificaciones (toasts). Errores son divs inline que no se auto-dismiss | `<ToastProvider>` + `useToast()` hook |
| F-C3 | Sin wrapper de fetch centralizado. Cada pagina repite try/catch/error manualmente | `useApi()` hook o `apiClient` con manejo de 401/500/network |
| F-C4 | Sin perfil de usuario (cambio de password, nombre). Solo admin edita usuarios | Pagina `/profile` con cambio de password y datos personales |
| F-C5 | Antecedentes, Cartera, Facturacion son stubs sin UI funcional | Implementar UI: formularios de consulta, listados, operaciones CRUD |

### Alto

| ID | Issue | Solucion |
|----|-------|----------|
| F-H1 | `SidebarShell`, `PricingCards`, `ModulesGridCards` sin `React.memo` — re-renders innecesarios | `React.memo()` en componentes pesados |
| F-H2 | `ProtectedLayout` recalcula `bottomNav` en cada render sin `useMemo` | `useMemo` para arrays derivados |
| F-H3 | Duplicacion masiva de codigo de tablas responsive (8+ paginas) | Componente `<DataTable>` con column config |
| F-H4 | Patron de paginacion repetido en 8+ paginas (useState page/limit/load/changePage) | Hook `usePaginatedData<T>(endpoint)` |
| F-H5 | Sin search/filter en listas admin (usuarios, workspaces) | Search bar + filtros por rol/estado, server-side via query params |
| F-H6 | Modales no cierran con Escape consistentemente | `onKeyDown` handler en todos los modales |
| F-H7 | Sin focus trap en modales. Tabbing sale del modal al fondo | Implementar focus trapping (dialog role + tab loop) |
| F-H8 | Sin breadcrumbs. Navegacion profunda desorienta | Componente `<Breadcrumbs>` auto-generado de pathname |
| F-H9 | Sin React Context para auth/session. Cada pagina re-fetcha `/api/auth/session` | `AuthProvider` + `useAuth()` hook |
| F-H10 ✓ | Sin cache invalidation consistente. Mutaciones no refrescan datos stale | `router.refresh()` o revalidate tras cada mutacion |
| F-H11 | Admin stats sin refresh. Usuario debe recargar la pagina | Boton "Refresh" o polling cada 60s |
| F-H12 | Sin export de datos en listas admin (excepto transfercheck consolidated) | Boton "Exportar CSV/Excel" en cada lista |

### Medio

| ID | Issue | Solucion |
|----|-------|----------|
| F-M1 | Componentes `Button` e `InputField` existen pero no se usan consistentemente | Enforced usage, crear `SelectField` |
| F-M2 | Spinners duplicados en 11+ lugares en vez de usar componente `Spinner` | Usar siempre `<Spinner />` |
| F-M3 | `SessionTimeout` anidado en algunos layouts (doble timer) | Garantizar una sola instancia |
| F-M4 | Sin skeleton screens — solo spinners full-page | Componente `<Skeleton>` para data-rich views |
| F-M5 | Sin partial-loading/Suspense en client components con fetch | `<Suspense>` boundaries con fallbacks |
| F-M6 | Sin dark/light mode toggle — solo dark | Soportar light theme via CSS custom properties |
| F-M7 | Sin pull-to-refresh en mobile | Boton refresh visible + overscroll-behavior |
| F-M8 | Admin "Crear usuario" boton disabled sin ETA | Implementar funcionalidad o remover boton |
| F-M9 | TransferCheck usa `PaginationBar` propio en vez del compartido | Reemplazar con `<PaginationBar />` |
| F-M10 | `window.location.href` causa full page reload en Gmail connect/disconnect | Usar `router.push()` |
| F-M11 | Sin optimistic updates en toggles (purchase, user status) | Actualizar estado local primero, rollback en error |
| F-M12 | Sin shortcuts de teclado (Ctrl+K search, Esc modals, Ctrl+Enter submit) | Hook `useKeyboardShortcuts` |

---

## 4. Responsive & Accesibilidad

### Critico

| ID | Issue | Solucion |
|----|-------|----------|
| R-C1 | Tablas responsive a 320px pueden desbordar con muchas columnas (admin workspace detail) | `min-w-0`, `truncate`, testear a 320px |
| R-C2 | `#main-content` skip-link solo en landing, no en paginas protegidas | Agregar `id="main-content"` al `<main>` en `SidebarShell` |

### Alto

| ID | Issue | Solucion |
|----|-------|----------|
| R-H1 | Touch targets < 44px en varios elementos (paginacion, links de tabla) | `min-h-[44px] min-w-[44px]` en mobile |
| R-H2 | Hero `min-h-[70vh]` en landscape phone deja poco contenido visible | `min-h-[60vh]` para landscape |
| R-H3 | TransferCheck tabs overflow en 320px (5 tabs horizontales) | Scroll horizontal o dropdown en mobile |
| R-H4 | Plan create/edit page muy larga en mobile, sin boton sticky de save | Floating save button o accordion sections |
| R-H5 | Sin `aria-label` en varios elementos interactivos (iconos, nav secundario) | Agregar `aria-label` faltantes |

---

## 5. Funcionalidades Nuevas

### Alto

| ID | Feature | Descripcion |
|----|---------|-------------|
| N-H1 | Integracion de pagos real (Stripe/Wompi) | Reemplazar `paymentMethod: 'simulated'` con Stripe Checkout. Webhook para confirmacion |
| N-H2 | Audit logging | Modelo `AuditLog` con userId, action, entity, changes, timestamp, IP |
| N-H3 | Dashboard del workspace con analytics | Graficos de uso por modulo, tendencias, actividad de usuarios, resumen de billing |
| N-H4 | Webhooks | Permitir a workspace owners configurar webhooks para eventos (transfer matched, etc.) |

### Medio

| ID | Feature | Descripcion |
|----|---------|-------------|
| N-M1 | API versioning (`/api/v1/`) | Prefijo de version para no romper cambios |
| N-M2 | API documentation (OpenAPI/Swagger) | Auto-generado de Zod schemas + route handlers |
| N-M3 | Error tracking (Sentry) | Centralizar errores con contexto |
| N-M4 | Emails transaccionales | Compra confirmada, usuario agregado, cuota agotada, modulo activado |
| N-M5 | Data export GDPR | Endpoint `GET /api/workspaces/[id]/export` con dump JSON/CSV |
| N-M6 | Soft-delete pattern | `deletedAt` en vez de borrado fisico, cascade cleanup |
| N-M7 | Health check endpoint | `GET /api/health` con estado BD + Redis |
| N-M8 | CORS configuration | Headers explicitos en `next.config.ts` |
| N-M9 | File upload mejorado (drag-drop, preview, progress) | Reemplazar `<input type="file">` basico |

---

## Prioridad Recomendada para Siguiente Iteracion

Implementado (esta sesion ✓):
1. ~~S-C1: `passwordHash` expuesto en APIs~~ ✓
2. ~~S-C4, S-C5: Bugs de autorizacion en transfercheck~~ ✓
3. ~~B-C1: Plan DELETE checkea campo incorrecto~~ ✓
4. ~~F-C1, F-C2: ErrorBoundary + Toast system~~ ✓
5. ~~S-H3: Race condition en cuotas~~ ✓
6. ~~F-H10: Cache invalidation~~ ✓
7. ~~B-H1: Indices MongoDB~~ ✓

Pendiente:
1. **F-C4**: Perfil de usuario (cambio de password, nombre, datos personales)
2. **F-H4**: `usePaginatedData` hook — elimina ~150 lineas duplicadas por pagina
3. **F-H3**: Componente `<DataTable>` — elimina duplicacion de 8+ tablas
4. **B-C3**: N+1 en recalculateQuotas → bulkWrite
5. **B-C5**: protected-layout re-fetch → React.cache()
6. **B-C2**: Stats cargan 5 colecciones enteras → aggregation pipeline
7. **F-C3**: Wrapper de fetch centralizado (`useApi()` o apiClient)
8. **F-H5**: Search/filter en listas admin
9. **B-C4**: processPendingMatches secuencial → Promise.allSettled
10. **B-H3**: register/route.ts queries secuenciales → Promise.all()

---

## Archivos Afectados por Categoria

### Modelos (6 archivos)
`src/lib/models/user.ts`, `workspace.ts`, `plan.ts`, `module.ts`, `module-subscription.ts`, `workspace-settings.ts`

### API Routes (20+ archivos)
`src/app/api/admin/*`, `src/app/api/users/*`, `src/app/api/workspaces/*`, `src/app/api/modules/transfercheck/*`, `src/app/api/auth/*`

### Frontend Pages (30+ archivos)
`src/app/(core)/**`, `src/app/admin/**`, `src/app/(modules)/**`, `src/app/(auth)/**`

### Componentes (10+ archivos)
`src/components/sidebar-shell.tsx`, `protected-layout.tsx`, `pagination.tsx`, `landing/*`, `ui/*`

### Lib/Utils (10+ archivos)
`src/lib/auth/*`, `src/lib/middleware/*`, `src/lib/purchase/*`, `src/lib/modules/transfercheck/*`, `src/lib/email/*`, `src/proxy.ts`, `src/lib/seed.ts`
