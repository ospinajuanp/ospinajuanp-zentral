# Zentral — Plataforma Micro-SaaS para Operaciones Empresariales B2B

Zentral es un ecosistema modular e inquilinato múltiple (Multi-tenant) diseñado para optimizar flujos críticos de operaciones empresariales B2B. El núcleo de la plataforma permite la ejecución y validación de módulos independientes (como conciliación de pagos e IA en tiempo real), completamente aislados por entorno de trabajo (*workspace*), controlados por un robusto sistema de límites atómicos y gobernados por políticas de acceso basadas en roles (RBAC) interceptadas en el Edge.

Construido sobre **Next.js 16 (App Router)**, **React 19** y **Tailwind CSS v4**, el sistema está pensado para ofrecer escalabilidad vertical, alta densidad de datos en la UI y máxima resiliencia ante fallos de APIs externas.

---

## 🛠️ Desglose Arquitectónico y Retos de Ingeniería Solucionados

### 1. Control de Cuotas Atómico y Mitigación de Condiciones de Carrera (Race Conditions)
En un SaaS multi-usuario concurrente, los enfoques tradicionales de lectura y posterior actualización de cuotas rompen la integridad de los datos si múltiples operarios realizan acciones en paralelo. 
* **Solución:** Zentral implementa mutaciones atómicas directas en MongoDB utilizando `findOneAndUpdate` combinado con el operador lógico `$expr`. El sistema evalúa la disponibilidad del cupo (`usedQuota < monthlyQuota`) y realiza el incremento de consumo en una única operación atómica a nivel de base de datos, garantizando consistencia absoluta sin bloqueos pesados de tablas.
* **Consumo Eficiente:** El motor implementa una estrategia de consumo de cuotas *Oldest-First*, agotando automáticamente los recursos de los planes base contratados antes de afectar las cuotas de las suscripciones Enterprise personalizadas.

### 2. Pipeline Resiliente de Extracción con IA (Estrategia de Fallback en Caliente)
El módulo principal `TransferCheck` procesa comprobantes de transferencias bancarias de forma síncrona/asíncrona y los cruza con la API de Gmail en modo lectura.
* **Degradación Elegante (*Graceful Degradation*):** La aplicación procesa la imagen a través de un motor ligero y de bajo costo (OCR.space) que parsea monedas en formatos colombianos e internacionales. Si el servicio excede su cuota o falla en la lectura del texto, Zentral conmuta en caliente (Fallback directo) hacia un LLM avanzado (**Gemini 2.0 Flash**), procesando el archivo en forma de buffers en memoria base64, garantizando que el usuario final nunca experimente una interrupción del servicio y protegiendo la privacidad al evitar persistencia en disco duro.

### 3. Seguridad Zero-Trust y Aislamiento Estricto de Datos (Multi-tenancy)
La filtración accidental de datos entre empresas es el riesgo número uno en arquitecturas de software multi-tenant.
* **Edge Proxy Interceptor:** Un middleware ligero en el Edge (`src/proxy.ts`) intercepta todas las peticiones utilizando criptografía compacta (`jose` para JWT) sobre cookies `httpOnly` con políticas `SameSite=Strict`. Este proxy valida la firma, extrae el contexto seguro e inyecta headers limpios (`x-workspace-id`, `x-user-role`) hacia las rutas protegidas.
* **Workspace Isolation:** La base de datos no expone consultas globales en las capas operativas; cada consulta Mongoose está acoplada al contexto inyectado por el middleware, asegurando que un workspace jamás pueda leer, escribir o deducir información de un inquilino ajeno.

### 4. Abstracción Avanzada de UI y Economía de Componentes
Para evitar la repetición de lógica transaccional, estados de carga y layouts repetitivos en las vistas administrativas distribuidas entre Superadmin y Workspace Owners:
* **Solución:** Se diseñó una infraestructura compuesta por el hook genérico de TypeScript `usePaginatedData<T>()` en tándem con un componente reutilizable `<DataTable>`. Esta capa extrajo y unificó el manejo de estados de carga, paginación reactiva dinámica (selectores de 5 a 100 filas) y fallos en 5 páginas críticas del sistema, eliminando más de 450 líneas de código duplicado y acelerando el desarrollo de futuros módulos.

