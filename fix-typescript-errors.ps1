# Script para ejecutar la corrección masiva de errores TypeScript
# Uso: .\fix-typescript-errors.ps1

Write-Host "🚀 Iniciando corrección masiva de errores TypeScript" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Instalar dependencias necesarias si no existen
Write-Host "`n📦 Verificando y asegurando dependencias necesarias..." -ForegroundColor Green
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ pnpm no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
}

if (!(Test-Path "node_modules/glob")) {
    Write-Host "⚠️ Dependencia 'glob' no encontrada. Instalando..." -ForegroundColor Yellow
    pnpm add glob --save-dev
}

# 2. Crear directorio de logs si no existe
$logsDir = ".\logs"
if (!(Test-Path $logsDir)) {
    Write-Host "`n📁 Creando directorio de logs..." -ForegroundColor Green
    New-Item -Path $logsDir -ItemType Directory | Out-Null
}

# 3. Verificar número de errores inicial
Write-Host "`n📊 Contando errores TypeScript iniciales..." -ForegroundColor Green

# Ejecutar tsc y guardar la salida en un archivo temporal
$tscOutputFile = ".\logs\tsc-initial.txt"

try {
    # Ejecutar tsc con redirección de error a output
    tsc --noEmit > $tscOutputFile 2>&1
    
    # Si llegamos hasta aquí sin error, no hay errores de TypeScript
    Write-Host "✅ No se detectaron errores iniciales." -ForegroundColor Green
    $initialErrors = 0
} catch {
    # Si existe el archivo de salida, intentamos leerlo
    if (Test-Path $tscOutputFile) {
        $output = Get-Content $tscOutputFile -Raw
        
        if ($output -match "Found (\d+) error") {
            $initialErrors = $Matches[1]
            Write-Host "⚠️ Se detectaron $initialErrors errores iniciales." -ForegroundColor Yellow
        } else {
            $initialErrors = "desconocido"
            Write-Host "⚠️ No se pudo determinar el número de errores iniciales." -ForegroundColor Yellow
        }
    } else {
        # Si el archivo no existe, creamos uno vacío y reportamos
        "Error al ejecutar tsc: $_" | Out-File -FilePath $tscOutputFile
        $initialErrors = "desconocido"
        Write-Host "⚠️ No se pudo ejecutar TypeScript. Revisa la configuración." -ForegroundColor Red
    }
}

# 4. Ejecutar el script maestro
Write-Host "`n🛠️ Ejecutando script de corrección masiva..." -ForegroundColor Green
Write-Host "  Este proceso puede tomar varios minutos dependiendo del tamaño del proyecto" -ForegroundColor DarkGray

try {
    node enhanced-master-fix.js
    $masterResult = $true
} catch {
    Write-Host "❌ Error ejecutando el script maestro: $_" -ForegroundColor Red
    $masterResult = $false
}

# 5. Verificar errores finales
if ($masterResult) {
    Write-Host "`n📊 Verificando errores TypeScript finales..." -ForegroundColor Green
    try {
        tsc --noEmit > .\logs\tsc-final.txt 2>&1
        Write-Host "✅ No hay errores TypeScript! Corrección completada exitosamente." -ForegroundColor Green
        $finalErrors = 0
    } catch {
        $output = Get-Content .\logs\tsc-final.txt -Raw
        if ($output -match "Found (\d+) error") {
            $finalErrors = $Matches[1]
            $difference = [int]$initialErrors - [int]$finalErrors
            
            if ($difference -gt 0) {
                Write-Host "✅ Se corrigieron $difference errores! Quedan $finalErrors por resolver." -ForegroundColor Green
            } else {
                Write-Host "⚠️ Aún hay $finalErrors errores por resolver." -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️ No se pudo determinar el número de errores finales." -ForegroundColor Yellow
        }
    }
}

# 6. Mostrar instrucciones finales
Write-Host "`n📝 Resumen del proceso:" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "- Errores iniciales: $initialErrors"
if ($masterResult) {
    Write-Host "- Errores finales: $finalErrors"
    if ([int]$initialErrors -gt [int]$finalErrors) {
        Write-Host "- Errores corregidos: $([int]$initialErrors - [int]$finalErrors)" -ForegroundColor Green
    }
}
Write-Host "- Informe detallado: logs/fix-summary.md" -ForegroundColor Green
Write-Host "- Documentación: docs/typescript-error-fixes.md" -ForegroundColor Green

Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Revisa el informe generado en logs/fix-summary.md"
Write-Host "2. Para errores persistentes, sigue las indicaciones en docs/typescript-error-fixes.md"
Write-Host "3. Ejecuta este script nuevamente para verificar el progreso"

Write-Host "`n✨ Proceso completado!" -ForegroundColor Cyan
