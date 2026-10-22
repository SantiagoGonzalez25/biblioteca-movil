# Bitácora de uso de IA generativa — library_app

**Proyecto:** `library_app` — App móvil de la Biblioteca (Expo SDK 57 · React Native 0.86 · TypeScript)
**Asignatura:** Desarrollo Móvil (PREISESP17015) · Unidad 03 · Semanas 9 a 12
**Herramienta de IA:** asistente de código (OpenCode) integrado en el editor, con revisión humana permanente
**Documento:** cumple la sección 9 de la Guía 2 («Bitácora de uso de IA generativa») y forma parte de la evidencia del Hito 3
**Última actualización:** 21/10/2026

> **Regla de oro del proyecto (Guía 2, §9).** La IA se usó para explorar, explicar, depurar, generar casos de prueba y documentar. La arquitectura y las decisiones fueron del autor; cada línea entregada fue revisada, contrastada y es explicable y modificable sin el asistente.

---

## 1. Estrategia de control: el archivo `AGENTS.md`

Antes de escribir una sola línea de código se creó un archivo de directrices estrictas (`AGENTS.md`, importado también desde `CLAUDE.md`) como **contrato de trabajo** para el asistente de IA. Su objetivo era triple:

1. **Limitar las respuestas** del modelo al alcance de cada tarea.
2. **Obligar a usar la arquitectura base** ya definida por la guía: los componentes `Screen`, `ThemedText` y `Button` más el tema central (`theme.ts`). Cada pantalla se compone con esos bloques; no se permiten estilos sueltos ni componentes improvisados.
3. **Evitar alucinaciones**, en particular la mezcla de código web con React Native: nada de patrones de React DOM, CSS ni librerías de navegador ("código web") dentro de la app.

Reglas clave que fija el archivo:

- **«Expo ha cambiado: no confíes en tu memoria.»** Antes de tocar cualquier API de Expo/EAS, se debe leer la versión mayor de `expo` en `package.json` y consultar la documentación oficial versionada (`docs.expo.dev/versions/v<versión>`) y el índice `docs.expo.dev/llms.txt`. Esto eliminó de raíz las propuestas de APIs inventadas o renombradas.
- **Comandos canónicos.** Instalar siempre con `npx expo install` (nunca `npm/yarn/pnpm add` suelto, que rompe la compatibilidad del SDK). Cerrar cada tarea obligatoriamente con `npx expo lint` y `npx tsc --noEmit` en verde.
- **Navegación y estructura.** Todo con Expo Router: rutas en `src/app/`, `_layout.tsx` para navegadores, y el código no-ruta (componentes, hooks, utilidades) fuera de `src/app/`.
- **Proyecto gestionado (CNG).** No crear ni editar `ios/` y `android/` a mano: la configuración nativa va en `app.json` y plugins de config.
- **Módulos recomendados.** Preferir módulos de Expo antes que dependencias de terceros.

El efecto práctico fue un asistente **acotado y verificable**: respuestas cortas atadas al stack real, cero dependencias inventadas, comandos correctos de Expo y un criterio de "terminado" que no era una afirmación sino dos comandos ejecutados. Sobre esa base se construyó el resto por fases.

---

## 2. Desarrollo iterativo por fases

Nunca se le pasó la guía completa de golpe al asistente. La unidad se dividió en **fases con objetivo, alcance y criterio de aceptación**, y cada fase se cerraba con los comandos de control en verde antes de abrir la siguiente. Así el contexto del modelo se mantuvo pequeño, cada respuesta fue revisable y cada fase dejó evidencia propia en el repositorio.

Antes de la Fase 1 hubo una **Fase 0 de preparación**: limpieza de los archivos de ejemplo de la plantilla y creación de la base de interfaz (tema + `Screen`/`ThemedText`/`Button`), punto de partida de todas las pantallas.

| Fase | Alcance | Semanas de la guía | Resultado principal en el repositorio |
| --- | --- | --- | --- |
| **1. Interfaces y servicios HTTP** | Tipos, cliente de API, manejo de errores, estados de pantalla, lista y detalle | 9 | `src/types/`, `src/services/api/client.ts` (timeout 10 s, errores tipados), `state-views.tsx`, componentes de catálogo y detalle |
| **2. Estado global** | Estado global, persistencia local y sincronización offline | 11 | `AuthProvider`, `DataProvider`, SQLite con migraciones, repositorios, cola de salida (outbox) y servicio de sincronización |
| **3. Interfaz visual** | Pantallas completas con la arquitectura base | 9–11 | Pestañas Catálogo / Préstamos / Perfil, detalle de libro, banner de conexión y tarjetas, todo con `Screen`/`ThemedText`/`Button` |
| **4. Autenticación** | Registro, inicio y cierre de sesión, rutas protegidas | 10 | Sesión con tokens en `expo-secure-store`, validaciones, `Stack.Protected` y refresco automático ante 401 |

