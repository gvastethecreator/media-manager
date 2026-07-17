import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("development server environment precedence", () => {
	it("keeps explicit supervisor variables above repository env files", async () => {
		const source = await readFile(resolve(import.meta.dir, "dev-server-hot.js"), "utf8");
		const merge = source.match(/const configuredServerEnv = \{([\s\S]*?)\n\};/)?.[1] ?? "";
		expect(merge).toContain("...defaultEnv");
		expect(merge).toContain("...tauriEnv");
		expect(merge).toContain("...process.env");
		expect(merge.indexOf("...defaultEnv")).toBeLessThan(merge.indexOf("...tauriEnv"));
		expect(merge.indexOf("...tauriEnv")).toBeLessThan(merge.indexOf("...process.env"));
	});
});
