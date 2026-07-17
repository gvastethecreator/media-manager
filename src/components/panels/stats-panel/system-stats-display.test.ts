import { describe, expect, it } from "vitest";
import { isAuthorizedStatsScopeUnavailable } from "./system-stats-display";

describe("system stats authorized scope state", () => {
	it("treats the retired global aggregate as a scoped empty state, not an operational failure", () => {
		expect(
			isAuthorizedStatsScopeUnavailable(
				new Error('Error en API call: HTTP 410: {"code":"AUTHORIZED_SCOPE_REQUIRED","message":"Scope required"}'),
			),
		).toBe(true);
		expect(isAuthorizedStatsScopeUnavailable(new Error("HTTP 500"))).toBe(false);
		expect(isAuthorizedStatsScopeUnavailable(null)).toBe(false);
	});
});