---

## ⚙️ Tech Stack & Justificación Técnica

* **Next.js 16.2 (App Router & Turbopack):** Elegido para la unificación del pipeline full-stack, optimización extrema de compilación en desarrollo y soporte nativo para ejecución distribuida en el Edge.
* **React 19.2 & Tailwind CSS v4:** Aprovechamiento del compilador nativo de React, manejo optimizado de referencias web y una interfaz densa en datos con una paleta oscura profesional (`slate-950/900`) optimizada para flujos B2B operativos.
* **MongoDB (Mongoose 9.6):** Base de datos indexada con índices compuestos nativos en modelos de uso intensivo (`User`, `WorkspacePurchase`, `TransferCheckLog`) para garantizar búsquedas en sub-milisegundos.
* **Upstash Redis:** Capa de Rate Limiting que implementa ventanas fijas (*Fixed Window*) para blindar rutas críticas de autenticación y transacciones (`25 peticiones / 5 minutos`), mitigando ataques de fuerza bruta con bypass automático tolerante a fallos de conexión.
* **Resend & Gmail OAuth2:** Flujo asíncrono para correos transaccionales y conexión OAuth descentralizada por Workspace bajo el scope estricto `gmail.readonly` para seguridad del usuario final.

---

## 📂 Mapa de Documentación Especializada

Para auditar a fondo la implementación técnica y decisiones arquitectónicas del sistema, navega por los siguientes módulos de documentación interna:

* [🏛️ Arquitectura, Seguridad y RBAC](docs/ARCHITECTURE.md) — Detalle del Edge Proxy, ciclo de vida del JWT y aislamiento Multi-tenant.
* [📊 Concurrencia, Cuotas y Compras Multi-plan](docs/CONCURRENCY_En_SAAS.md) — Análisis del motor de cuotas atómico y el recálculo masivo de suscripciones activas.
* [🤖 Pipeline de Integración de IA y Mensajería](docs/INTEGRATIONS_PIPELINE.md) — Flujo paso a paso del motor de extracción inteligente, fallback de Gemini y queries OAuth con Gmail.
* [🎨 Ingeniería de Frontend y Patrones Reutilizables](docs/UI_UX_ENGINEERING.md) — Abstracción de hooks de TypeScript, optimizaciones del Carrusel Embla sin ResizeObserver y accesibilidad (A11y).

---

## 🚀 Instalación y Despliegue Rápido

### Prerrequisitos
* Node.js >= 18
* Gestor de paquetes `pnpm`
* Instancia de MongoDB (Local o Atlas)

### Configuración del Entorno

1. Clona el repositorio e instala las dependencias:
   ```bash
   pnpm install
    ```
2. Configura las variables de entorno creando un archivo .env.local en la raíz del proyecto:

  ```bash
  MONGO_URL=mongodb+srv://.../zentral
  JWT_SECRET=tu_firma_secreta_jwt
  RESEND_API_KEY=re_...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  KV_REST_API_URL=[https://...upstash.io](https://...upstash.io)
  KV_REST_API_TOKEN=...
  GEMINI_API_KEY=AIza...
  OCR_SPACE_API_KEY=...
  GMAIL_CLIENT_ID=...apps.googleusercontent.com
  GMAIL_CLIENT_SECRET=...
  GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
  ```


3. Ejecuta el script de inicialización para poblar la base de datos con módulos, planes base y usuarios de prueba (Superadmin, Workspace Admins y Operadores):

```bash
pnpm run seed
```

4. Enciende el servidor de desarrollo:


```bash
pnpm run dev
```

## 📄 Licencia
Copyright (c) 2026 Juan Pablo Ospina. Todos los derechos reservados.
El código fuente está visible con fines de auditoría técnica y portafolio profesional. 
No se permite la reproducción, distribución o uso comercial de este software sin autorización expresa del autor.