**Decisiones destacadas dentro de las fases:**

- **Fase 2 — evaluación y descarte de Zustand.** Se evaluó usar *Zustand* para el estado global (el patrón más común en aplicaciones React/Web). Se descartó: la guía fija React Context + `expo-sqlite` para el estado, la persistencia y la cola de sincronización, y añadir una librería externa de estado habría duplicado responsabilidades y roto esa arquitectura. Se implementó con `AuthProvider` / `DataProvider`, sin dependencias extra.
- **Estrategia de avance al estado final.** Se propuso crear los archivos provisionales de la semana 9 (login de desarrollo con credenciales en `.env`). Se contrastó con la propia guía —que los elimina en las semanas siguientes— y se **rechazó**: se construyó directamente el estado final, sin credenciales embebidas en ningún archivo.
- **Seguridad de la sesión (Fase 4).** Se descartó guardar tokens con almacenamiento no seguro (AsyncStorage / SQLite): tokens únicamente en `expo-secure-store`, nunca en registros ni en el código, y ante un 401 se renueva y se reintenta una vez sin dejar la pantalla en error.

---

## 3. Ejemplos de prompts que dirigieron cada fase

Los siguientes son los prompts representativos (versión resumida y fiel al estilo) con los que se dirigió el trabajo; todos comparten la misma disciplina: una sola fase por prompt, leer `AGENTS.md` primero, no salirse del alcance y cerrar con verificación.

**Marco de trabajo (prompt inicial):**

> «Vas a trabajar en `library_app`. Lee `AGENTS.md` y úsalo como regla de trabajo permanente. Toma el PDF de la guía como única fuente de verdad. No escribas código todavía: propón el plan por fases con archivos y criterios de aceptación por fase.»

**Fase 1 — Interfaces y servicios HTTP:**

> «Ejecuta exclusivamente la Fase 1: interfaces y servicios HTTP. Lee `AGENTS.md` antes de escribir nada. No avances a la interfaz visual ni a autenticación. Al terminar, ejecuta `npm run typecheck` y `npx expo lint` y muéstrame la salida.»

**Fase 2 — Estado global y persistencia:**

> «Fase 2: estado global y persistencia offline. Antes de proponer, evalúa Zustand frente a lo que exige la guía; debe prevalecer la guía (React Context + expo-sqlite). Implementa solo los providers, la base de datos y la cola de sincronización. No toques las pantallas.»

**Fase 3 — Interfaz visual:**

> «Fase 3: interfaz visual. Usa exclusivamente los componentes base `Screen`, `ThemedText` y `Button` con el tema existente. Nada de estilos sueltos ni patrones de web. Si necesitas un componente nuevo, propónmelo antes de crearlo.»

**Fase 4 — Autenticación:**

> «Fase 4: autenticación. Tokens únicamente en `expo-secure-store`: nunca en SQLite, AsyncStorage, consola ni código. Maneja el 401 con renovación y un reintento. Rutas protegidas con `Stack.Protected`. Cierra ejecutando las pruebas de sesión.»

**Prompt de auditoría (entre fases):**

> «Audita lo implementado contra el PDF: lista las diferencias entre el estado actual y lo que exige la guía. No modifiques nada; solo reporta.»

---

## 4. Registro de uso de IA (formato de la sección 9)

El microcurrículo exige registrar cada uso de IA con **propósito, evidencia, validación y decisión**. Este es el registro del proyecto:

