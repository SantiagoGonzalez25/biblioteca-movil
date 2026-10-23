# Registro de pruebas manuales — Guía 2

> **Alcance:** tablas de prueba de §3.3, §4.3, §5.3 y §6.5, más los criterios de evidencia §3.4, §4.4, §5.4 y §6.6 y la verificación de §7.2.
>
> Fecha de ejecución: 23/10/2026 · Dispositivo: Samsung Galaxy A35 · Versión de la app: expo57s

## 0. Cómo marcar este documento

Cada fila de las tablas es una prueba con su propia casilla en la columna **Resultado**:

1. Ejecuta la prueba en el teléfono.
2. Cambia `☐ Pendiente` por uno de estos estados:
   - `☑ OK` si cumple lo esperado.
   - `☒ Falla` si no cumple; agrega una nota breve.
   - `N/A` si no aplica; explica por qué.
3. Agrega la fecha y el archivo de evidencia en la misma celda, por ejemplo:
   `☑ OK · 21/10/2026 · evidencias/semana12/01-permiso-camara.png`
4. Si falla, adjunta la captura y describe el error en la columna **Evidencia**.
5. Al terminar, marca el checklist general y completa la fecha/dispositivo de la cabecera.

> Las tablas de Markdown no tienen casillas clicables: `☐`/`☑` son marcas visuales. Si prefieres casillas interactivas, usa el checklist general de abajo o una lista con `- [ ]` en tu editor.

### Checklist general

- [ ] Semana 9 — catálogo y API (§3.3)
- [ ] Semana 10 — sesión y rutas protegidas (§4.3)
- [ ] Semana 11 — escenario A: reconexión (§5.3)
- [ ] Semana 11 — escenario B: conflicto (§5.3)
- [ ] Semana 11 — cierre de sesión y limpieza local (§5.4)
- [ ] Semana 12 — cámara y portadas (§6.5)
- [ ] Semana 12 — manejo de fallos (§6.3)
- [ ] Criterios de evidencia (§3.4, §4.4, §5.4, §6.6)
- [ ] Evidencia del Hito 3 completa (§6.6)

## 1. Semana 9 — catálogo y API (§3.3)

| Escenario         | Cómo provocarlo                                                                        | Resultado esperado                                     | Resultado |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| Respuesta válida  | Abrir la app                                                                           | Aparecen los 10 libros                                 | ☑ OK      |
| Estado vacío      | Buscar `zzzz`                                                                          | Mensaje «Sin resultados»                               | ☑ OK      |
| Servidor apagado  | Detener la API y reabrir la app                                                        | Estado de error con botón **Reintentar**               | ☑ OK      |
| Reintento exitoso | Encender la API y tocar **Reintentar**                                                 | La lista aparece                                       | ☑ OK      |
| URL incorrecta    | Cambiar `EXPO_PUBLIC_API_URL` a una IP inexistente y reiniciar con `npx expo start -c` | Error de conexión en ≤ 10 s; la pantalla no se congela | ☑ OK      |
| Detalle           | Tocar un libro                                                                         | Portada, autor, año y disponibilidad                   | ☑ OK      |

> Los cuatro estados de §3.4: **carga** (al abrir la app), **vacío** (`zzzz`), **error** (API apagada o URL incorrecta) y **éxito** (lista con los 10 libros). La lista de criterios de §5.1 los verifica.

## 2. Semana 10 — sesión y rutas protegidas (§4.3)

| Escenario                                            | Resultado esperado                                   | Resultado |
| ---------------------------------------------------- | ---------------------------------------------------- | --------- |
| Abrir la app sin sesión                              | Pantalla de inicio de sesión                         | ☑ OK      |
| Registrar un estudiante nuevo                        | Entra al catálogo                                    | ☑ OK      |
| Registrar un correo ya usado                         | Mensaje «Ya existe una cuenta con ese correo»        | ☑ OK      |
| Contraseña de 5 caracteres en registro               | Error de validación en el campo, sin llamar a la API | ☑ OK      |
| Iniciar sesión, cerrar la app por completo y abrirla | Sigue con la sesión iniciada (también sin internet)  | ☑ OK      |
| Tocar **Salir**                                      | Vuelve al login                                      | ☑ OK      |
| Credenciales erróneas                                | Mensaje «Correo o contraseña incorrectos»            | ☑ OK      |
| Con la API apagada, intentar iniciar sesión          | Mensaje «No hay conexión con el servidor…»           | ☑ OK      |

## 3. Semana 11 — reconexión y conflictos (§5.3)

### Escenario A · Reconexión

1. Inicia sesión como estudiante con internet y espera a que cargue el catálogo.
2. Activa el modo avión: aparece el aviso **Sin conexión · Mostrando datos guardados**.
3. Abre un libro y pulsa **Solicitar préstamo**: aparece «Solicitud guardada… se enviará cuando vuelva internet».
4. En **Mis préstamos** la solicitud dice **Pendiente de envío**; en **Perfil**, **Cambios pendientes: 1**.
5. Desactiva el modo avión: en unos segundos pasa a **Solicitado** y el contador vuelve a 0.

