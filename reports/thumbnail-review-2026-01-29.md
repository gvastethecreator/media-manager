# 🔍 Revisión del Sistema de Thumbnails

**Fecha**: 29/01/2026
**Objetivo**: Revisión completa del sistema de thumbnails, problemas con mediabunny/ffmpeg y puntos de mejora.

---

## 📊 Arquitectura Actual

### Stack de Generación de Thumbnails

| Tipo de Archivo | Herramienta Principal | Fallback |
|-----------------|----------------------|----------|
| Imágenes | Sharp | N/A |
| Videos (animado) | mediabunny → FFmpeg | Placeholder SVG |
| Videos (estático) | mediabunny → FFmpeg | Placeholder SVG |
| Documentos | SVG Generator | N/A |
| JSON | SVG Generator | N/A |
| Audio | Waveform (no implementado) | Placeholder |
| 3D | Placeholder SVG | N/A |

### Flujo de Procesamiento

```
FileEntityMapperCore
├── Fase 1: createBasicEntityFromFile()
├── Fase 2: extractMetadataForEntity()
└── Fase 3: processThumbnailForEntity() → VideoProcessor.generateThumbnail()
    ├── tryAnimatedThumbnail() → generateAnimatedVideoThumbnail()
    │   ├── generateAnimatedVideoThumbnailMediabunny()
    │   └── generateAnimatedVideoThumbnailFFmpeg()
    ├── tryStaticThumbnail() → generateStaticVideoThumbnail()
    │   ├── generateStaticVideoThumbnailMediabunny()
    │   └── generateStaticVideoThumbnailFFmpeg()
    └── createPlaceholderThumbnail()
```

---

## 🚨 Problemas Identificados

### 1. **Mediabunny puede fallar silenciosamente**

**Ubicación**: [`src/lib/utils/video/thumbnail-helpers.ts`](src/lib/utils/video/thumbnail-helpers.ts:59-91)

**Problema**: El fallback a FFmpeg solo se activa si mediabunny lanza una excepción explícita. Si mediabunny retorna `null` sin error, el código no continúa al fallback.

```typescript
// ❌ Problema: Si mediabunny retorna null, no entra al catch
const result = await generateAnimatedVideoThumbnailMediabunny(videoPath, options);
if (result) {
    return result;
}
// ❌ Nunca llega aquí si result es null
```

**Solución**: Agregar lógica para continuar al fallback cuando `result === null`.

### 2. **Detección de FFmpeg usa comando del sistema**

**Ubicación**: [`src/lib/utils/video/ffmpeg-thumbnails.ts`](src/lib/utils/video/ffmpeg-thumbnails.ts:210-217)

**Problema**: `isFFmpegAvailable()` ejecuta `ffmpeg -version` que busca en el PATH del sistema. Sin embargo, tienen FFmpeg en `bin/ffmpeg.exe` que no está en el PATH.

**Solución**: Modificar `isFFmpegAvailable()` para verificar primero el binario local:

```typescript
// ✅ Mejora sugerida
const FFMEG_LOCAL_PATH = join(process.cwd(), 'bin', 'ffmpeg.exe');
if (existsSync(FFMEG_LOCAL_PATH)) return true;
```

### 3. **FFmpegthumbnail usa comillas que pueden fallar en Windows**

**Ubicación**: [`src/lib/utils/video/ffmpeg-thumbnails.ts`](src/lib/utils/video/ffmpeg-thumbnails.ts:50-66)

**Problema**: El comando usa comillas dobles que pueden causar problemas en Windows con rutas que contienen espacios.

```typescript
// ❌ Problema potencial con rutas en Windows
'"${videoPath}"'  // y '"${tempOutputPath}"'
```

**Solución**: Usar la opción `{ shell: true, windowsHide: true }` con `execAsync` o evitar comillas innecesarias.

### 4. **Timeouts no configurados en algunos lugares**

**Ubicación**: [`src/lib/utils/video/thumbnail-helpers.ts`](src/lib/utils/video/thumbnail-helpers.ts:69-90)

