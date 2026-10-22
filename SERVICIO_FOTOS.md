# Semana 12 — Servicio del dispositivo: cámara y portadas

> **Apartado de la Guía 2, sección 6.** La app ya implementa este flujo en el código; este documento lo explica y sirve como evidencia para el Hito 3.
>
> **Estado de las pruebas en dispositivo:** pendiente de ejecutar en un teléfono real. Los resultados se registran en `PRUEBAS_MANUALES.md` §4 y las capturas se guardan en `evidencias/semana12/`.

## 1. Qué se integra

El bibliotecario toma una foto (o elige una imagen de la galería) y la usa como portada de un libro. Es una integración completa:

```text
permiso → cámara/galería → reducción y compresión → PUT /api/books/:id/cover
        → actualización de SQLite → la portada aparece en detalle y catálogo
```

- **Solo el bibliotecario** ve los botones. El estudiante no los tiene en la interfaz y la API responde `403` si intenta la acción.
- La acción **requiere conexión**: no se encola en el `outbox`. Si no hay red, se muestra el mensaje y no se pierde nada.
- La imagen **no se guarda** en SQLite ni en la bitácora: solo se guarda la URL de la portada que devuelve la API y eventos técnicos en `activity_log`.

## 2. Archivos y código

### 2.1 Permisos en `app.json`

El plugin de `expo-image-picker` declara solo el permiso de cámara; el micrófono se desactiva y la galería usa el selector del sistema:

```json
[
  "expo-image-picker",
  {
    "cameraPermission": "Biblioteca usa la cámara para tomar la foto de portada de un libro.",
    "photosPermission": "Biblioteca accede a tus fotos solo cuando eliges una portada.",
    "microphonePermission": false
  }
]
```

> Cambiar estos textos exige una nueva compilación nativa. En Expo Go ya vienen configurados por Expo.

### 2.2 Servicio de cámara y subida

Archivo: `src/services/device/cover-service.ts`.

Puntos exactos del código de la guía:

- `MAX_BASE64_LENGTH = 700_000`: límite de la API (≈ 520 KB de imagen).
- `COVER_WIDTH = 600`: ancho al que se reduce la foto.
- `QUALITIES = [0.7, 0.5, 0.35, 0.2]`: calidades decrecientes hasta que la imagen entra en el límite.
- `PermissionDeniedError.canAskAgain`: distingue si el sistema volverá a mostrar el diálogo o si hay que enviar a Ajustes.
- `ImageTooLargeError`: la imagen no entra ni con la última calidad.
- `pickCover(source, activity)`: devuelve `null` si el usuario cancela; registra `cover.permission` y `cover.pick`.
- `uploadCover(api, activity, bookId, cover)`: hace `PUT /api/books/:id/cover` con `{ contentType, data }`; registra `cover.upload`.

Flujo resumido del código:

```ts
if (source === 'camera') {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  await activity.log('cover.permission', `cámara: ${permission.status}`);
  if (!permission.granted) throw new PermissionDeniedError(permission.canAskAgain);
}

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.8,
};

const result = source === 'camera'
  ? await ImagePicker.launchCameraAsync(options)
  : await ImagePicker.launchImageLibraryAsync(options);

if (result.canceled || result.assets.length === 0) {
  await activity.log('cover.pick', `${source}: cancelado`);
  return null;
}

const asset = result.assets[0];
for (const compress of QUALITIES) {
  const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  context.resize({ width: COVER_WIDTH });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress,
    base64: true,
  });
  if (saved.base64 && saved.base64.length <= MAX_BASE64_LENGTH) {
    return { base64: saved.base64, contentType: 'image/jpeg' };
  }
}
throw new ImageTooLargeError();
```

### 2.3 Pantalla del libro

Archivo: `src/app/book/[id].tsx`.

- `const librarian = user?.role === 'librarian';`
- Si **no** es bibliotecario, muestra el botón de préstamo y los estados de la solicitud.
- Si es bibliotecario, muestra el bloque **Portada del libro** con:
  - **Tomar foto** → `onChangeCover('camera')`.
  - **Elegir de la galería** → `onChangeCover('library')`.
- `onChangeCover` comprueba `online` antes de abrir la cámara; si no hay red muestra `Necesitas conexión para subir la portada.`
- Al terminar, actualiza SQLite con `repos.books.upsertMany([updated])` y llama a `notifyChanged()`: la portada aparece en el detalle y en el catálogo sin esperar otra sincronización.
- Si el permiso se denegó definitivamente, la alerta ofrece **Abrir ajustes** con `Linking.openSettings()`.

### 2.4 Portada en la interfaz

Archivo: `src/components/book-views.tsx`.

`BookCover` usa la URL relativa que devuelve la API:

```tsx
<Image
  source={{ uri: `${API_URL}${book.coverUrl}` }}
  style={size}
  contentFit="cover"
  transition={150}
  accessibilityLabel={`Portada de ${book.title}`}
/>
```

El mismo componente se usa en el detalle (`160 × 220`) y en la tarjeta del catálogo (`64 × 88`).

### 2.5 Trazabilidad local

