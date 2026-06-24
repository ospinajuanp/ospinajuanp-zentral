# Zentral Tech Core — Design System

> **Última actualización:** 2026-06-19
> **Estado:** Oscuro, profesional, denso en datos para Micro-SaaS B2B

Paleta visual oscura, profesional y densa en datos para un micro-SaaS B2B.

---

## Fondos & Layout

| Elemento | Clases |
|---|---|
| Canvas de página | `bg-slate-950` |
| Card / Contenedor | `bg-slate-900 border border-slate-800 rounded-md` |
| Centrado vertical | `min-h-screen flex items-center justify-center px-4` |

## Tipografía

| Elemento | Clases |
|---|---|
| Título principal | `text-white font-semibold` |
| Texto secundario | `text-slate-400 text-sm` |
| Feedback éxito | `text-emerald-500` |
| Feedback error | `text-rose-500` |
| Feedback advertencia | `text-amber-500` |

## Inputs

| Estado | Clases |
|---|---|
| Base | `bg-slate-950 text-slate-200 border border-slate-800 rounded-md` |
| Focus | `focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden` |
| Placeholder | `placeholder-slate-500` |
| Disabled | `opacity-50 cursor-not-allowed` |

## Botones

| Tipo | Clases |
|---|---|
| Primario | `bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors rounded-md disabled:opacity-50` |
| Secundario | `border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors rounded-md` |
| Peligro | `bg-rose-600 text-white font-medium hover:bg-rose-700 active:bg-rose-800 transition-colors rounded-md` |
| Ghost | `text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-md` |

## Spinner

```jsx
<div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
```

## Iconos

| Propósito | SVG |
|---|---|
| Check éxito | `text-emerald-500`, círculo con palomita |
| Error / Advertencia | `text-rose-500`, círculo con tachada o signo de exclamación |
| Info | `text-indigo-500`, círculo con "i" |
| Mostrar contraseña | ojo (ver login/reset-password) |
| Ocultar contraseña | ojo tachado (ver login/reset-password) |

## Badges

| Tipo | Clases |
|---|---|
| Éxito | `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20` |
| Error | `bg-rose-500/10 text-rose-500 border border-rose-500/20` |
| Advertencia | `bg-amber-500/10 text-amber-500 border border-amber-500/20` |
| Info | `bg-indigo-500/10 text-indigo-500 border border-indigo-500/20` |
| Neutral | `bg-slate-500/10 text-slate-400 border border-slate-500/20` |

## Layout

### Cards
```tsx
<div className="bg-slate-900 border border-slate-800 rounded-md p-6">
  {/* Contenido */}
</div>
```

### Sidebar
- Desktop: `sticky top-0 h-screen w-64 bg-slate-900 border-r border-slate-800`
- Mobile: bottom bar fixed + bottom sheet overlay

### Grid
```tsx
// 2 columnas en desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## Convenciones

1. **Modo oscuro por defecto** — `<html class="dark">`
2. **Clases utilitarias** — Tailwind CSS v4
3. **Componentes con `flex flex-col h-full`** — tarjetas de igual altura
4. **Botones anclados al fondo** — `mt-auto pt-4`
5. **Responsive mobile-first** — `grid-cols-1 md:grid-cols-2`

Ver `docs/UI_UX_ENGINEERING.md` para más detalles sobre abstracciones y patrones.