| Fecha | Herramienta y prompt (resumido) | Qué respondió | Cómo lo validé | Decisión |
| --- | --- | --- | --- | --- |
| Sem. 9 | OpenCode · «Genera las interfaces TS y el cliente HTTP con timeout y errores tipados» | Tipos, cliente con timeout de 10 s y errores tipados, y vistas de estado (carga, vacío, error con botón Reintentar) | Contraste con PDF §3.1–3.2; `npm run typecheck` en verde | **Aceptada** |
| Sem. 9 | OpenCode · «Crea los archivos provisionales de la semana 9 (login de desarrollo)» | Archivos con credenciales de desarrollo en `.env` (`EXPO_PUBLIC_DEV_*`) | Contraste con la guía: las semanas 10–12 eliminan y reemplazan esos archivos | **Rechazada** — se construyó directo el estado final, sin credenciales embebidas |
| Sem. 10 | OpenCode · «¿Dónde guardo el refreshToken en Expo?» | Sugerencia inicial: AsyncStorage (almacenamiento simple, patrón histórico de React) | Contraste con MASVS y documentación de Expo: AsyncStorage no es almacenamiento seguro (PDF §4.4) | **Rechazada** — tokens con `expo-secure-store`, nunca en SQLite ni en consola |
| Sem. 10 | OpenCode · «Implementa registro, inicio y cierre de sesión con refresco automático» | Flujo completo de sesión: validaciones de formulario, `Stack.Protected` y renovación ante 401 con un solo reintento | Pruebas de sesión de Jest en verde; criterios de seguridad §4.4 revisados | **Aceptada** |
| Sem. 11 | OpenCode · «Usa Zustand para el estado global» | Propuesta de librería externa de estado (patrón común en web) | Contraste con la arquitectura de la guía (§5): Context + `expo-sqlite` + cola offline son el patrón fijado | **Rechazada** — React Context (`AuthProvider`/`DataProvider`), sin dependencias extra |
| Sem. 11 | OpenCode · «Genera los casos de prueba de la cola offline y la sincronización» | Batería de casos con dobles de prueba y SQLite de Node (conflictos 409, reintentos, cursor de sincronización) | Ejecuté `npm test` hasta el verde: 66 aprobadas, 3 omitidas por diseño | **Aceptada** |
| Transversal | OpenCode · «Depura por qué Jest no resuelve un módulo importado con el alias `@/`» | Faltaba un mapeo en `moduleNameMapper` para `@/assets/*` | `npm test` en verde tras el ajuste | **Aceptada con ajuste** |
| Sem. 12 | OpenCode · «Integra cámara/galería para subir la portada del libro» | Servicio de portadas con ImagePicker + ImageManipulator y permisos declarados en `app.json` (micrófono desactivado) | Contraste con la Guía 2 §6 y el código real; documentado en `SERVICIO_FOTOS.md`; pruebas en verde | **Aceptada** |
| Cierre | OpenCode · «Ejecuta la verificación completa antes de entregar» | Comandos y salidas de verificación | Typecheck sin errores; lint limpio; 66 pruebas aprobadas; empaquetado Android correcto | **Aceptada** — la prueba contra API real queda opcional vía variables `E2E_*`, fuera del repositorio |
| Cierre | OpenCode · «Audita la evidencia del repositorio contra la Guía 2» | Faltaban el modelo de amenazas y el documento de estrategia de conflictos; el README seguía siendo la plantilla | Contrasté §4.4 y §5.4 del PDF y revisé el código real antes de redactarlos | **Aceptada** — se crearon MODELO_AMENAZAS.md, ESTRATEGIA_CONFLICTOS.md, PRUEBAS_MANUALES.md y el README del proyecto |
| Cierre | OpenCode · «Audita PRUEBAS_MANUALES.md contra la guía, sin saltar nada» | Faltaban el escenario C, la limpieza al cerrar sesión, los criterios §3.4/§4.4/§5.4/§6.6, los fallos de §6.3 y la verificación §7 | Contraste sección por sección con el PDF y el código; se añadieron las filas y checklists | **Aceptada** |

---

## 5. Buenas prácticas aplicadas (según §9 de la guía)

- **Sin credenciales.** Nunca se pegaron contraseñas, tokens ni el contenido real de `.env` en los prompts. La configuración por ambiente vive en `.env` (nunca versionado) y `.env.example` documenta las variables sin secretos; las pruebas de integración contra la API real se activan solo con variables `E2E_*` definidas fuera del repositorio.
- **Contraste obligatorio.** Toda respuesta se validó contra el PDF de la guía y documentación oficial: docs de Expo versionadas, MASVS (seguridad móvil), documentación de SecureStore y SQLite.
- **Validación ejecutable.** Cada fase cerró con `npm run typecheck`, `npx expo lint` y `npm test`; la integración final con `npx expo export`.
- **Evidencia conservada.** Salidas de comandos, suite de pruebas del repositorio, este documento, `MODELO_AMENAZAS.md`, `ESTRATEGIA_CONFLICTOS.md` y `PRUEBAS_MANUALES.md`.

## 6. Verificación final (evidencia)

| Verificación | Comando | Resultado |
| --- | --- | --- |
| Tipos | `npm run typecheck` | Sin errores |
| Estilo | `npx expo lint` | Sin advertencias |
| Pruebas | `npm test` | 66 aprobadas · 3 omitidas por diseño (integración E2E opcional) |
| Empaquetado | `npx expo export --platform android` | Export correcto (Android) |
| Pruebas manuales en teléfono (PDF §3.3, §4.3, §5.3, §6.5) | App en dispositivo con la API encendida y la URL de `.env` correcta | Registro en `PRUEBAS_MANUALES.md` (pendiente de ejecutar en el teléfono) |

## 7. Conclusión

La IA generó una parte importante del código, pero el valor del resultado estuvo en la estrategia de control: un `AGENTS.md` escrito antes de empezar que limitó y ancló al asistente, un avance modular por fases con criterios de aceptación, prompts de una sola fase con verificación obligatoria, y decisiones de arquitectura tomadas por el autor (Zustand descartado, credenciales de desarrollo rechazadas, tokens en SecureStore). Cada sugerencia fue aceptada, ajustada o rechazada con evidencia; ninguna se incorporó sin contraste con la guía, la documentación oficial y las pruebas en verde.
