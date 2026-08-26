# Effect-TS troubleshooting guide

**Date:** 11 October 2025  
**Version:** 1.0  
**Context:** Guide for common problems in Effect-TS implementation

---

## Contents

1. [Drizzle integration issues](#drizzle-integration-issues)
2. [Test environment issues](#test-environment-issues)
3. [Schema validation issues](#schema-validation-issues)
4. [TaggedError issues](#taggederror-issues)
5. [Performance issues](#performance-issues)
6. [Type issues](#type-issues)

---

## Drizzle integration issues

### Issue 1: "then is not a function" in Effect.tryPromise

**Symptom:**

```
TypeError: evaluate().then is not a function
```

**Cause:**
Drizzle with the `libsql` driver returns thenable query builders. They have a `.then()` method. They are not true Promises until they are awaited.

**Solution:**

```typescript
// INCORRECT
const result =
	yield *
	Effect.tryPromise({
		try: () => db.select().from(albums).where(eq(albums.id, id)),
	});

// CORRECT
const result =
	yield *
	Effect.tryPromise({
		try: async () => await db.select().from(albums).where(eq(albums.id, id)),
		catch: (error) => fromUnknownError('operation', error),
	});
```

**Explanation:**

- `async () => await query` forces Promise resolution.
- The `await` converts the thenable into a real Promise.
- Effect.tryPromise needs a function that returns a Promise, not a thenable.

**Apply to:** All database operations with Drizzle + libsql

---

### Issue 2: Query runs but returns an empty array

**Symptom:**

```typescript
const albums = await service.create({ name: 'Test' });
console.log(albums); // []
```

**Cause:**
The query runs against the wrong database (mock instead of real).

**Diagnosis:**

```typescript
// Add temporary logs
console.log('[DEBUG] DB Client type:', db.constructor.name);
console.log('[DEBUG] Insert result:', result);
```

**Solution:**
Verify that environment detection uses the real DB in tests:

```typescript
const isServerOrTest =
	typeof process !== 'undefined' &&
	(typeof window === 'undefined' || process.env.NODE_ENV === 'test' || typeof (globalThis as any).Bun !== 'undefined');
```

---

## Test environment issues

### Issue 3: Tests use a mock DB when they must use a real one

**Symptom:**
Tests insert data, but SELECT queries return empty. Generated IDs look like "mock-id-XXX".

**Cause:**
`tests/setup.ts` defines a global `window` for jsdom. That breaks the `typeof window === 'undefined'` condition.

**Solution:**
In `src/lib/drizzle/index.ts`:

```typescript
// INCORRECT
if (typeof window === 'undefined') {
	// Server: uses real DB
} else {
	// Browser: uses mock
}

// CORRECT
const isServerOrTest =
	typeof process !== 'undefined' &&
	(typeof window === 'undefined' || process.env.NODE_ENV === 'test' || typeof (globalThis as any).Bun !== 'undefined');

if (isServerOrTest) {
	// Server or test: uses real DB
} else {
	// Browser: uses mock
}
```

**Verification:**

```bash
bun test src/services/album/__tests__/album.service.effect.test.ts

# Logs must show real IDs:
# "juO3ZL-S7P3gZe_xoqQl-"
# not "mock-id-1234567890"
```

---

### Issue 4: Tests fail with "window is not defined"

**Symptom:**

```
ReferenceError: window is not defined
```

**Cause:**
Code running in Node.js or Bun tries to access `window`.

**Solution:**
Use defensive detection:

```typescript
// INCORRECT
if (window.location.href) {
	// browser code
}

// CORRECT
if (typeof window !== 'undefined' && window.location?.href) {
	// browser code
}
```

---

## Schema validation issues

### Issue 5: "Expected UUID, actual [nanoid]"

**Symptom:**

```
AlbumValidationError: Expected UUID, actual "juO3ZL-S7P3gZe_xoqQl-"
```

**Cause:**
The schema uses a strict `UUID` type (format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). The DB generates IDs with nanoid (21 alphanumeric chars).

**Solution:**
Create a generic `ID` type in `src/lib/effect/schemas/common.ts`:

```typescript
export const ID = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(30)).annotations({
	identifier: 'ID',
	title: 'Entity Identifier',
	description: 'Unique identifier (nanoid format)',
});
```

Update entity schemas:

```typescript
// INCORRECT
export const Album = Schema.Struct({
	id: UUID, // Too strict
	// ...
});

// CORRECT
export const Album = Schema.Struct({
	id: ID, // Accepts nanoid
	// ...
});
```

**When to use each one:**

- `ID`: For primary keys generated with nanoid (most cases)
- `UUID`: Only if the ID must be specifically UUID v4 format

---

### Issue 6: Schema.decodeUnknownSync with Effect.tryPromise

**Symptom:**

```
Error: decodeUnknownSync is not async but wrapped in tryPromise
```

**Cause:**
`Schema.decodeUnknownSync` is synchronous. Do not wrap it in `Effect.tryPromise`.

**Solution:**

```typescript
// INCORRECT - tryPromise for sync
const validated = yield* Effect.tryPromise({
  try: () => Schema.decodeUnknownSync(Album)(data),
  catch: (error) => new ValidationError(...)
});

// CORRECT - Effect.try for sync
const validated = yield* Effect.try({
  try: () => Schema.decodeUnknownSync(Album)(data),
  catch: (error) => new AlbumValidationError({
    field: 'album',
    message: 'Error validating data',
    value: data,
  }),
});
```

**General rule:**

- `Effect.tryPromise` for **asynchronous** operations (DB, HTTP, file I/O)
- `Effect.try` for **synchronous** operations (validation, parsing, transform)

---

## TaggedError issues

### Issue 7: displayMessage returns an empty string

**Symptom:**

```typescript
const error = new AlbumNotFound({ albumId: 'test-123' });
console.log(error.displayMessage); // ""  ← empty
```

**Cause:**
The optional field `message?: string` does not exist on the instance if it is not provided. The getter fails silently.

**Solution:**

```typescript
// INCORRECT - optional field causes problems
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
	readonly albumId: string;
	readonly message?: string; // Problematic optional
}> {
	get displayMessage(): string {
		return this.message ?? `Album not found: ${this.albumId}`;
	}
}

// CORRECT - required fields only
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
	readonly albumId: string; // Required only
}> {
	get displayMessage(): string {
		return `Album not found: ${this.albumId}`;
	}
}
```

**Rule:**

- Do not use optional fields in TaggedError getters.
- If you need a custom message, make it a **required** field:

  ```typescript
  export class CustomError extends Data.TaggedError('CustomError')<{
  	readonly context: string;
  	readonly customMessage: string; // Required, not optional
  }> {
  	get displayMessage(): string {
  		return `${this.context}: ${this.customMessage}`;
  	}
  }
  ```

---

### Issue 8: Error cannot be serialized to JSON

**Symptom:**

```
Error: Cannot convert circular structure to JSON
```

**Cause:**
TaggedError with circular references or methods that cannot be serialized.

**Solution:**
Add a `toJSON` method:

```typescript
export class AlbumError extends Data.TaggedError('AlbumError')<{
	readonly albumId: string;
	readonly details: unknown;
}> {
	get displayMessage(): string {
		return `Error with album: ${this.albumId}`;
	}

	toJSON() {
		return {
			_tag: this._tag,
			albumId: this.albumId,
			message: this.displayMessage,
			// Avoid serializing 'details' if it can have circular references
		};
	}
}
```

---

## Performance issues

### Issue 9: Validation is very slow in requests

**Symptom:**
The request takes more than 100ms extra after Effect validation is added.

**Diagnosis:**

```typescript
const start = performance.now();
const validated =
	yield *
	Effect.try({
		try: () => Schema.decodeUnknownSync(LargeSchema)(data),
	});
console.log(`Validation took: ${performance.now() - start}ms`);
```

**Solutions:**

**A) Use decode instead of decodeUnknownSync:**

```typescript
// Faster if data is already partially validated
Schema.decode(Album)(data);
```

**B) Cache of compiled schemas:**

```typescript
// Compile the schema once
const decodeAlbum = Schema.decodeUnknownSync(Album);

// Reuse the compiled function
const validated = decodeAlbum(data);
```

**C) Lazy validation for large fields:**

```typescript
export const AlbumWithLargeMetadata = Schema.Struct({
	id: ID,
	name: NonEmptyString,
	metadata: Schema.Lazy(() => LargeMetadataSchema), // Validates only if accessed
});
```

---

### Issue 10: Memory leak in tests

**Symptom:**
Tests consume more and more memory. They eventually fail with OOM.

**Cause:**
Data is not cleaned between tests. References are retained.

**Solution:**

```typescript
describe('AlbumService', () => {
	afterEach(async () => {
		// Clean tables
		await db.delete(albums);
		await db.delete(imageAlbums);

		// If you use cache or stores
		cache.clear();
	});

	afterAll(async () => {
		// Close connections
		await db.close();
	});
});
```

---

## Type issues

### Issue 11: Type mismatch between Effect.gen and a normal function

**Symptom:**

```
Type 'Effect<Album, AlbumError, AlbumService>' is not assignable to type 'Promise<Album>'
```

**Cause:**
Mixing Effect and async/await without conversion.

**Solution:**

```typescript
// INCORRECT - Effect without execution
async function getAlbum(id: string): Promise<Album> {
	return Effect.gen(function* () {
		const service = yield* AlbumService;
		return yield* service.getById(id);
	}); // Returns Effect, not Promise
}

// CORRECT - Run Effect with runPromise
async function getAlbum(id: string): Promise<Album> {
	const effect = Effect.gen(function* () {
		const service = yield* AlbumService;
		return yield* service.getById(id);
	});

	return Effect.runPromise(Effect.provide(effect, AlbumServiceLive));
}
```

---

### Issue 12: Cannot find name 'yield\*'

**Symptom:**

```
Error: Cannot find name 'yield'
Property 'yield' does not exist
```

**Cause:**
The function is not a generator, or `function*` is missing.

**Solution:**

```typescript
// INCORRECT - normal function
Effect.gen(() => {
	const service = yield * AlbumService; // Error
});

// CORRECT - generator function
Effect.gen(function* () {
	const service = yield* AlbumService; // OK
});
```

---

## General troubleshooting checklist

When you find an Effect error:

1. **Verify the operation type:**
   - [ ] Is it async? Use `Effect.tryPromise`.
   - [ ] Is it sync? Use `Effect.try`.
   - [ ] Is it a DB query? Add `async () => await`.

2. **Verify the environment:**
   - [ ] Do tests use a real DB? Check `isServerOrTest`.
   - [ ] Do logs show correct IDs? They must be nanoid, not "mock-id".

3. **Verify schemas:**
   - [ ] Do IDs use the correct type? Use `ID`, not `UUID`.
   - [ ] Does the schema compile correctly? Test with `Schema.decodeUnknownSync`.

4. **Verify errors:**
   - [ ] Is TaggedError free of optional fields? Use required fields only.
   - [ ] Does displayMessage work? Test it manually.

5. **Verify tests:**
   - [ ] Is there cleanup after each test? Use `afterEach(() => db.delete(...))`.
   - [ ] Are helpers reusable? Use `runEffect` and `runEffectExpectFailure`.

---

## References

The following references support this guide:

- [Effect Documentation](https://effect.website/docs/introduction)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Effect Schema Guide](https://effect.website/docs/schema/introduction)
- Implementation: `docs/EFFECT-PHASE-2-PLAN.md`
- Patterns: section "Critical patterns discovered"

---

**Last update:** 2025-10-11  
**Maintained by:** Effect Implementation team  
**Contribute:** Add found issues with verified solutions
