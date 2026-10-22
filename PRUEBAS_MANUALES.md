# Registro de pruebas manuales — Guía 2

> **Estado:** pendiente de ejecución en un teléfono real. Completa la columna **Resultado** y adjunta capturas o video al ejecutar cada bloque. La app debe apuntar a una API accesible desde el teléfono (`EXPO_PUBLIC_API_URL` en `.env`; reinicia con `npx expo start -c`).
>
> Fecha de ejecución: ____________ · Dispositivo: ____________ · Versión de la app: ____________

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
- [ ] Semana 12 — cámara y portadas (§6.5)
- [ ] Evidencia del Hito 3 completa (§6.6)

## 1. Semana 9 — catálogo y API (§3.3)

| Escenario | Cómo provocarlo | Resultado esperado | Resultado | Evidencia |
| --- | --- | --- | --- | --- |
| Respuesta válida | Abrir la app | Aparecen los 10 libros | ☐ Pendiente | |
| Estado vacío | Buscar `zzzz` | Mensaje «Sin resultados» | ☐ Pendiente | |
| Servidor apagado | Detener la API y reabrir la app | Estado de error con botón **Reintentar** | ☐ Pendiente | |
| Reintento exitoso | Encender la API y tocar **Reintentar** | La lista aparece | ☐ Pendiente | |
| URL incorrecta | Cambiar `EXPO_PUBLIC_API_URL` a una IP inexistente y reiniciar con `npx expo start -c` | Error de conexión en ≤ 10 s; la pantalla no se congela | ☐ Pendiente | |
| Detalle | Tocar un libro | Portada, autor, año y disponibilidad | ☐ Pendiente | |

## 2. Semana 10 — sesión y rutas protegidas (§4.3)

| Escenario | Resultado esperado | Resultado | Evidencia |
| --- | --- | --- | --- |
| Abrir la app sin sesión | Pantalla de inicio de sesión | ☐ Pendiente | |
| Registrar un estudiante nuevo | Entra al catálogo | ☐ Pendiente | |
| Registrar un correo ya usado | Mensaje «Ya existe una cuenta con ese correo» | ☐ Pendiente | |
| Contraseña de 5 caracteres en registro | Error de validación en el campo, sin llamar a la API | ☐ Pendiente | |
| Iniciar sesión, cerrar la app por completo y abrirla | Sigue con la sesión iniciada (también sin internet) | ☐ Pendiente | |
| Tocar **Salir** | Vuelve al login | ☐ Pendiente | |
| Credenciales erróneas | Mensaje «Correo o contraseña incorrectos» | ☐ Pendiente | |
| Con la API apagada, intentar iniciar sesión | Mensaje «No hay conexión con el servidor…» | ☐ Pendiente | |

## 3. Semana 11 — reconexión y conflictos (§5.3)

### Escenario A · Reconexión

1. Inicia sesión como estudiante con internet y espera a que cargue el catálogo.
2. Activa el modo avión: aparece el aviso **Sin conexión · Mostrando datos guardados**.
3. Abre un libro y pulsa **Solicitar préstamo**: aparece «Solicitud guardada… se enviará cuando vuelva internet».
4. En **Mis préstamos** la solicitud dice **Pendiente de envío**; en **Perfil**, **Cambios pendientes: 1**.
5. Desactiva el modo avión: en unos segundos pasa a **Solicitado** y el contador vuelve a 0.

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Catálogo visible sin internet tras la primera sincronización | ☐ Pendiente | |
| La solicitud pendiente se envía sola al volver la red | ☐ Pendiente | |
| El contador de pendientes vuelve a 0 | ☐ Pendiente | |

### Escenario B · Conflicto

1. En el libro **Rayuela** (1 ejemplar), entra como estudiante con internet y espera la sincronización.
2. Activa el modo avión y solicita Rayuela: queda **Pendiente de envío**.
3. Desde otro dispositivo o el sitio web, entra como otro estudiante, solicita Rayuela y haz que el bibliotecario la apruebe. Ahora no quedan ejemplares.
4. Desactiva el modo avión en el primer teléfono: el servidor responde 409 `NO_COPIES`.
5. Resultado esperado: tu solicitud queda **No se pudo solicitar** con el motivo «Cuando se envió tu solicitud ya no quedaban ejemplares disponibles»; el catálogo muestra Rayuela sin ejemplares y puedes **Descartar** el aviso.

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| El conflicto se muestra con el mensaje correcto | ☐ Pendiente | |
| El catálogo se actualiza con el stock real del servidor | ☐ Pendiente | |
| **Descartar** elimina el aviso | ☐ Pendiente | |
| Reintentar no crea préstamos duplicados (Escenario C) | ☐ Pendiente | |

> Adjunta aquí el video corto o las capturas de los escenarios A y B (evidencia de §5.4).

## 4. Semana 12 — cámara y portadas (§6.5)

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Como bibliotecario, **Tomar foto** pide permiso la primera vez | ☐ Pendiente | |
| Rechazar el permiso muestra la alerta y la galería sigue funcionando | ☐ Pendiente | |
| Conceder el permiso abre la cámara; cancelar no produce errores | ☐ Pendiente | |
| La portada tomada aparece en el detalle y en la lista de libros | ☐ Pendiente | |
| Otro dispositivo ve la portada tras sincronizar | ☐ Pendiente | |
| Con modo avión, intentar subir muestra el mensaje de conexión | ☐ Pendiente | |
| Como estudiante no existen los botones de portada | ☐ Pendiente | |
| Perfil → **Actividad reciente** muestra los eventos `cover.*` | ☐ Pendiente | |

> Adjunta las capturas en `evidencias/semana12/` (lista de archivos en `evidencias/semana12/README.md`). El flujo, permisos y manejo de fallos están documentados en `SERVICIO_FOTOS.md`.

## 5. Evidencia del Hito 3 (§6.6)

- [ ] Repositorio del proyecto con el código y la documentación.
- [ ] `.env.example` con la configuración por ambiente.
- [ ] `BITACORA_IA.md` con el registro de uso de IA.
- [ ] `MODELO_AMENAZAS.md` con la tabla completada.
- [ ] `ESTRATEGIA_CONFLICTOS.md` con la justificación de «gana el servidor».
- [ ] Este registro completado con las pruebas en un teléfono real.
- [ ] Video o capturas de los escenarios A y B.
- [ ] Capturas de la semana 12 en `evidencias/semana12/` (permiso, cámara, portada, modo avión, estudiante y actividad).
- [ ] `npm run typecheck`, `npx expo lint`, `npm test` y `npx expo export --platform android` en verde.