**Problema**: El fallback a FFmpeg en `generateAnimatedVideoThumbnail` no tiene timeout explícito (sí lo tiene `generateAnimatedVideoThumbnailFFmpeg` con 30s).

### 5. **Mediabunny requiere WebCodecs API**

**Ubicación**: [`src/lib/utils/video/thumbnail-helpers.ts`](src/lib/utils/video/thumbnail-helpers.ts:139-143)

**Problema**: En Node.js, mediabunny puede fallar con el error `"Track de video no se puede decodificar"` si WebCodecs API no está disponible. Este polyfill puede no estar configurado correctamente.

**Nota**: Mediabunny usa `BlobSource` y requiere un entorno con soporte para WebCodecs o polyfills adecuados.

### 6. **Placeholder SVG no se muestra correctamente**

**Ubicación**: [`src/services/file-entity-mapper/processors/video.processor.ts`](src/services/file-entity-mapper/processors/video.processor.ts:303-311)

**Problema**: El thumbnail SVG generado como fallback tiene `thumbnailMimeType: 'image/svg+xml'`, pero el cliente puede no estar manejando este tipo de contenido para videos.

### 7. **Thumbnails de audio no implementados**

**Ubicación**: [`src/services/file-entity-mapper/processors/audio.processor.ts`](src/services/file-entity-mapper/processors/audio.processor.ts:180-182)

**Problema**: Hay un comentario indicando que se debe generar waveform visual, pero no está implementado. Actualmente usa placeholder.

---

## 📋 Mejoras Sugeridas

### Alta Prioridad

#### 1. **Mejorar el Fallback de FFmpeg**

Modificar [`src/lib/utils/video/thumbnail-helpers.ts`](src/lib/utils/video/thumbnail-helpers.ts:47-91):

```typescript
export async function generateAnimatedVideoThumbnail(
    videoPath: string,
    options: { ... } = {}
): Promise<Buffer | null> {
    const { time = 2, quality = 'medium', frames = 6, duration = 2 } = options;

    // Intentar con mediabunny
    try {
        const result = await generateAnimatedVideoThumbnailMediabunny(videoPath, options);
        if (result) {
            console.log(`✅ Thumbnail animado generado con mediabunny: ${result.length} bytes`);
            return result;
        }
    } catch (error) {
        console.warn('Mediabunny falló para thumbnail animado:', error);
    }

    // ✅ Fallback a FFmpeg - también si mediabunny retorna null
    try {
        const { generateAnimatedVideoThumbnailFFmpeg, isFFmpegAvailable } = await import('./ffmpeg-thumbnails.js');
        
        // ✅ Verificar binario local primero
        const ffmpegAvailable = await isFFmpegAvailable(true); // true = incluir binario local
        if (!ffmpegAvailable) {
            console.error('Ni mediabunny ni FFmpeg están disponibles');
            return null;
        }

        return await generateAnimatedVideoThumbnailFFmpeg(videoPath, { ...options, width: 320, height: 240 });
    } catch (error) {
        console.error('Error con fallback FFmpeg:', error);
        return null;
    }
}
```

#### 2. **Actualizar isFFmpegAvailable para usar binario local**

```typescript
export async function isFFmpegAvailable(useLocal: boolean = false): Promise<boolean> {
    // ✅ Verificar binario local primero
    if (useLocal) {
        const localPath = join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
        if (existsSync(localPath)) return true;
    }
    
    try {
        const { stdout } = await execAsync('ffmpeg -version');
        return stdout.includes('ffmpeg version');
    } catch {
        return false;
    }
}
```

#### 3. **Mejorar manejo de errores en VideoProcessor**

El [`VideoProcessor.generateThumbnail()`](src/services/file-entity-mapper/processors/video.processor.ts:99-152) ya tiene buena estrategia de fallback. La mejora sería agregar logging más detallado.

### Media Prioridad

#### 4. **Implementar thumbnails de audio**

