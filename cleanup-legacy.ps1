# Script de PowerShell para eliminar archivos legacy del file-browser
Write-Host "🧹 Limpiando archivos legacy del file-browser..." -ForegroundColor Yellow

# Verificar que la carpeta legacy existe
$legacyPath = "src\components\features\file-browser\views\legacy"
if (Test-Path $legacyPath) {
    Write-Host "📁 Encontrada carpeta legacy: $legacyPath" -ForegroundColor Green
    
    # Listar archivos antes de eliminar
    Write-Host "📋 Archivos a eliminar:" -ForegroundColor Cyan
    Get-ChildItem $legacyPath | ForEach-Object { Write-Host "  - $($_.Name)" }
    
    # Eliminar la carpeta completa
    Remove-Item $legacyPath -Recurse -Force
    Write-Host "✅ Archivos legacy eliminados exitosamente" -ForegroundColor Green
    
    # Verificar eliminación
    if (-not (Test-Path $legacyPath)) {
        Write-Host "✅ Verificación: Carpeta legacy eliminada correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: La carpeta legacy aún existe" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No se encontró la carpeta legacy en: $legacyPath" -ForegroundColor Red
}

Write-Host "🎉 Limpieza completada!" -ForegroundColor Green