# Pipeline de Integraciones, Extracción con IA y Automatización de Correo

Este documento describe en profundidad el flujo de ingeniería detrás del módulo **TransferCheck**, detallando el pipeline de extracción híbrido (OCR + LLM), el esquema de seguridad para integraciones OAuth2 con Google y los algoritmos de normalización de datos.

---

## 🧾 El Flujo General del Motor de Conciliación

El propósito de `TransferCheck` es eliminar la verificación manual de transferencias bancarias. El sistema automatiza el ciclo cruzando un comprobante visual contra los registros reales de la cuenta bancaria notificados por correo electrónico.

```text
[Comprobante Inmueble / Foto] 
       │
       ▼
 ┌───────────┐      Fallo o                                ┌─────────────────────┐
 │ OCR.space            │ ────────────────> │ Gemini 2.0 Fallback                          │
 └───────────┘    Baja Certeza                         └─────────────────────┘
       │                                                                                                      │
       └─────────────────┬──────────────────┘
                                                          │ Extraction JSON {monto, referencia, fecha}
                                                         ▼
             ┌───────────────────────┐
             │  TransferCheckLog                                 │ ➔ Estado: 'pending_email'
             └───────────────────────┘
                                                         │
                                                        ▼
             ┌───────────────────────┐
             │ Query Automatizada                               │ ➔ Filtro: gmail.readonly
             │ en la API de Gmail                                  │   Busca variaciones de monto/ref
             └───────────────────────┘
                                                 │
            ┌────────────┴────────────┐
            ▼                                                                     ▼
     [Match Exitoso]                                        [Sin Coincidencia]
    status: 'matched'                                       status: 'pending_email'
                                                                    (Espera Sync o Manual)
```

## 🤖 Pipeline de Extracción Híbrido: Resiliencia y Mitigación de Fallos

Para optimizar costos y garantizar una disponibilidad del 99.9%, Zentral implementa una estrategia de **Degradación Elegante (*Graceful Degradation*)** en dos capas lógicas dentro de `src/lib/extractor/extractor.ts`:

### Capa 1: Procesamiento Ligero (OCR Estructural)
* **Tecnología:** OCR.space API.
* **Mecánica:** La imagen se envía directamente al motor para realizar un reconocimiento óptico de caracteres clásico. El sistema analiza la respuesta buscando patrones textuales clave.
* **Ventaja:** Bajo costo operativo y tiempo de respuesta ultra-rápido en imágenes de alta resolución y tipografía limpia.

### Capa 2: Conmutación en Caliente (*Fallback* con LLM)
* **Tecnología:** Google Generative AI (`gemini-2.0-flash`).
* **Activación:** Si la API de OCR devuelve un string vacío, arroja un código de error de red, o el parser interno no logra deducir un formato numérico válido para el monto, el pipeline conmuta inmediatamente a Gemini.
* **Procesamiento Seguro en Memoria:** Zentral convierte la imagen cargada en un `Buffer` y la transforma a `Base64` en tiempo de ejecución. La data se envía directamente en el payload de la petición HTTP a Google Cloud. **No hay persistencia en disco duro**, lo que anula los riesgos de filtración de datos sensibles y reduce la latencia de I/O.
* **Estructuración Estricta:** Se alimenta al modelo con un *System Prompt* optimizado para forzar una respuesta en formato JSON puro, sin decoraciones de Markdown, mapeando estrictamente la estructura requerida:

```json
{
  "monto": 173000.00,
  "referencia": "9827410293",
  "fecha": "2026-05-27T20:15:00.000Z"
}
```

## 🔐 Integración Descentralizada con Gmail OAuth2

Para que el sistema busque los correos de confirmación, cada Workspace debe conectar su propia cuenta de correo institucional. Esto plantea un reto crítico de seguridad: almacenar tokens de acceso de terceros de forma masiva sin comprometer la integridad del sistema.

### 1. Principio de Privilegio Mínimo
Zentral restringe estrictamente el alcance de la integración solicitando únicamente el scope `https://www.googleapis.com/auth/gmail.readonly`. El sistema está diseñado exclusivamente para auditar entradas; el código fuente no posee capacidades ni permisos para redactar, modificar, enviar o eliminar correos electrónicos del usuario.

### 2. Cifrado en Reposo de Tokens Corporativos (`WorkspaceSettings`)
Almacenar un `refresh_token` en texto plano en la base de datos es una vulnerabilidad crítica de seguridad. Si la base de datos se ve comprometida, un atacante obtendría acceso perpetuo a los buzones de correo de todos los clientes del SaaS.

* **Solución:** Zentral cifra el `gmailRefreshToken` antes de persistirlo en MongoDB utilizando el algoritmo criptográfico simétrico **AES-256-CBC**.
* **Implementación:** Se utiliza una clave secreta única del lado del servidor gestionada a través de las variables de entorno (`crypto.createCipheriv`). El Vector de Inicialización (IV) se genera de forma aleatoria por cada inserción y se almacena junto al string cifrado, garantizando que el mismo token guardado en dos registros diferentes genere outputs totalmente dispares en la base de datos.

### 3. Ciclo de Vida Autónomo de Tokens
Dado que los `access_token` de Google expiran cada 3600 segundos (1 hora), el motor de Zentral intercepta de forma transparente las llamadas de sincronización. Si la fecha actual supera a `gmailTokenExpiry`, el sistema utiliza de forma automática el `gmailRefreshToken` cifrado para negociar un nuevo token de acceso con los servidores de Google, actualizando el registro en la base de datos sin molestar al usuario con flujos de re-autenticación recurrentes en la UI.

---

## 🧮 Algoritmo de Normalización y Coincidencia Lineal

El reto más complejo después de extraer los datos es la variabilidad de formatos de los comprobantes. Las notificaciones de los bancos colombianos e internacionales formatean los números y las referencias de maneras totalmente dispares (ej. un mismo monto puede reportarse como `173.000`, `173000.00` o `$173,000`).

### Estrategia de Invariabilidad Numérica
Para evitar falsos negativos en el cruce de datos, el script de sincronización (`sync-email.ts`) normaliza los inputs a tipos de datos primitivos de JavaScript antes de ejecutar las queries de búsqueda de Gmail:

* **Limpieza de Caracteres Especiales:** Filtra y remueve símbolos de moneda (`$`, `€`, `COP`), espacios en blanco, comas de decoración y guiones.
* **Estandarización de Decimales:** Identifica si el separador de miles es un punto o una coma según el contexto geográfico estándar (formato CO vs. Internacional), convirtiendo cualquier valor textual en un formato numérico plano de punto flotante (`float`).
* **Query de Búsqueda Avanzada:** En lugar de descargar miles de correos y filtrarlos en la memoria de la aplicación (lo que colapsaría el rendimiento del servidor a escala), Zentral traduce los datos extraídos en una query de búsqueda nativa de Gmail que se ejecuta directamente en los servidores indexados de Google:

```text
label:INBOX "173000" "9827410293" after:2026/05/20
```

* **Manejo de Ventanas de Tiempo**: El algoritmo restringe la búsqueda a correos recibidos en una ventana de tolerancia temporal cercana a la fecha de emisión del comprobante, mitigando colisiones con transferencias históricas que compartan montos idénticos.

