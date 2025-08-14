#!/usr/bin/env bun
/**
 * Script de instalación masiva de componentes REUI + shadcn.
 * Ejecuta secuencialmente comandos del tipo:
 *   bunx --bun shadcn@latest add https://reui.io/r/<slug>.json --overwrite
 * Opciones:
 *   FILTER=pattern   Solo instala slugs que contengan el patrón (case-insensitive)
 *   DRY_RUN=1        Solo muestra qué haría, sin ejecutar
 *   CONTINUE_ON_ERROR=1  No aborta ante fallos (obsoleto, default ya es continuar)
 *   ABORT_ON_FAIL=1      Aborta ante el primer fallo que no sea 'not-found'
 *   RETRIES=2        Reintentos por componente (default 1 = sin reintentos extra)
 *   PRECHECK=1       Realiza una petición HEAD para verificar existencia antes de instalar
 *   VERBOSE=1        Muestra más detalles de skips/errores
 */

import { $ } from 'bun';

// Pequeño logger central para evitar múltiples 'console' directos (lint friendly)
// biome-ignore lint/suspicious/noConsole: salida de script CLI
const log = (...args: unknown[]) => console.log(...args);
// biome-ignore lint/suspicious/noConsole: salida de script CLI
const logErr = (...args: unknown[]) => console.error(...args);
// biome-ignore lint/suspicious/noConsole: salida de script CLI
const logWarn = (...args: unknown[]) => console.warn(...args);

// Lista deduplicada de slugs inferidos de la petición del usuario
// Categorías para claridad
const core = [
  'accordion',
  'accordion-menu',
  'alert',
  'alert-dialog',
  'avatar',
  'badge',
  'breadcrumb',
  'button',
  'calendar',
  'card',
  'carousel',
  'chart',
  'checkbox',
  'collapsible',
  'command',
  'combobox',
  'context-menu',
  'code',
  'data-grid',
  'date-picker',
  'dialog',
  'drawer',
  'dropdown-menu',
  'form',
  'file-upload',
  'hover-card',
  'input',
  'kanban',
  'kbd',
  'label',
  'navigation-menu',
  'pagination',
  'popover',
  'progress',
  'radio-group',
  'resizable',
  'scroll-area',
  'stepper',
  'scrollspy',
  'select',
  'separator',
  'sheet',
  'skeleton',
  'slider',
  'sonner',
  'switch',
  'table',
  'tabs',
  'textarea',
  'tooltip',
  'toggle',
  'toggle-group',
  'tree',
];

// Base UI (repetidos algunos arriba, se filtrarán)
const baseUi = [
  'base-accordion',
  'base-alert-dialog',
  'base-avatar',
  'base-badge',
  'base-breadcrumb',
  'base-button',
  'base-checkbox',
  'base-collapsible',
  'base-input',
];

// Efectos especiales
const specialEffects = [
  'marquee',
  'github-button',
  'avatar-group',
  'text-animations',
  'typing-text',
  'word-rotate',
  'video-text',
  'svg-text',
  'counting-number',
  'sliding-number',
  'shimmering-text',
  'text-reveal',
];

// Fondos
const backgrounds = [
  'gradient-background',
  'grid-background',
  'hover-background',
];

// Construir lista final única
let all = [...core, ...baseUi, ...specialEffects, ...backgrounds];
all = Array.from(new Set(all));

const filter = process.env.FILTER?.toLowerCase();
if (filter) {
  all = all.filter((s) => s.toLowerCase().includes(filter));
}

// Parseo de argumentos KEY=VALUE además de variables de entorno
for (const arg of process.argv.slice(2)) {
  if (arg.includes('=')) {
    const [k, v] = arg.split('=');
    if (k && v !== undefined) {
      process.env[k.toUpperCase()] = v;
    }
  }
}

const dryRun = process.env.DRY_RUN === '1';
// Compat: si usuario define CONTINUE_ON_ERROR=1 respeta; por defecto continuamos.
const abortOnFail = process.env.ABORT_ON_FAIL === '1';
const retries = Number(process.env.RETRIES ?? '1');
const precheck = process.env.PRECHECK === '1';
const verbose = process.env.VERBOSE === '1';

// Aliases / fallback slugs cuando un slug principal no existe
const slugFallbacks: Record<string, string[]> = {
  combobox: ['combo-box'],
  'data-grid': ['datagrid', 'data-table'],
  'text-animations': ['text-animation'],
  'avatar-group': ['avatars'],
};

interface Result {
  slug: string;
  status: 'installed' | 'skipped-not-found' | 'failed';
  attempts: number;
  message?: string;
  usedSlug?: string; // slug realmente usado (alias)
}

const results: Result[] = [];

