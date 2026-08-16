#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function detectToolFromFileName(filePath) {
	const name = path.basename(filePath).toLowerCase();
	if (name.includes('tsc') || name.includes('typescript')) return 'tsc';
	if (name.includes('oxlint') || name.includes('oxfmt') || name.includes('vite-plus') || name.includes('vp-'))
		return 'oxc';
	if (name.includes('eslint')) return 'eslint';
	if (name.includes('prettier')) return 'prettier';
	if (name.includes('playwright')) return 'playwright';
	return 'unknown';
}

function stripAnsi(line) {
	return line.replace(/\u001b\[[0-9;]*m/g, '');
}

function normalizeLine(line) {
	const markers = ['📋', '❌', '⚠️', '✅', '🔍', '🔴', '🟢', '🟡'];
	let normalized = stripAnsi(line).trimStart();
	let changed = true;

	while (changed) {
		changed = false;
		for (const marker of markers) {
			if (normalized.startsWith(marker)) {
				normalized = normalized.slice(marker.length).trimStart();
				changed = true;
			}
		}
	}

	return normalized.trim();
}

function isErrorLine(line, toolHint) {
	const s = normalizeLine(line);
	const lower = s.toLowerCase();

	if (toolHint === 'tsc') {
		return /\berror\s+ts\d+:/i.test(s) || /^found\s+\d+\s+errors?/i.test(s);
	}

	if (toolHint === 'oxc') {
		return /^x\s+/i.test(s) || /^failed to parse/i.test(s) || /^found\s+[1-9]\d*\s+errors?/i.test(s);
	}

	if (toolHint === 'playwright') {
		return /^(\d+\)\s+|error:|failed\b)/i.test(s) || /\bfailed\b/i.test(s);
	}

	return (
		/\berror\s+ts\d+:/i.test(s) ||
		/^error[:\s]/i.test(s) ||
		/^failed\b/i.test(s) ||
		lower.includes('error al ejecutar comando')
	);
}

function isWarningLine(line, toolHint) {
	const s = normalizeLine(line);

	if (toolHint === 'oxc') {
		return /^!\s+/i.test(s) || /^found\s+\d+\s+warnings?/i.test(s);
	}

	return /^warning[:\s]/i.test(s) || /\bwarn(?:ing)?\b/i.test(s);
}

export function parseLogFile(logFile, toolHint = 'unknown') {
	if (!(logFile && existsSync(logFile))) return null;
	const content = readFileSync(logFile, 'utf8');
	const lines = content.split(/\r?\n/);

	const errors = [];
	const warnings = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (isErrorLine(trimmed, toolHint)) errors.push(normalizeLine(trimmed));
		else if (isWarningLine(trimmed, toolHint)) warnings.push(normalizeLine(trimmed));
	}

	const stats = {
		tool: toolHint,
		totalLines: lines.length,
		totalErrors: errors.length,
		totalWarnings: warnings.length,
		firstErrors: errors.slice(0, 5),
		firstWarnings: warnings.slice(0, 5),
	};

	return { stats, errors, warnings };
}

export function displaySimpleErrorSummary(summary) {
	if (!summary?.stats) return;
	const { tool, totalErrors, totalWarnings, firstErrors, firstWarnings } = summary.stats;
	console.log('');
	console.log('==========================================================');
	console.log(`Resumen (${tool}) -> errores: ${totalErrors}, warnings: ${totalWarnings}`);
	if (totalErrors > 0) {
		console.log('Primeros errores:');
		for (const line of firstErrors) console.log(`  - ${line}`);
	}
	if (totalWarnings > 0) {
		console.log('Primeros warnings:');
		for (const line of firstWarnings) console.log(`  - ${line}`);
	}
	console.log('==========================================================');
}

export function generateLogSummary(summary) {
	if (!summary?.stats) return 'No se pudo generar resumen.';
	const { tool, totalErrors, totalWarnings, firstErrors, firstWarnings } = summary.stats;
	const parts = [];
	parts.push('RESUMEN DE ERRORES/WARNINGS');
	parts.push(`Herramienta: ${tool}`);
	parts.push(`Errores: ${totalErrors}`);
	parts.push(`Warnings: ${totalWarnings}`);
	parts.push('');
	if (firstErrors?.length) {
		parts.push('Errores (primeros):');
		for (const error of firstErrors) parts.push(`  - ${error}`);
		parts.push('');
	}
	if (firstWarnings?.length) {
		parts.push('Warnings (primeros):');
		for (const warning of firstWarnings) parts.push(`  - ${warning}`);
		parts.push('');
	}
	return parts.join('\n');
}
