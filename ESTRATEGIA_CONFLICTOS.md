# Estrategia de conflictos — «gana el servidor»

**Semana 11 · SQLite, sincronización y trabajo sin conexión**
Documento breve exigido en §5.4 de la Guía 2.

## Decisión

Cuando la copia local y el servidor no coinciden, **el servidor es la fuente de verdad**. La app nunca impone un cambio local sobre el estado remoto: si la API rechaza una solicitud, el préstamo local se marca como conflicto y se le explica al usuario. Es una estrategia simple, predecible y suficiente, porque el servidor es quien conoce los ejemplares reales y las solicitudes activas.

## Por qué no otras estrategias

- **Gana el cliente:** podría aceptar préstamos sin ejemplares disponibles y romper la consistencia del catálogo.
- **Mezcla automática:** un préstamo no es un dato combinable; hay que decidir si existe o no.
- **Resolución manual del usuario:** traslada al estudiante una decisión que el servidor ya puede tomar con información completa.

La consistencia es **eventual**: durante un rato el teléfono y el servidor pueden diferir; al sincronizar convergen.

## Flujo completo

1. El estudiante solicita un libro **sin conexión**. La app guarda el préstamo en SQLite con `sync_state = 'pending'` y encola la operación en `outbox` (FIFO). La UI responde de inmediato.
2. Al volver la red (NetInfo) o al pasar la app a primer plano, se ejecuta la sincronización.
3. La cola se envía en orden con `POST /api/loans`, incluyendo un `clientRequestId` (UUID generado en el teléfono).
4. Respuestas posibles:
   - **200/201:** el préstamo del servidor reemplaza la copia local; la operación sale de la cola.
   - **409:** conflicto de negocio. El préstamo local se marca `conflict`, se guarda el mensaje y se saca de la cola.
   - **Sin red / 5xx / 429:** la operación se conserva y se reintenta en la próxima sincronización (máximo `MAX_ATTEMPTS = 5` para 5xx/429).
5. Después del envío se descargan los cambios del servidor: libros desde el cursor `updatedSince` y los préstamos del usuario.

## Idempotencia

Cada solicitud lleva un `clientRequestId` único. Si el teléfono pierde la respuesta después de enviar, el reintento envía el mismo identificador y el servidor devuelve la solicitud existente: **nunca se crean préstamos duplicados**. La cola también se escribe antes que el préstamo local, de modo que un cierre inesperado de la app no pierde la operación.

## Conflictos contemplados

| Código de la API | Situación | Mensaje al usuario | Acción de la app |
| --- | --- | --- | --- |
| `ALREADY_ACTIVE` | Ya existía una solicitud o préstamo activo de ese libro | «Ya tenías una solicitud o un préstamo activo de este libro.» | Marcar `conflict` y ofrecer **Descartar** |
| `NO_COPIES` | Otro estudiante tomó el último ejemplar mientras estaba sin conexión | «Cuando se envió tu solicitud ya no quedaban ejemplares disponibles.» | Marcar `conflict`, refrescar el catálogo y ofrecer **Descartar** |
| `NOT_FOUND` | El libro ya no existe en el catálogo | «El libro ya no existe en el catálogo.» | Marcar `conflict` y ofrecer **Descartar** |
| `FORBIDDEN` | La cuenta no tiene permiso para solicitar libros | «Tu cuenta no tiene permiso para solicitar libros.» | Marcar `conflict` y ofrecer **Descartar** |

En la tarjeta del préstamo, el estado **No se pudo solicitar** muestra el motivo y el botón **Descartar** (`src/components/loan-card.tsx`). Un conflicto no bloquea volver a intentarlo cuando el libro tenga stock.

## Consistencia e incrementalidad

- **Cursor con solapamiento:** se pide `updatedSince` un segundo antes del `serverTime` recibido. El upsert es idempotente, así que repetir el borde no duplica datos y evita perder cambios por diferencias de reloj (`CURSOR_OVERLAP_MS = 1000`).
- **Upsert:** libros y préstamos se insertan o actualizan por id; el servidor siempre prevalece.
- **Aislamiento por cuenta:** los préstamos y la cola pertenecen a un `owner.uid`. Si cambia el usuario, se descartan; al cerrar sesión se borran los datos privados. Nunca se envían solicitudes a nombre de otra cuenta.

## Pruebas que lo respaldan

| Prueba | Qué demuestra |
| --- | --- |
| `__tests__/sync-service.test.ts` | Cola FIFO, conflictos 409, reintentos, cursor incremental |
| `__tests__/offline-flow.test.ts` | Escenario completo: sin red → pendiente → reconexión → servidor; idempotencia tras perder la respuesta; conflicto `NO_COPIES` |
| `__tests__/database.test.ts` | Migraciones, repositorios y restricciones reales de SQLite |

## Escenarios manuales (Guía 2, §5.3)

- **A · Reconexión:** modo avión → solicitud guardada → vuelve la red → pasa a **Solicitado** y el contador de pendientes vuelve a 0.
- **B · Conflicto:** modo avión → solicitar Rayuela (1 ejemplar) → otro estudiante la obtiene → vuelve la red → mensaje «Cuando se envió tu solicitud ya no quedaban ejemplares disponibles» y el catálogo la muestra sin ejemplares.
- **C · Reintento sin duplicados:** perder la señal después de enviar y reintentar con el mismo `clientRequestId`; no aparecen dos préstamos.

> El registro de estas pruebas en el teléfono se lleva en `PRUEBAS_MANUALES.md`.