async function existsSlug(slug: string): Promise<boolean> {
  if (!precheck || dryRun) {
    return true;
  }
  const url = `https://reui.io/r/${slug}.json`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function tryInstallSingleSlug(
  slug: string
): Promise<{ ok: boolean; message?: string }> {
  const url = `https://reui.io/r/${slug}.json`;
  const cmd = ['bunx', '--bun', 'shadcn@latest', 'add', url, '--overwrite'];
  log('\n>', cmd.join(' '));
  if (dryRun) {
    return { ok: true, message: 'dry-run' };
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // biome-ignore lint: ejecución secuencial requerida
      await $`${cmd}`;
      log(`✔ ${slug}`);
      return { ok: true };
    } catch (err: unknown) {
      const text = String(err);
      if (text.includes('was not found')) {
        return { ok: false, message: 'not-found' };
      }
      logErr(`✖ Falló ${slug} (intento ${attempt}/${retries})`);
      if (attempt === retries) {
        return { ok: false, message: 'failed' };
      }
      log('Reintentando...');
    }
  }
  return { ok: false, message: 'failed' };
}

function record(result: Result) {
  results.push(result);
}

async function attemptPrimary(
  slug: string
): Promise<'installed' | 'not-found' | 'failed' | 'skipped'> {
  if (!(await existsSlug(slug))) {
    if (verbose) {
      logWarn(`[precheck] No existe slug primario ${slug}`);
    }
    return 'not-found';
  }
  const r = await tryInstallSingleSlug(slug);
  if (r.ok) {
    record({ slug, status: 'installed', attempts: retries });
    return 'installed';
  }
  if (r.message === 'not-found') {
    if (verbose) {
      logWarn(`Slug no encontrado: ${slug}`);
    }
    return 'not-found';
  }
  if (r.message === 'failed') {
    record({ slug, status: 'failed', attempts: retries, message: r.message });
    if (abortOnFail) {
      throw new Error(`Abortando por fallo en ${slug}`);
    }
    return 'failed';
  }
  return 'skipped';
}

async function handleFallbackSlug(
  original: string,
  fb: string
): Promise<'installed' | 'not-found' | 'failed' | 'skip'> {
  if (precheck) {
    const ok = await existsSlug(fb);
    if (!ok) {
      if (verbose) {
        logWarn(`[precheck] alias ${fb} inexistente`);
      }
      return 'skip';
    }
  }
  const rr = await tryInstallSingleSlug(fb);
  if (rr.ok) {
    record({
      slug: original,
      status: 'installed',
      attempts: retries,
      usedSlug: fb,
    });
    return 'installed';
  }
  if (rr.message === 'not-found') {
    if (verbose) {
      logWarn(`Alias no encontrado: ${fb}`);
    }
    return 'not-found';
  }
  if (rr.message === 'failed') {
    record({
      slug: original,
      status: 'failed',
      attempts: retries,
      message: rr.message,
      usedSlug: fb,
    });
    if (abortOnFail) {
      throw new Error(`Abortando por fallo en alias ${fb}`);
    }
    return 'failed';
  }
  return 'skip';
}

async function attemptFallbacks(
  slug: string
): Promise<'installed' | 'not-found' | 'failed'> {
  const fallbacks = [...(slugFallbacks[slug] ?? [])];
  async function next(): Promise<'installed' | 'not-found' | 'failed'> {
    const fb = fallbacks.shift();
    if (!fb) {
      return 'not-found';
    }
    const res = await handleFallbackSlug(slug, fb);
    if (res === 'installed' || res === 'failed') {
      return res;
    }
    return next();
  }
  return await next();
}

async function install(slug: string) {
  const primary = await attemptPrimary(slug);
  if (primary === 'installed' || primary === 'failed') {
    return;
  }
  if (primary === 'not-found') {
    const fb = await attemptFallbacks(slug);
    if (fb === 'installed' || fb === 'failed') {
      return;
    }
  }
  // si llegamos aquí, no se instaló
  record({
    slug,
    status: 'skipped-not-found',
    attempts: 0,
    message: 'no slug or alias found',
  });
  logWarn(`⏭  Omitido ${slug} (no encontrado)`);
}

(async () => {
  log(`Instalando ${all.length} componentes REUI${dryRun ? ' (DRY RUN)' : ''}`);
  const started = Date.now();
  for (const slug of all) {
    // biome-ignore lint: instalación orden secuencial
    await install(slug);
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const installed = results.filter((r) => r.status === 'installed');
  const skipped = results.filter((r) => r.status === 'skipped-not-found');
  const failed = results.filter((r) => r.status === 'failed');
  log(`\nFin. Tiempo total: ${secs}s`);
  log('Resumen:');
  log(`  Instalados: ${installed.length}`);
  log(`  Omitidos (no encontrados): ${skipped.length}`);
  log(`  Fallidos: ${failed.length}`);
  if (verbose) {
    if (skipped.length) {
      log(`  Lista omitidos: ${skipped.map((s) => s.slug).join(', ')}`);
    }
    if (failed.length) {
      log(`  Lista fallidos: ${failed.map((s) => s.slug).join(', ')}`);
    }
  }
})();
