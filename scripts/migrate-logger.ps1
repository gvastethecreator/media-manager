# Script de PowerShell para migrar referencias del logger antiguo al nuevo

# Función para buscar archivos recursivamente
function Find-Files {
    param (
        [string]$Directory,
        [string]$Pattern
    )
    
    $files = @()
    
    try {
        # Obtener todos los archivos que coinciden con el patrón
        $files = Get-ChildItem -Path $Directory -Recurse -File -Include $Pattern -ErrorAction Stop |
                Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }
    }
    catch {
        Write-Error "Error al buscar archivos en $Directory`: $_"
    }
    
    return $files
}

# Función para migrar un archivo
function Migrate-File {
    param (
        [string]$FilePath,
        [string]$RootDir
    )
    
    Write-Host "Analizando: $($FilePath.Replace($RootDir, ''))"
    
    try {
        $content = Get-Content -Path $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        $modified = $false
        
        # Reemplazar importaciones de logger
        if ($content -match "import\s*{\s*logger\s*}\s*from\s*['""](@/|\./).*?/logger/logger['""]") {
            $content = $content -replace "import\s*{\s*logger\s*}\s*from\s*['""](@/|\./)(.*)\/logger\/logger['""]", "import { serverLogger } from '`$1`$2/logger/server-logger'"
            $modified = $true
        }
        
        # Reemplazar createServiceLogger por createServerServiceLogger
        if ($content -match "createServiceLogger") {
            $content = $content -replace "import\s*{\s*createServiceLogger(?:\s+as\s+\w+)?\s*}\s*from\s*['""](@/|\./)(.*)\/logger\/logger['""]", "import { createServerServiceLogger } from '`$1`$2/logger/server-logger'"
            $content = $content -replace "createServiceLogger", "createServerServiceLogger"
            $modified = $true
        }
        
        # Reemplazar referencias a logger por serverLogger
        if ($modified) {
            $content = $content -replace "\blogger\.", "serverLogger."
        }
        
        # Guardar cambios si se modificó el archivo
        if ($modified -and $content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -ErrorAction Stop
            Write-Host "✅ Migrado: $($FilePath.Replace($RootDir, ''))" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Error "Error al procesar archivo $FilePath`: $_"
    }
    
    return $false
}

# Directorio principal
$rootDir = Split-Path -Parent $PSScriptRoot
Write-Host "Buscando archivos en: $rootDir"

# Buscar archivos TypeScript y JavaScript
$tsFiles = Find-Files -Directory "$rootDir\src" -Pattern "*.ts", "*.tsx", "*.js", "*.jsx"
Write-Host "Encontrados $($tsFiles.Count) archivos para analizar"

# Migrar cada archivo
$migratedCount = 0
$migratedFiles = @()

foreach ($file in $tsFiles) {
    if (Migrate-File -FilePath $file.FullName -RootDir $rootDir) {
        $migratedCount++
        $migratedFiles += $file.FullName
    }
}

Write-Host "`n✅ Migración completada. $migratedCount archivos actualizados." -ForegroundColor Green

if ($migratedCount -gt 0) {
    Write-Host "`nArchivos migrados:" -ForegroundColor Cyan
    foreach ($file in $migratedFiles) {
        Write-Host "- $($file.Replace($rootDir, ''))"
    }
}

# Verificar si quedan referencias al logger antiguo
Write-Host "`nVerificando referencias restantes..." -ForegroundColor Yellow
$remainingReferences = 0
$remainingFiles = @()

foreach ($file in $tsFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
        if ($content -match "from\s*['""](@/|\./).*?/logger/logger['""]") {
            Write-Host "⚠️ Referencia restante en: $($file.FullName.Replace($rootDir, ''))" -ForegroundColor Yellow
            $remainingReferences++
            $remainingFiles += $file.FullName
        }
    }
    catch {
        Write-Error "Error al verificar archivo $($file.FullName): $_"
    }
}

if ($remainingReferences -eq 0) {
    Write-Host "✅ No se encontraron referencias restantes al logger antiguo." -ForegroundColor Green
}
else {
    Write-Host "⚠️ Se encontraron $remainingReferences archivos con referencias al logger antiguo." -ForegroundColor Yellow
    
    Write-Host "`nArchivos con referencias restantes:" -ForegroundColor Yellow
    foreach ($file in $remainingFiles) {
        Write-Host "- $($file.Replace($rootDir, ''))"
    }
}