#!/usr/bin/env pwsh

Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "d:\DEV\image-manager"

# Verificar que pnpm está disponible
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: pnpm no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar que existe package.json
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json en el directorio actual" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
pnpm install

Write-Host "🔧 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
pnpm dev
