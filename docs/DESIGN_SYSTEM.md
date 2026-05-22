# Zentral Tech Core — Design System

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

## Inputs

| Estado | Clases |
|---|---|
| Base | `bg-slate-950 text-slate-200 border border-slate-800 rounded-md` |
| Focus | `focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden` |
| Placeholder | `placeholder-slate-500` |

## Botones

| Tipo | Clases |
|---|---|
| Primario | `bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors rounded-md disabled:opacity-50` |
| Secundario | `border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors rounded-md` |

## Spinner

```jsx
<div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
```

## Iconos

| Propósito | SVG |
|---|---|
| Check éxito | `text-emerald-500`, círculo con palomita |
| Error / Advertencia | `text-rose-500`, círculo con tachada o signo de exclamación |
| Mostrar contraseña | ojo (ver login/reset-password) |
| Ocultar contraseña | ojo tachado (ver login/reset-password) |
