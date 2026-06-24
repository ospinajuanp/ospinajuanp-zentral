# Ingeniería de Frontend, Abstracciones de UI y Accesibilidad (A11y)

> **Última actualización:** 2026-06-19

Este documento detalla las decisiones de arquitectura de frontend implementadas en Zentral, enfocándose en la migración hacia React 19, la optimización de rendimiento de componentes cliente de terceros, la unificación visual con Tailwind CSS v4 y las políticas estrictas de accesibilidad.

---

## 🎨 Arquitectura del Sistema de Diseño (B2B Data-Dense Paradigm)

A diferencia de las aplicaciones de consumo masivo (B2C), las plataformas SaaS B2B operativas requieren interfaces con una **alta densidad de información**. Los operadores necesitan ver el estado completo del negocio sin scrolls innecesarios.

### Fichas Técnicas del Design System (Tailwind CSS v4):
* **Lienzo Base:** Uso Mandatorio de `bg-slate-950` para el fondo de página principal, combinando contenedores estructurados en `bg-slate-900` con bordes finos `border-slate-800` y bordes suavizados `rounded-md`. Esto reduce la fatiga visual en jornadas largas de monitoreo operativo.
* **Control de Layouts Fluido:** Las tarjetas informativas y los visualizadores de planes implementan un modelo de estiramiento elástico (`flex flex-col h-full`). El uso estratégico de la clase `mt-auto pt-4` en los contenedores inferiores garantiza que los botones transaccionales y de llamado a la acción (CTA) permanezcan perfectamente alineados al fondo de las tarjetas de forma homogénea, sin importar la variabilidad del texto descriptivo superior.

---

## 🔗 Abstracción de Capas Transaccionales (`usePaginatedData` + `<DataTable>`)

Para erradicar el antipatrón de duplicación de lógica (*Don't Repeat Yourself - DRY*) en las 5 pantallas de visualización de datos de la plataforma (Superadmin: Workspaces, Módulos, Planes, Usuarios globales; Admin: Usuarios de empresa), se extrajo el estado interno hacia una infraestructura genérica de TypeScript.

### Hook Genérico: `usePaginatedData<T>()`
Centraliza el ciclo de vida de las peticiones REST paginadas, controlando de manera nativa:
1. El estado mutador del tamaño de página (selectores reactivos de 5, 10, 20, 50 y 100 registros).
2. Los flags booleanos de carga diferida (`isLoading`) y control de excepciones (`error`).
3. El tipado estricto `<T>` de los payloads devueltos por los Server Components post-procesados con `.lean()` y serializados mediante `JSON.parse(JSON.stringify())`.

### Componente Reutilizable: `<DataTable>`
Recibe las propiedades estructuradas del hook y se encarga de renderizar de forma segura las colecciones de datos. Implementa una estrategia **móvil-first destructiva**: las filas tradicionales de tabla HTML se transforman automáticamente en un grid de tarjetas verticales apiladas (`grid-cols-1 md:table-row`) cuando el ancho del navegador desciende de los 768px, garantizando operatividad total desde teléfonos inteligentes.

**Impacto Métrico:** Esta refactorización eliminó de golpe más de 450 líneas de código repetitivo de mantenimiento, asegurando un comportamiento transaccional unificado en todo el ecosistema.

---

## 🏎️ Resolución de Conflictos de Rendimiento: Embla Carousel v8

En la Landing Page, la visualización de los planes de precios utiliza `embla-carousel-react`. Durante la fase de integración, el uso por defecto de detectores de cambio de tamaño automáticos (*ResizeObserver*) generaba parpadeos bruscos y roturas de animaciones fluidas al interactuar rápidamente con el carrusel.

### Solución de Ingeniería Implementada:
1. **Remoción del ResizeObserver:** Se desactivó el auto-ajuste de tamaño por eventos del DOM para evitar ciclos infinitos de re-renderizado durante transiciones CSS.
2. **Scroll Lock Interceptor (`isScrollingRef`):** Se introdujo una referencia mutable de React (`useRef`) para trackear de forma síncrona el estado de desplazamiento físico. Si el usuario está ejecutando un drag activo, el sistema omite de forma mandatoria las llamadas de re-inicialización del slider (`reInit()`).
3. **Botones de Control Híbridos:** En lugar de deshabilitar los botones HTML de navegación utilizando el atributo nativo `disabled` (lo que bloquea los eventos del puntero y genera saltos en el foco del lector de pantalla), Zentral utiliza estados puramente condicionales basados en CSS (`opacity-30 cursor-not-allowed`) sincronizados en el efecto de montaje (`useEffect`) mediante las funciones nativas `canScrollPrev()` y `canScrollNext()`. Esto permite clics ultra-rápidos sin pérdida de interacción.

---

## ♿ Accesibilidad (A11y) como Requisito de Producción

Zentral no trata la accesibilidad como un añadido secundario; está integrada estructuralmente en el árbol de componentes para cumplir con los estándares de la industria:

* **Estructura Semántica de Diálogos:** Los modales de confirmación y la barra de navegación móvil desplegable (*Bottom Sheet*) implementan roles explícitos `role="dialog"` combinados con la propiedad `aria-labelledby="[id-del-titulo]"` y el flag dinámico `aria-expanded`. Esto le comunica inmediatamente a las tecnologías de asistencia (como lectores de pantalla) el cambio de contexto semántico.
* **Control del Teclado (Keyboard Interception):** Los componentes interactivos flotantes escuchan de forma nativa el evento global `keydown`. Al detectar la pulsación de la tecla `Escape`, ejecutan el método de cierre automático y devuelven el foco al elemento disparador original, evitando trampas de teclado (*keyboard traps*).
* **Tratamiento de Decoraciones:** Todos los componentes gráficos basados en emojis o iconos puros de SVG incorporan el atributo `aria-hidden="true"`, evitando que los lectores de pantalla vocalicen caracteres innecesarios que entorpezcan la navegación del usuario.
* **Saltos de Navegación (*Skip Links*):** El layout raíz incorpora un enlace invisible superior de salto de contenido enfocado por teclado. Esto permite a usuarios con discapacidades motrices saltarse la barra de navegación repetitiva del header e ir directo al core funcional de la interfaz con un solo tabulador.

---

## 📊 Estado y Mejoras Pendientes

### Implementado ✅
- Sistema de diseño con tokens oscuros B2B
- Hook `usePaginatedData<T>()` + `<DataTable>`
- Optimización Embla sin ResizeObserver
- ErrorBoundary + Toast notification system
- Accesibilidad: aria-labelledby, role=dialog, skip-links

### Pendiente 🔜

| ID | Issue | Prioridad |
|----|-------|-----------|
| F-C3 | Wrapper de fetch centralizado (`useApi()`) | ALTA |
| F-C5 | Módulos placeholder → implementarlos | ALTA |
| F-H1 | `React.memo()` en SidebarShell, PricingCards | MEDIA |
| F-H2 | `useMemo` en ProtectedLayout bottomNav | MEDIA |
| F-H6 | Modales no cierran con Escape consistentemente | MEDIA |
| F-H7 | Sin focus trap en modales | MEDIA |
| F-H8 | Sin breadcrumbs | MEDIA |
| F-H9 | Sin React Context para auth/session | MEDIA |
| F-M1 | Button/InputField no usados consistentemente | BAJA |

Ver `docs/MEJORAS.md` para lista completa de 131 mejoras planificadas.
