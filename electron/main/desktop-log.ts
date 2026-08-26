import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function writeDesktopLog(userDataDir: string, message: string): void {
	try {
		mkdirSync(userDataDir, { recursive: true });
		appendFileSync(join(userDataDir, 'desktop-main.log'), `${new Date().toISOString()} ${message}\n`);
	} catch {
		// File logging is best-effort for packaged diagnosis.
	}
	console.log(message);
}
