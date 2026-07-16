#!/usr/bin/env bun

import { runIsolatedCommand } from './run-tests-isolated';

const toolingTestFiles = [
	'scripts/safety-contracts.test.ts',
	'scripts/local-session-security.test.ts',
	'scripts/local-app-broker.test.ts',
	'scripts/authorized-roots.test.ts',
	'scripts/authorized-file-mutation.test.ts',
	'scripts/image-canonical-media-reference.test.ts',
	'scripts/video-canonical-media-reference.test.ts',
	'scripts/video-canonical-http.test.ts',
	'scripts/image-canonical-http.test.ts',
	'scripts/image-canonical-root-registry.test.ts',
	'scripts/authorized-files-routes.test.ts',
	'scripts/output-redaction-security.test.ts',
	'scripts/db/database-safety.test.ts',
	'scripts/db/export-schema.test.ts',
	'scripts/db/legacy-adoption.test.ts',
	'scripts/db/migrations.test.ts',
	'scripts/db/image-asset-link-schema.test.ts',
	'scripts/db/media-specialization-asset-link-schema.test.ts',
	'scripts/db/image-asset-reconciliation.test.ts',
	'scripts/db/orphan-inventory.test.ts',
	'scripts/db/relational-integrity.test.ts',
	'scripts/db/upgrade.test.ts',
	'scripts/db/reset.test.ts',
	'scripts/db/backup-retention.test.ts',
];
const requestedTestFiles = process.argv.slice(2);
const selectedTestFiles = requestedTestFiles.length > 0 ? requestedTestFiles : toolingTestFiles;

const exitCode = await runIsolatedCommand({
	command: [process.execPath, 'test', '--timeout', '120000', ...selectedTestFiles],
});

process.exitCode = exitCode;
