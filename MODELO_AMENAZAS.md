# Modelo de amenazas — `library_app`

**Semana 10 · Autenticación, autorización y seguridad**
Actividad de laboratorio de la Guía 2 (§4.1). Referencia: [OWASP MASVS](https://mas.owasp.org/MASVS/).

## Alcance y activos

La app móvil (Expo / React Native) y su comunicación con `library_api` (Firebase Authentication + Firestore). Los activos considerados son: tokens de sesión, contraseña, rol del usuario, préstamos, datos de la cuenta y el tráfico de red.

## Tabla de modelado de amenazas

| Activo | Amenaza | Control en este proyecto | Dónde se implementa |
| --- | --- | --- | --- |
| Tokens de sesión | Lectura desde una copia de seguridad o un teléfono con root | Solo en `expo-secure-store` (Keychain en iOS, Keystore en Android), cada token en su propia llave. Nunca en AsyncStorage, SQLite ni registros. | `src/services/auth/session-manager.ts` (llaves `auth.idToken`, `auth.refreshToken`, `auth.expiresAt`, `auth.user`); `src/services/api/index.ts` |
| Contraseña | Se guarda o se imprime en registros | Nunca se persiste: solo viaja en el login/registro por HTTPS. El código no usa `console.*` y la contraseña no forma parte de ningún modelo local. | `src/services/auth/auth-service.ts`; `session-manager.ts`; revisión de `src/` sin llamadas a `console` |
| Rol del usuario | Un estudiante modifica la app para verse como bibliotecario | La API valida el rol del token en cada petición (403). La app solo oculta botones según `user.role`: la seguridad real está en el servidor. | `src/app/book/[id].tsx`, `src/app/(tabs)/loans.tsx`, `src/services/device/cover-service.ts`; validación en `library_api` |
| Préstamos de otro usuario | Un estudiante pide por id un préstamo ajeno | La API responde 404 como si no existiera. La app solo consulta los préstamos de la sesión activa. | `src/hooks/use-library-data.ts` (consulta por `uid`); API |
| Datos de otra cuenta en el mismo teléfono | Un segundo usuario inicia sesión y hereda la cola de solicitudes | Al cambiar de cuenta se descartan préstamos y cola locales. Al cerrar sesión se borran los datos privados; el catálogo público se conserva. | `src/providers/data-provider.tsx` (clave `owner.uid`, `loans.clear()`, `outbox.clear()`, `meta.clear()`) |
| Token robado en tránsito | Red Wi-Fi hostil | HTTPS en producción (despliegue de Vercel). HTTP queda solo para el desarrollo local en LAN. | `.env` (`EXPO_PUBLIC_API_URL` con `https://`); `src/config/env.ts` |
| Sesión eterna | Un `refreshToken` robado vive para siempre | La API puede revocarlo. Si la renovación responde 401/403, la sesión se borra y las rutas protegidas vuelven al login. Una sola renovación en vuelo a la vez. | `src/services/auth/session-manager.ts` (`refresh`, `doRefresh`, `clear`); `src/providers/auth-provider.tsx`; `src/app/_layout.tsx` (`Stack.Protected`) |
| Registro abusivo | Alguien se registra como bibliotecario | El registro público siempre crea estudiantes. El rol lo asigna la API/administración, nunca el cliente. | `src/services/auth/auth-service.ts` (`signUp` no envía rol); API |

## Criterios de la semana 10

- [x] **Ningún token ni contraseña aparece en la consola ni en SQLite.** Los tokens solo viven en SecureStore y la contraseña nunca se persiste; no hay llamadas a `console` en `src/`.
- [x] **La sesión sobrevive al reinicio de la app.** `SessionManager.restore()` recupera los cuatro valores de SecureStore al arrancar y funciona también sin conexión.
- [x] **Un 401 provoca una renovación y un reintento, no una pantalla de error.** `src/services/api/client.ts` renueva una vez y reintenta la petición con el token nuevo.
- [x] **No queda ninguna credencial en el código ni en el `.env` de la app.** El `.env` solo contiene `EXPO_PUBLIC_API_URL` (dato público). Las credenciales de las pruebas de integración se pasan por variables `E2E_*` fuera del repositorio.

## Riesgos residuales (fuera del alcance de la app)

- Un dispositivo con root o jailbreak puede debilitar el aislamiento del sistema; SecureStore lo dificulta, pero no lo elimina.
- El robo físico del teléfono desbloqueado queda cubierto por el bloqueo del sistema operativo.
- La protección del despliegue de Vercel es una configuración de infraestructura: debe permitir el acceso de la app (ver `README.md`, solución de problemas).

## Verificación

| Comprobación | Evidencia |
| --- | --- |
| Almacenamiento seguro y renovación única | `__tests__/session-manager.test.ts` |
| Renovación y reintento ante 401 | `__tests__/api-client.test.ts` |
| Limpieza de préstamos y cola al cambiar de cuenta | `src/providers/data-provider.tsx`; `__tests__/offline-flow.test.ts` |
| Sin credenciales en código ni en `.env` | Revisión del repositorio y de `.env.example` |

> Esta tabla completa el laboratorio de modelado de amenazas de la Guía 2 (§4.1) y forma parte de la evidencia de la semana 10.