El sistema ya tiene el esqueleto en [`audio.processor.ts`](src/services/file-entity-mapper/processors/audio.processor.ts). Se podría:

- Usar `audiowaveform` o similar para generar waveform
- O usar FFmpeg para extraer espectro de frecuencia como imagen

#### 5. **Agregar métricas de成功率 por tipo**

Sería útil agregar logging de éxito/fallo por tipo de archivo:

```typescript
// En phase6-thumbnails.ts
logger.info('🖼️ Thumbnails completados', {
    image: { success: imagesSuccess, failed: imagesFailed },
    video: { success: videosSuccess, failed: videosFailed },
    document: { success: docsSuccess, failed: docsFailed },
});
```

#### 6. **Mejorar validación de thumbnails**

El script de diagnóstico ya hace validación, pero sería útil que el sistema validara thumbnails periódicamente y regenerara los corruptos.

### Baja Prioridad

#### 7. **Cache de thumbnails procesados**

Actualmente, los thumbnails se regeneran si hay error. Podría agregarse un cache TTL para evitar reprocesamiento.

#### 8. **Thumbnail progresivo**

Para imágenes grandes, generar thumbnails en múltiples calidades (low/medium/high) según necesidad.

---

## 🔧 Verificación de FFmpeg Local

FFmpeg está disponible en:

- ✅ `bin/ffmpeg.exe` (Windows)
- ✅ `bin/ffprobe.exe` (Windows)
- ✅ `bin/ffplay.exe` (Windows)

**Nota**: El binario local NO está siendo usado actualmente porque:

1. `isFFmpegAvailable()` busca en el PATH del sistema
2. El PATH de Windows no incluye `d:\DEV\image-manager\bin`

---

## 📊 Métricas del Sistema (del diagnóstico)

Del reporte [`reports/thumbnail-diagnosis-2025-10-11T01-07-31.md`](reports/thumbnail-diagnosis-2025-10-11T01-07-31.md):

| Tipo | Éxito | Parcial | Error | Estado |
|------|-------|---------|-------|--------|
| image | 1 | 0 | 0 | ✅ |
| video | 0 | 1 | 0 | ⚠️ |
| audio | 1 | 1 | 0 | ⚠️ |
| document | 2 | 0 | 0 | ✅ |
| jsonFile | 1 | 0 | 0 | ✅ |
| file3d | 1 | 0 | 0 | ✅ |

**Problemas principales**:

- Video: `"Failed to generate animated thumbnail"`
- Audio: `"Audio metadata extraction failed"`

---

## 🎯 Próximos Pasos Recomendados

1. **Inmediato**: Modificar `isFFmpegAvailable()` para usar el binario local en `bin/`
2. **Corto plazo**: Mejorar la lógica de fallback para que continúe cuando mediabunny retorna `null`
3. **Medio plazo**: Implementar thumbnails de audio con waveform visual
4. **Largo plazo**: Agregar sistema de monitoreo de成功率 y alertas automáticas

---

## 📁 Archivos Relevantes Revisados

- [`src/lib/config/thumbnail.config.ts`](src/lib/config/thumbnail.config.ts) - Configuración de calidades
- [`src/lib/utils/video/thumbnail-helpers.ts`](src/lib/utils/video/thumbnail-helpers.ts) - Helpers principales
- [`src/lib/utils/video/ffmpeg-thumbnails.ts`](src/lib/utils/video/ffmpeg-thumbnails.ts) - Fallback FFmpeg
- [`src/services/file-entity-mapper/processors/video.processor.ts`](src/services/file-entity-mapper/processors/video.processor.ts) - Procesador de video
- [`src/services/video/video-probe.service.ts`](src/services/video/video-probe.service.ts) - Probe de video
- [`src/services/image/image-thumbnail.service.ts`](src/services/image/image-thumbnail.service.ts) - Thumbnails de imágenes
- [`scripts/diagnose-thumbnails.js`](scripts/diagnose-thumbnails.js) - Script de diagnóstico
- [`bin/`](bin/) - FFmpeg binaries