| Comprobación                                                                           | Resultado |
| -------------------------------------------------------------------------------------- | --------- |
| Aviso **Sin conexión · Mostrando datos guardados** al activar modo avión               | ☑ OK      |
| Mensaje «Solicitud guardada… se enviará cuando vuelva internet»                        | ☑ OK      |
| En **Mis préstamos**: **Pendiente de envío**; en **Perfil**: **Cambios pendientes: 1** | ☑ OK      |
| Catálogo visible sin internet tras la primera sincronización                           | ☑ OK      |
| La solicitud pendiente se envía sola al volver la red                                  | ☑ OK      |
| Pasa a **Solicitado** y el contador vuelve a 0                                         | ☑ OK      |

### Escenario B · Conflicto

1. En el libro **Rayuela** (1 ejemplar), entra como estudiante con internet y espera la sincronización.
2. Activa el modo avión y solicita Rayuela: queda **Pendiente de envío**.
3. Desde otro dispositivo o el sitio web, entra como otro estudiante, solicita Rayuela y haz que el bibliotecario la apruebe. Ahora no quedan ejemplares.
4. Desactiva el modo avión en el primer teléfono: el servidor responde 409 `NO_COPIES`.
5. Resultado esperado: tu solicitud queda **No se pudo solicitar** con el motivo «Cuando se envió tu solicitud ya no quedaban ejemplares disponibles»; el catálogo muestra Rayuela sin ejemplares y puedes **Descartar** el aviso.

| Comprobación                                            | Resultado |
| ------------------------------------------------------- | --------- |
| El conflicto se muestra con el mensaje correcto         | ☑ OK      |
| El catálogo se actualiza con el stock real del servidor | ☑ OK      |
| **Descartar** elimina el aviso                          | ☑ OK      |

> Adjunta aquí el video corto o las capturas de los escenarios A y B (evidencia de §5.4).

### Cierre de sesión y limpieza local (§5.4)

1. Inicia sesión como estudiante y espera la sincronización.
2. Crea una solicitud sin conexión (modo avión) para que quede en la cola; no la envíes.
3. Ve a **Perfil** → **Cerrar sesión**: debe advertir que hay cambios pendientes.
4. Confirma y vuelve a iniciar sesión.
5. Comprueba que **Mis préstamos** está vacío y que **Cambios pendientes** es 0.

| Comprobación                                                 | Resultado |
| ------------------------------------------------------------ | --------- |
| Cerrar sesión borra préstamos y cola del teléfono            | ☑ OK      |
| La advertencia de cambios pendientes aparece antes de cerrar | ☑ OK      |

## 4. Semana 12 — cámara y portadas (§6.5)

| Comprobación                                                                           | Resultado |
| -------------------------------------------------------------------------------------- | --------- |
| Como bibliotecario, **Tomar foto** pide permiso la primera vez                         | ☑ OK      |
| Rechazar el permiso muestra la alerta y la galería sigue funcionando                   | ☑ OK      |
| Conceder el permiso abre la cámara; cancelar no produce errores                        | ☑ OK      |
| La portada tomada aparece en el detalle y en la lista de libros                        | ☑ OK      |
| Otro dispositivo ve la portada tras sincronizar                                        | ☑ OK      |
| Con modo avión, intentar subir muestra el mensaje de conexión (la acción no se encola) | ☑ OK      |
| Como estudiante no existen los botones de portada                                      | ☑ OK      |
| Perfil → **Actividad reciente** muestra los eventos `cover.*`                          | ☑ OK      |

### 4.1 Manejo de fallos adicionales (§6.3)

| Comprobación                                                                 | Resultado |
| ---------------------------------------------------------------------------- | --------- |
| Permiso denegado definitivamente: alerta con botón **Abrir ajustes**         | N/A       |
| Imagen demasiado grande tras comprimir: mensaje pidiendo otra imagen         | N/A       |
| El servidor rechaza el archivo (400/403): se muestra el mensaje del servidor | N/A       |
| La bitácora de actividad no guarda la imagen, tokens ni datos personales     | N/A       |

> La cámara no se puede probar en un simulador iOS; usa un teléfono real. Adjunta las capturas en `evidencias/semana12/` (lista de archivos en `evidencias/semana12/README.md`). El flujo, permisos y manejo de fallos están documentados en `SERVICIO_FOTOS.md`.

## 5. Criterios de evidencia de la guía (§3.4, §4.4, §5.4, §6.6)

> Esta sección reúne los criterios que la guía pide como evidencia. Algunos se comprueban en el teléfono y otros en el código, en SQLite o con Jest; no todos son «pruebas manuales», pero no se deben saltar. Las pruebas automáticas no sustituyen las pruebas en un teléfono real (Guía §7.3).

### 5.1 Semana 9 — §3.4

