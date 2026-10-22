# Biblioteca — app móvil (`library_app`)

Aplicación móvil en **Expo SDK 57 / React Native 0.86 / TypeScript** que consume `library_api`: catálogo de libros, autenticación con sesión segura, préstamos con sincronización offline (SQLite + cola de salida) y portadas tomadas desde la cámara o la galería.

## Requisitos

- Node.js 20 o superior (verificado con Node 24).
- Expo Go en un teléfono, o un development build.
- Una instancia accesible de `library_api` (local en LAN o desplegada).

## Configuración

```bash
npm install
Copy-Item .env.example .env   # PowerShell (bash: cp .env.example .env)
```

Edita `.env` y define la URL de la API:

```dotenv
EXPO_PUBLIC_API_URL=https://tu-api.example.com
```

- **Teléfono físico:** IP de tu PC en la misma red Wi-Fi (por ejemplo `http://192.168.1.20:3000`) y la API levantada con `pnpm dev:lan`.
- **Emulador Android:** `http://10.0.2.2:3000`.
- **Producción:** la URL HTTPS del despliegue.

La URL debe ser accesible desde el dispositivo. Si cambias `.env`, reinicia con `npx expo start -c` (Metro guarda caché). `.env` solo contiene datos públicos: **nunca** agregues credenciales ni secretos.

## Comandos

```bash
npx expo start                 # servidor de desarrollo
npx expo start -c              # limpia la caché de Metro
npm run typecheck              # TypeScript
npx expo lint                  # ESLint (expo lint)
npm test                       # Jest (8 suites; la de integración es opcional)
npx expo export --platform android   # empaquetado de verificación
```

## Estructura

```text
src/
  app/                 Rutas de Expo Router (pantallas y _layout)
  components/          Base de interfaz (Screen, ThemedText, Button, tarjetas, estados)
  config/env.ts        URL de la API y timeout
  constants/theme.ts   Tema y espaciados
  db/                  Migraciones y repositorios SQLite
  hooks/               Hooks de lectura y tema
  lib/                 Utilidades puras (texto, estados de lista)
  providers/           AuthProvider y DataProvider (estado global)
  services/
    api/               Cliente HTTP tipado (timeout, 401 → refresh → reintento)
    auth/              Sesión en expo-secure-store
    loans/             Reglas de préstamos
    sync/              Cola offline, conflictos y cursor incremental
    device/            Cámara/galería y subida de portadas
  types/               Tipos compartidos
__tests__/             Suites de Jest
test-utils/            Dobles de prueba (SQLite de Node, fetch real, fakes)
```

## Funcionamiento

- **Sesión:** tokens en `expo-secure-store`, restauración al abrir la app y refresco automático ante 401 con un reintento. Las rutas están protegidas con `Stack.Protected`.
- **Offline-first:** la UI lee siempre de SQLite. Las solicitudes de préstamo se guardan en local y en una cola `outbox`; al volver la red (NetInfo) o al activar la app se envían solas. Los conflictos 409 se resuelven con «gana el servidor» y se explican al usuario.
- **Portadas (semana 12):** solo el bibliotecario ve la acción; permiso en contexto, compresión con ImageManipulator y `PUT /api/books/:id/cover`. La actividad queda en `activity_log` sin guardar la imagen.

## Pruebas

```bash
npm test
```

Cubre cliente HTTP, sesión, SQLite, sincronización, flujo offline, componentes y utilidades. La prueba de integración `__tests__/e2e-api.test.ts` se omite por defecto: solo corre si defines `E2E_API_URL`, `E2E_STUDENT_EMAIL`, `E2E_STUDENT_PASSWORD`, `E2E_LIBRARIAN_EMAIL` y `E2E_LIBRARIAN_PASSWORD` en el entorno (nunca en el repositorio).

## Documentación

- `BITACORA_IA.md` — bitácora de uso de IA generativa (Sección 9).
- `MODELO_AMENAZAS.md` — modelado de amenazas de la semana 10.
- `ESTRATEGIA_CONFLICTOS.md` — justificación de «gana el servidor» (semana 11).
- `PRUEBAS_MANUALES.md` — registro de pruebas en dispositivo y criterios de evidencia (§3.4, §4.4, §5.4, §6.3, §6.6 y §7.2).
- `SERVICIO_FOTOS.md` — apartado de la semana 12: cámara, galería, permisos, compresión y subida de portadas.
- `evidencias/semana12/` — capturas y video del flujo de portadas (se completan en el teléfono).

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| «No hay conexión con el servidor» | `EXPO_PUBLIC_API_URL` con `localhost`, IP incorrecta u otra red | Usa la IP del PC, la misma red Wi-Fi y reinicia con `npx expo start -c` |
| La API responde 401 «Protected deployment» | El despliegue de Vercel tiene **Deployment Protection** (Vercel Authentication) activa | En Vercel: proyecto → **Settings → Deployment Protection → Vercel Authentication** → desactívala (o deja solo *Preview*) y vuelve a probar. No pongas un token de bypass en la app: quedaría expuesto |
| El cambio de `.env` no se nota | Caché de Metro | `npx expo start -c` |
| Credenciales rechazadas | Usuario no creado o Authentication deshabilitado en la API | Revisa la Guía 1 y crea los usuarios de prueba en `library_api` |
