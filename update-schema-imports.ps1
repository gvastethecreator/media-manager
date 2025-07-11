# Script para actualizar todas las importaciones del esquema de Drizzle
# De '@/lib/drizzle/schema' a '@/lib/drizzle/schema/index'

$sourceDir = "src"
$oldPattern = "@/lib/drizzle/schema'"
$newPattern = "@/lib/drizzle/schema/index'"
$oldPattern2 = '@/lib/drizzle/schema"'
$newPattern2 = '@/lib/drizzle/schema/index"'

# Buscar todos los archivos TypeScript
$files = Get-ChildItem -Path $sourceDir -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.FullName -notlike "*node_modules*" }

$updatedFiles = @()

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Reemplazar importaciones con comillas simples
    $content = $content -replace [regex]::Escape($oldPattern), $newPattern
    
    # Reemplazar importaciones con comillas dobles
    $content = $content -replace [regex]::Escape($oldPattern2), $newPattern2
    
    # Si hubo cambios, escribir el archivo
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedFiles += $file.FullName
        Write-Host "Actualizado: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nArchivos actualizados: $($updatedFiles.Count)" -ForegroundColor Yellow
foreach ($file in $updatedFiles) {
    Write-Host "  - $file" -ForegroundColor Cyan
}

Write-Host "`n✅ Actualización completada!" -ForegroundColor Green