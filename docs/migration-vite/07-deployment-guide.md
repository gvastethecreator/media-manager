# T08 – Guía de Despliegue & Distribución

## 1. Escenarios de despliegue

| Escenario | Descripción | Público objetivo |
|-----------|-------------|------------------|
| **SPA + API** | Frontend compilado estático servido por Nginx + API Node/Express | Servidor Linux ó Windows |
| **Docker** | Contenedor multi-stage para cloud (AWS ECS, Azure, Fly) | Infraestructura cloud |
| **Windows Desktop** | Empaquetado **Tauri 2** (Rust + Webview) | Usuarios sin conexión |
| **Cross-platform Desktop** | Empaquetado **Electron 30** | Usuarios macOS/Linux/Win |

## 2. Paquetes de salida Vite

- `bun run build:vite` → `dist/` (static) con `index.html` y assets.
- API Express compilada con `tsup` → `dist/server`.

### Archivo `.env.example`

```env
NODE_ENV=production
API_PORT=4000
DATABASE_URL=file:./db.sqlite
VITE_API_URL=http://localhost:4000/api
CORS_ORIGIN=http://localhost:5173
```

## 3. Pipeline Docker multi-stage

```Dockerfile
# Stage 1 – Build frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
RUN bun run build:vite && bun run build:server

# Stage 2 – Runtime
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
EXPOSE 4000
CMD ["node", "dist/server/index.js"]
```

### Nginx reverse-proxy (ejemplo)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location /api/ {
    proxy_pass http://backend:4000/;
    proxy_set_header Host $host;
  }
}
```

## 4. Servidor Windows standalone

1. Ejecutar `bun run build:vite` y `bun run build:server`.
2. Empaquetar `dist/` + `dist/server` en un zip.
3. Crear script `start.ps1`:

   ```powershell
   $Env:NODE_ENV="production"
   node .\dist\server\index.js
   Start-Process http://localhost:4000
   ```

4. Documentar prerequisitos: Node.js 22 LTS. En Windows habilitar rutas largas (`New-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`) para evitar errores **MAX_PATH**.

## 5. Empaquetado Tauri 2

```bash
bun add -d @tauri-apps/cli@^2
bunx tauri init --ci --app-name "ImageManager" --dist-dir ../dist --dev-path http://localhost:5173
```

- Ajustar `tauri.conf.json` → target `windows-msi`, `nsis`.
- Firma de código opcional con `signtool.exe`.

## 6. Empaquetado Electron 30

```bash
bun add -d electron@30 electron-builder@24
```

`electron-builder.yml`:

```yaml
appId: com.image.manager
productName: ImageManager
files:
  - dist/**/*
win:
  target: nsis
```

## 7. CI Windows artefactos

```yaml
- name: Build Windows MSI (Tauri)
  uses: tauri-apps/tauri-action@v2
  with:
    tagName: v${{ github.ref_name }}
    releaseName: "ImageManager ${{ github.ref_name }}"
```

## 8. Checklist final

- [ ] Binario Windows (.msi/.exe) genera y se instala sin advertencias SmartScreen.
- [ ] Docker image < 250 MB.
- [ ] Despliegue cloud pasa smoke tests Playwright.

⌛ **Tiempo estimado:** 1.5 días.
