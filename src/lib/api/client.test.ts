import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./client";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("ApiClient response and mutation contracts", () => {
	it("sends DELETE bodies and treats 204 as a successful void response", async () => {
		const fetchMock = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 204 }),
		);
		vi.stubGlobal("fetch", fetchMock);
		const client = new ApiClient({ timeout: 1_000 });

		await expect(
			client.delete<void>("/taxonomy-artifacts/note/note-1", { expectedHash: "a".repeat(64) }),
		).resolves.toBe(undefined);
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			body: JSON.stringify({ expectedHash: "a".repeat(64) }),
			method: "DELETE",
		});
	});

	it("clears the timeout when fetch rejects", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => Promise.reject(new Error("offline"))),
		);
		const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
		const client = new ApiClient({ timeout: 1_000 });

		await expect(client.get("/probe")).rejects.toThrow("offline");
		expect(clearTimeoutSpy).toHaveBeenCalledOnce();
	});
});