- [ ] Repositorio con la lista y el detalle consumiendo la API.
- [ ] Configuración por ambiente (`.env.example`).
- [ ] La URL de la API no está escrita en ningún archivo `.ts`: se lee de `EXPO_PUBLIC_API_URL`; el único valor por defecto es `http://localhost:3000` para el simulador, igual que en la guía.
- [ ] Cada fallo de red muestra un mensaje comprensible y nunca deja la pantalla en blanco (servidor apagado, URL incorrecta, modo avión).
- [ ] Hay botón de reintento.
- [ ] La petición no queda colgada más de 10 segundos (`REQUEST_TIMEOUT_MS = 10_000`).
- [ ] Los cuatro estados son visibles y están probados: **carga** (al abrir), **vacío** (`zzzz`), **error** (API apagada/URL incorrecta) y **éxito** (lista con los 10 libros).
- [ ] Tabla de pruebas manuales completada (este documento).
- [ ] `npm test` en verde.
- [ ] Entrada de la bitácora de IA (`BITACORA_IA.md`).

### 5.2 Semana 10 — §4.4

- [ ] Flujo de registro, inicio y cierre de sesión funcionando (tabla §2).
- [ ] Ningún token ni contraseña aparece en la consola ni en SQLite (tokens en `expo-secure-store`; SQLite no tiene columnas de token).
- [ ] La sesión sobrevive al reinicio de la app.
- [ ] Un 401 provoca renovación y reintento, no una pantalla de error (cubierto por `api-client.test.ts`, `session-manager.test.ts` y el E2E opcional).
- [ ] No queda ninguna credencial en el código ni en el `.env` de la app (solo `EXPO_PUBLIC_API_URL`; las credenciales de prueba se pasan como `E2E_*` en el shell).
- [ ] Las rutas están protegidas: sin sesión no se entra al catálogo; al salir se vuelve al login.
- [ ] `MODELO_AMENAZAS.md` completado.
- [ ] `BITACORA_IA.md` con al menos una sugerencia contrastada contra los requisitos de seguridad.
- [ ] Pruebas de sesión en verde (`npm test`).

### 5.3 Semana 11 — §5.4

- [ ] La app arranca y muestra el catálogo sin internet después de la primera sincronización.
- [ ] Una solicitud hecha sin conexión se envía sola al volver la red.
- [ ] Reintentar nunca crea préstamos duplicados (Escenario C; `offline-flow.test.ts`).
- [ ] Un conflicto se explica al usuario con un mensaje claro.
- [ ] Cerrar sesión borra préstamos y cola del teléfono.
- [ ] Migraciones y repositorios probados (`database.test.ts`).
- [ ] `ESTRATEGIA_CONFLICTOS.md` con la justificación de «gana el servidor».
- [ ] Video corto o capturas de los escenarios A y B.
- [ ] Pruebas de sincronización en verde (`npm test`).

### 5.4 Hito 3 — §6.6

- [ ] App integrada con API REST, autenticación, SecureStore, SQLite, sincronización, conectividad y servicio del dispositivo.
- [ ] Pruebas de escenarios críticos y documentación.
- [ ] Sustentación individual preparada:
  - [ ] Cómo viaja una solicitud de préstamo desde el toque del botón hasta Firestore y qué pasa si falla cada tramo.
  - [ ] Por qué los tokens están en SecureStore y qué ocurre con un 401.
  - [ ] Qué es `clientRequestId` y qué problema resuelve.
  - [ ] Qué pasa con una solicitud hecha sin conexión cuando el ejemplar se agota.
  - [ ] Cómo agregarías una columna a `books` con una migración nueva.
  - [ ] Preguntas de cámara/portada de `SERVICIO_FOTOS.md` §9.
- [ ] `BITACORA_IA.md` con la entrada del Hito 3.
- [ ] `npm run typecheck`, `npx expo lint` y `npm test` sin errores (§7.2).
- [ ] `npx expo export --platform android` sin errores.
- [ ] E2E opcional: `npx jest e2e-api` con `E2E_*`; verifica el flujo estudiante → bibliotecario → estudiante y la recuperación de un 401 (si no se configuran, se omite por diseño).

## 6. Evidencia del Hito 3 (§6.6)

- [ ] Repositorio del proyecto con el código y la documentación.
- [ ] `.env.example` con la configuración por ambiente.
- [ ] `BITACORA_IA.md` con el registro de uso de IA.
- [ ] `MODELO_AMENAZAS.md` con la tabla completada.
- [ ] `ESTRATEGIA_CONFLICTOS.md` con la justificación de «gana el servidor».
- [ ] `SERVICIO_FOTOS.md` con el apartado de cámara, permisos y portadas.
- [ ] Este registro completado con las pruebas en un teléfono real.
- [ ] Video o capturas de los escenarios A y B.
- [ ] Capturas de la semana 12 en `evidencias/semana12/` (permiso, cámara, portada, modo avión, estudiante y actividad).
- [ ] Sustentación individual preparada (preguntas de §5.4).
- [ ] `npm run typecheck`, `npx expo lint`, `npm test` y `npx expo export --platform android` en verde.
