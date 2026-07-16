#!/usr/bin/env bun

import { runIsolatedCommand } from './run-tests-isolated';

const toolingTestFiles = [
	'scripts/safety-contracts.test.ts',
	'scripts/local-session-security.test.ts',
	'scripts/local-app-broker.test.ts',
	'scripts/authorized-roots.test.ts',
	'scripts/authorized-file-mutation.test.ts',
	'scripts/authorized-files-routes.test.ts',
	'scripts/output-redaction-security.test.ts',
	'scripts/db/database-safety.test.ts',
	'scripts/db/export-schema.test.ts',
	'scripts/db/legacy-adoption.test.ts',
	'scripts/db/migrations.test.ts',
	'scripts/db/orphan-inventory.test.ts',
	'scripts/db/relational-integrity.test.ts',
	'scripts/db/upgrade.test.ts',
	'scripts/db/reset.test.ts',
	'scripts/db/backup-retention.test.ts',
];

const exitCode = await runIsolatedCommand({
	command: [process.execPath, 'test', '--timeout', '120000', ...toolingTestFiles],
});

process.exitCode = exitCode;
