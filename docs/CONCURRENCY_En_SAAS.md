# Manejo de Concurrencia, Cuotas Atómicas y Arquitectura Multi-plan

Este documento describe la estrategia de ingeniería backend utilizada en Zentral para mitigar condiciones de carrera (*race conditions*) en el consumo de recursos, el diseño del motor multi-plan acumulativo y el funcionamiento del algoritmo distributivo de cuotas.

---

## ⚡ El Reto de la Concurrencia en Sistemas SaaS (Condiciones de Carrera)

En plataformas multi-inquilino de alta transaccionalidad, el control de límites (*quotas*) es un punto crítico de falla. El antipatrón tradicional de desarrollo se basa en un flujo secuencial desprotegido:

1. **Leer:** Consultar la cuota consumida actual (`usedQuota`) desde la base de datos.
2. **Validar:** Comprobar en la capa de aplicación si `usedQuota < monthlyQuota`.
3. **Ejecutar:** Realizar la operación pesada (ej. Llamar a la API de OCR o Gemini).
4. **Escribir:** Incrementar `usedQuota = usedQuota + 1`.

**El problema:** Si un operador abre múltiples pestañas o una empresa tiene a 5 operarios subiendo comprobantes simultáneamente en el mismo segundo, todas las lecturas concurrentes devolverán el mismo valor viejo de cuota. Como resultado, la aplicación autorizará operaciones por encima del límite contratado (*over-allocation*), generando pérdidas financieras directas por consumo descontrolado de APIs pagas de terceros.

---

## 💎 Solución: Mutaciones Atómicas con MongoDB (`findOneAndUpdate` + `$expr`)

Para neutralizar este problema sin recurrir a bloqueos de tabla pesados (*pessimistic locking*) o bases de datos relacionales con niveles de aislamiento serializables que degraden el rendimiento, Zentral delega la validación y el incremento en un **único paso atómico a nivel de motor de base de datos**.

Esto se logra mediante `findOneAndUpdate` utilizando condiciones basadas en expresiones lógicas de agregación (`$expr`):

```typescript
// Implementación conceptual del motor de consumo seguro en Zentral
export async function consumeQuota(workspaceId: string, moduleKey: string): Promise<boolean> {
  // Buscamos y actualizamos en una sola instrucción atómica
  const result = await ModuleSubscription.findOneAndUpdate(
    {
      workspace: workspaceId,
      moduleKey: moduleKey,
      status: 'active',
      // El motor valida que el incremento no supere el límite permitido en el mismo tick
      $expr: { $lt: ['$usedQuota', '$monthlyQuota'] }
    },
    { 
      // Si la condición se cumple, incrementa de inmediato
      $inc: { usedQuota: 1 } 
    },
    { 
      new: true, // Devuelve el documento modificado
      projection: { _id: 1 } 
    }
  );

  // Si result es null, significa que no hay cuota disponible o la suscripción no está activa
  return result !== null;
}
```

### Ventajas de este enfoque:
* **Inmunidad a hilos concurrentes:** MongoDB garantiza la atomicidad a nivel de documento. Si entran 10 peticiones simultáneas y solo queda 1 cupo, solo una transacción modificará la base de datos; las otras 9 fallarán inmediatamente en la condición `$expr` y devolverán `null`, bloqueando el acceso a las APIs externas de forma segura.
* **Footprint de memoria cero:** No se requieren bloqueos distribuidos complejos en memoria ram con Redis (*Redlock*) para esta operación base, manteniendo la arquitectura del micro-SaaS simple, ligera y veloz.

---

## 📊 Arquitectura Multi-plan Acumulativa

A diferencia de los SaaS tradicionales donde un plan reemplaza a otro (*tier upgrading*), Zentral implementa un **modelo de compras acumulativas mes a mes** a través de una relación de arreglos en el Workspace (`workspace.plans: Plan[]`).

### Reglas de Negocio del Motor:
* **El Plan Free como Ancla:** Todo workspace nace con el plan `Free` inyectado en su arreglo base. El sistema restringe que exista un máximo de una compra tipo `Free` activa por inquilino para evitar la explotación maliciosa de cuotas gratuitas.
* **Suma de Capacidades:** Si una empresa compra el plan *Premium* ($12/mes, con 500 consultas) y posteriormente adquiere otro plan *Premium* o *Premium Plus* dentro del mismo periodo, las capacidades operativas no se sobreescriben: **se acumulan**.
* **Usuarios Ilimitados (`maxUsers = 0`):** El sistema modela la infinidad de usuarios mediante el valor `0`. En los endpoints de verificación de usuarios del workspace, la lógica evalúa el límite de la siguiente manera:

```typescript
const isUnlimited = plans.some(p => p.maxUsers === 0);
const currentUsersCount = await User.countDocuments({ workspace: workspaceId });

if (!isUnlimited && currentUsersCount >= totalMaxUsers) {
  throw new Error("Límite de usuarios alcanzado para este workspace.");
}
```

## 🔄 Algoritmo de Recálculo Integral (`recalculateQuotas`)

Cada vez que un administrador compra un nuevo plan, cancela una suscripción o el superadmin altera las condiciones de un espacio de trabajo, se dispara el pipeline de sincronización de datos ubicado en `src/lib/purchase/recalculate-quotas.ts`.

### Flujo del Algoritmo:

1. **Recopilación Activa:** Consulta todas las compras válidas del workspace dentro del modelo `WorkspacePurchase` donde `status === 'active'`.
2. **Agrupación por Módulo:** Mapea el catálogo completo de módulos incluidos en cada uno de esos planes y calcula el acumulado total de `quota` y el nivel de `tier` más alto contratado.
3. **Protección a Cuentas Enterprise:** El algoritmo ejecuta un filtro estricto de exclusión (`tier: { $ne: 'enterprise' }`). Esto asegura que las suscripciones Enterprise personalizadas (creadas manualmente por el `superadmin` con cuotas a medida) queden completamente blindadas y no sean eliminadas ni alteradas por el proceso de sincronización automatizado de los planes estándar.
4. **Sincronización Atómica:** Actualiza o inserta (*upsert*) los documentos correspondientes en la colección `ModuleSubscription`, asegurando que la UI del dashboard del cliente refleje el consumo total sumado al instante mediante la ejecución de un `router.refresh()` forzado desde el cliente.

---

## 🪵 Consumo Dinámico "Oldest-First"

Cuando coexisten múltiples planes y suscripciones manuales Enterprise dentro del mismo workspace, la colección `ModuleSubscription` almacena índices compuestos independientes compartiendo el mismo `moduleKey` pero con diferentes `tier`.

Para optimizar el gasto de recursos del cliente, el helper interno de Zentral consume las cuotas bajo un orden cronológico y de prioridad lógica de capas (*Oldest-First*):

* **Filtro y Ordenamiento:** El sistema consulta las suscripciones activas del módulo requerido, ordenándolas de manera que los planes base e históricos (`free` / `premium`) se procesen primero en la cola de ejecución.
* **Consumo en Cascada:** Si el plan base se queda sin saldo, el puntero atómico salta automáticamente a la siguiente capa disponible (la suscripción de nivel `enterprise`), protegiendo el saldo premium personalizado del cliente hasta que sea estrictamente necesario consumirlo.