Archivo: `src/db/repositories.ts`.

La tabla `activity_log` guarda solo el tipo de evento y un detalle técnico; **nunca** la imagen, tokens ni datos personales. El perfil muestra los últimos 15 eventos en **Actividad reciente** (`src/app/(tabs)/profile.tsx`).

## 3. Permisos y privacidad

- **Mínimo privilegio:** solo `CAMERA`; el micrófono se declara como `false`.
- **Permiso en contexto:** se pide al pulsar **Tomar foto**, no al abrir la app.
- **Galería:** usa el selector del sistema; no requiere permiso de almacenamiento.
- **Permiso denegado para siempre:** el sistema ya no muestra el diálogo; la app ofrece **Abrir ajustes**.
- **Datos:** la imagen se reduce antes de subirla y no se persiste localmente; solo se guarda la URL de la portada.

## 4. Manejo de fallos: qué ve el usuario

| Situación | Comportamiento |
| --- | --- |
| Permiso de cámara denegado (se puede volver a preguntar) | Alerta explicativa; sigue disponible **Elegir de la galería** |
| Denegado definitivamente | Alerta con botón **Abrir ajustes** |
| Usuario cancela la cámara | No pasa nada, sin mensajes de error |
| Sin conexión | Mensaje **Necesitas conexión para subir la portada.** (esta acción no se encola) |
| Imagen demasiado grande tras comprimir | Mensaje pidiendo otra imagen |
| Servidor rechaza el archivo (400/403) | Se muestra el mensaje del servidor |
| Un estudiante intenta la acción | La API responde 403; la interfaz ni siquiera muestra los botones |

## 5. Trazabilidad

Eventos que quedan registrados en SQLite y se ven en **Perfil → Actividad reciente**:

```text
cover.permission · cámara: granted
cover.pick       · camera: 148 KB base64, calidad 0.7
cover.upload     · OK libro clean-code
sync             · Enviadas 1, en conflicto 0
loan.approve     · Préstamo de "Clean Code" → approved
```

## 6. Cómo verlo en la app

1. Inicia sesión con la cuenta **bibliotecario**. En **Perfil** debe decir **Bibliotecario**; si dice **Estudiante**, la cuenta no tiene el rol correcto y los botones no aparecerán.
2. Abre **Catálogo** y toca un libro.
3. En el detalle, baja hasta **Portada del libro**.
4. Pulsa **Tomar foto** o **Elegir de la galería**.
5. La portada nueva debe aparecer en el detalle y en la lista del catálogo.
6. Como estudiante, el bloque de portada no existe (es el comportamiento que exige la guía).

> **Expo Go** incluye `expo-image-picker` y `expo-image-manipulator`; no necesitas un development build para probar la cámara en Expo Go. En un simulador iOS no hay cámara: usa un teléfono real.

## 7. Pruebas en dispositivo (lista de verificación)

Estas son las pruebas de la Guía 2 §6.5. Marca el resultado en `PRUEBAS_MANUALES.md` §4:

- [ ] Como bibliotecario, **Tomar foto** pide permiso la primera vez.
- [ ] Rechazar el permiso muestra la alerta y la galería sigue funcionando.
- [ ] Conceder el permiso abre la cámara; cancelar no produce errores.
- [ ] La portada tomada aparece en el detalle y en la lista de libros.
- [ ] Otro dispositivo ve la portada tras sincronizar.
- [ ] Con modo avión, intentar subir muestra el mensaje de conexión.
- [ ] Como estudiante no existen los botones de portada.
- [ ] **Perfil → Actividad reciente** muestra los eventos `cover.*`.

## 8. Evidencia fotográfica

Guarda las capturas en `evidencias/semana12/`. La tabla de archivos y qué debe mostrar cada una está en `evidencias/semana12/README.md`.

No se incluyen capturas inventadas: son evidencia de una ejecución real en el teléfono. Cuando las tengas, enlázalas aquí o en `PRUEBAS_MANUALES.md` §4.

## 9. Sustentación

Prepárate para explicar y modificar en vivo:

- ¿Por qué se pide el permiso de cámara solo al pulsar **Tomar foto** y no al abrir la app?
- ¿Por qué la galería no necesita permiso de almacenamiento?
- ¿Por qué se reduce a 600 px y se prueban varias calidades antes de subir?
- ¿Qué pasa si el usuario deniega el permiso para siempre? ¿Cómo se abre Ajustes?
- ¿Qué pasa si no hay conexión? ¿Por qué la portada no se encola como un préstamo?
- ¿Dónde se ve la trazabilidad `cover.*` y qué datos **no** se guardan?
- ¿Cómo se actualiza la lista de libros después de subir la portada (`upsertMany` + `notifyChanged`)?
- ¿Por qué un estudiante no ve los botones y qué responde la API si intenta la acción?

## 10. Verificación automática

```bash
npm run typecheck
npx expo lint
npm test
npx expo export --platform android
```

Resultado esperado: sin errores, sin advertencias, 66 pruebas aprobadas (3 omitidas por ser E2E opcional) y exportación correcta.
