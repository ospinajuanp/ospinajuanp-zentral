# Zentral — Posts de LinkedIn

> **Última actualización:** 2026-06-19
> **Estado:** Serie completada (12 posts + 1 intro)

Esta colección de artículos técnicos fue publicada en LinkedIn para documentar el proceso de desarrollo y demostrar estándares técnicos.

---

## Serie: Construyendo Zentral

### POST #1 — Introducción
**Título:** Construyendo un Micro-SaaS B2B desde cero

Zentral es un ecosistema modular multi-tenant construido sobre Next.js 16, React 19 y Tailwind CSS v4. Pensado para automatizar operaciones críticas B2B, comenzando con un motor inteligente de conciliación bancaria llamado TransferCheck.

Tres pilares clave:
1. Aislamiento Estricto (Multi-tenancy)
2. Resiliencia con IA
3. Mutaciones Atómicas

---

### POST #2 — Concurrencia y Race Conditions
**Título:** El antipatrón más común en SaaS: validar cuotas en la capa de aplicación

Solución: mutaciones atómicas directas en MongoDB con `findOneAndUpdate` y `$expr`.

```typescript
const result = await ModuleSubscription.findOneAndUpdate(
  { workspace, moduleKey, status: 'active', $expr: { $lt: ['$usedQuota', '$monthlyQuota'] } },
  { $inc: { usedQuota: 1 } },
  { new: true, projection: { _id: 1 } }
);
```

---

### POST #3 — Integración de IA
**Título:** Integrar IA de forma rentable y respetuosa con la privacidad

Pipeline híbrido de extracción con Graceful Degradation:
1. OCR.space (bajo costo, rápido)
2. Gemini 2.0 Flash fallback (procesamiento en memoria, sin guardar a disco)

---

### POST #4 — Seguridad Multi-tenant
**Título:** La fuga accidental de información entre empresas es el peor escenario posible

Edge Proxy Middleware (`src/proxy.ts`) con:
- Cookies criptográficas defensivas (httpOnly, SameSite=Strict)
- Inyección de contexto limpio
- Aislamiento mandatorio en queries

---

### POST #5 — Gmail OAuth2
**Título:** Integración con Gmail sin convertirse en un peligro de seguridad

- Principio de privilegio mínimo: scope `gmail.readonly`
- Cifrado AES-256-CBC en reposo
- Ciclo de vida autónomo de tokens

---

### POST #6 — Abstracciones DRY
**Título:** Escribir código mantenible que no se repita a sí mismo

- Hook `usePaginatedData<T>()` — centraliza paginación
- Componente `<DataTable>` — mobile-first destructivo
- Impacto: -450 líneas de código duplicado

---

### POST #7 — Multi-plan Acumulativo
**Título:** Sistema de facturación flexible: planes que se acumulan, no se reemplazan

- Free como ancla siempre incluida
- Cuotas acumulativas entre planes
- Protección a cuentas Enterprise

---

### POST #8 — Optimización Embla
**Título:** Una interfaz lenta destruye la confianza del usuario

Soluciones:
- `isScrollingRef` para bloquear re-init durante scroll
- Botones híbridos sin `disabled` HTML
- Sincronización inicial forzada

---

### POST #9 — Consumo Oldest-First
**Título:** Algoritmo de consumo que protege las cuotas premium

Orden estratégico de capas: free → premium → enterprise
Consumo atómico en cascada.

---

### POST #10 — Accesibilidad
**Título:** La accesibilidad no es opcional, es un estándar de calidad

- Semántica estricta en diálogos
- Intercepción del teclado
- Tratamiento de elementos decorativos

---

### POST #11 — Feature Toggles
**Título:** Desacoplar despliegue de liberación con Feature Toggles

- Fallback y bypass inteligente
- Ocultamiento preventivo (404 no 403)
- 19 toggles configurables desde UI

---

### POST #12 — Cierre de Serie
**Título:** 131 mejoras planificadas, -450 líneas de código, 0 race conditions

Balance final:
- 📉 -450 líneas de código duplicado
- 🔒 Cero condiciones de carrera
- 🧠 Privacidad garantizada en flujos de IA
- 🛡️ Seguridad perimetral

---

## Próximos Pasos

Para seguir la evolución del proyecto:
- [Repositorio GitHub](https://github.com/ospinajuanp/ospinajuanp-zentral)
- [Documentación completa](./project-context.espanol.md)
- [Mejoras planificadas](./MEJORAS.md)
