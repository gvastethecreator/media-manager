# 🔍 Reporte de Diagnóstico de Thumbnails

**Fecha**: 10/10/2025, 22:07:31
**Duración**: 1.00s

## 📊 Resumen General

| Métrica        | Valor     |
| -------------- | --------- |
| Total archivos | 8         |
| ✅ Exitosos    | 6 (75.0%) |
| ⚠️ Parciales   | 2 (25.0%) |
| ❌ Fallidos    | 0 (0.0%)  |

## 📁 Resultados por Tipo de Archivo

| Tipo     | ✅ Éxito | ⚠️ Parcial | ❌ Error | Estado |
| -------- | -------- | ---------- | -------- | ------ |
| file3d   | 1        | 0          | 0        | ✅     |
| audio    | 1        | 1          | 0        | ⚠️     |
| document | 2        | 0          | 0        | ✅     |
| jsonFile | 1        | 0          | 0        | ✅     |
| image    | 1        | 0          | 0        | ✅     |
| video    | 0        | 1          | 0        | ⚠️     |

## 📄 Detalles por Archivo

### ✅ test-3d.glb

- **Tipo**: file3d
- **Estado**: success
- **Tiempo total**: 45.06ms

**Fases**:

- ✅ basic: 23.98ms
- ✅ metadata: 14.33ms
- ✅ thumbnail: 5.01ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: desconocido
- Válido: ❌

### ⚠️ test-audio.wav

- **Tipo**: audio
- **Estado**: partial
- **Tiempo total**: 83.87ms

**Fases**:

- ✅ basic: 18.85ms
- ❌ metadata: 62.91ms - Error: `Audio metadata extraction failed`
- ✅ thumbnail: 0.76ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: desconocido
- Válido: ❌

### ✅ test-document.md

- **Tipo**: document
- **Estado**: success
- **Tiempo total**: 32.38ms

**Fases**:

- ✅ basic: 16.32ms
- ✅ metadata: 11.94ms
- ✅ thumbnail: 0.75ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: svg-preview
- Válido: ✅

### ✅ test-image.txt

- **Tipo**: document
- **Estado**: success
- **Tiempo total**: 26.64ms

**Fases**:

- ✅ basic: 14.89ms
- ✅ metadata: 8.85ms
- ✅ thumbnail: 0.20ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: svg-preview
- Válido: ✅

### ✅ test-json.json

- **Tipo**: jsonFile
- **Estado**: success
- **Tiempo total**: 31.91ms

**Fases**:

- ✅ basic: 15.45ms
- ✅ metadata: 12.34ms
- ✅ thumbnail: 0.71ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: svg-preview
- Válido: ✅

### ✅ test-mp3.mp3

- **Tipo**: audio
- **Estado**: success
- **Tiempo total**: 56.78ms

**Fases**:

- ✅ basic: 28.25ms
- ✅ metadata: 27.05ms
- ✅ thumbnail: 0.28ms

**Thumbnail**:

- Generado: ✅
- Tamaño: 0.00 KB
- Formato: desconocido
- Válido: ❌

### ✅ test-photo.png

- **Tipo**: image
- **Estado**: success
- **Tiempo total**: 263.77ms

**Fases**:

- ✅ basic: 133.58ms
- ✅ metadata: 60.98ms
- ✅ thumbnail: 64.35ms

**Thumbnail**:

- Generado: ✅
- Tamaño: NaN KB
- Formato: base64-jpeg
- Válido: ✅

### ⚠️ test-video.mp4

- **Tipo**: video
- **Estado**: partial
- **Tiempo total**: 123.98ms

**Fases**:

- ✅ basic: 20.20ms
- ✅ metadata: 59.17ms
- ❌ thumbnail: 43.76ms - Error: `Failed to generate animated thumbnail`

**Thumbnail**: ❌ No generado

## 🚨 Problemas Detectados

### test-audio.wav

- **metadata**: Audio metadata extraction failed

### test-video.mp4

- **thumbnail**: Failed to generate animated thumbnail

## 💡 Recomendaciones

- ⚠️ **audio** - metadata: 1 error(es) detectado(s). Revisar procesador.
- ⚠️ **video** - thumbnail: 1 error(es) detectado(s). Revisar procesador.
