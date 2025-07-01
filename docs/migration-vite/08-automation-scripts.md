# T09 – Automatización & Scripts

Todos los scripts respetan la regla **Windows SIEMPRE**; se proporcionan equivalentes POSIX cuando aplique.

## 1. Scripts `package.json`

| Script | Descripción |
|--------|-------------|
| `dev:vite` | Inicia servidor Vite + proxy API |
| `build:vite` | Compila frontend y API |
| `preview:vite` | Previsualiza build |
| `db:full-reset` | Reset DB usando Prisma + seed |
| `logs:list` | Lista logs con `pnpm logs list` |
| `logs:clean` | Limpia logs anteriores a X días |
| `check:errors` | Resume errores TypeScript |
| `desktop:tauri` | Compila app Tauri |
| `desktop:electron` | Compila app Electron |

Ejemplo de adición en `package.json`:

```jsonc
"desktop:tauri": "tauri build --target windows-msi",
"desktop:electron": "electron-builder --win"
```

## 2. PowerShell helpers (`scripts/ps/`)

- `watch-and-restart.ps1` – Observa cambios en server y reinicia proceso de `node` limpio.
- `zip-release.ps1` – Empaqueta carpeta `dist/` en ZIP nombrado por versión y genera SHA256.

```powershell
param([string]$Version)
$zip = "ImageManager-$Version.zip"
Compress-Archive -Path .\dist -DestinationPath .\releases\$zip -Force
Get-FileHash .\releases\$zip -Algorithm SHA256 | Out-File .\releases\$zip.sha256
```

## 3. Git hooks (Husky)

```bash
npx husky add .husky/pre-commit "pnpm lint && pnpm biome:check"
```

## 4. Task runner opcional: **Justfile**

`justfile`:

```just
build :-
    pnpm build:vite
release-win :-
    pnpm build:vite
    pwsh scripts/ps/zip-release.ps1 1.0.0
```

## 5. Scheduler `cron` versus `Task Scheduler`

- Para jobs en Windows utilizar *Task Scheduler* XML export con acción `pwsh -File scripts/db/cleanup.ps1`.

## 6. Script `release:windows`

```jsonc
"release:windows": "pnpm desktop:tauri && pwsh scripts/ps/zip-release.ps1 %npm_package_version%"
```

## Checklist

- [ ] Todos los scripts registran log en `/logs` automáticamente.
- [ ] No hay rutas hard-coded UNIX (`/` → usar `path.join`).
