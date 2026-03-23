import { describe, it } from "@effect/vitest"
import { assertFailure, assertSuccess, assertTrue, strictEqual } from "@effect/vitest/utils"
import { Effect, Schema } from "effect"

describe("06-error-handling", () => {
  describe("Schema.TaggedErrorClass", () => {
    it("creates tagged errors with fields", () => {
      class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
        field: Schema.String,
        message: Schema.String,
      }) {}

      const error = new ValidationError({
        field: "email",
        message: "Invalid format",
      })

      strictEqual(error._tag, "ValidationError")
      strictEqual(error.field, "email")
      strictEqual(error.message, "Invalid format")
    })

    it("creates error unions", () => {
      class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
        field: Schema.String,
        message: Schema.String,
      }) {}

      class NotFoundError extends Schema.TaggedErrorClass("NotFoundError")("NotFoundError", {
        resource: Schema.String,
        id: Schema.String,
      }) {}

      const AppError = Schema.Union([ValidationError, NotFoundError])
      type AppError = typeof AppError.Type

      const error1: AppError = new ValidationError({
        field: "email",
        message: "Invalid",
      })
      const error2: AppError = new NotFoundError({
        resource: "User",
        id: "123",
      })

      strictEqual(error1._tag, "ValidationError")
      strictEqual(error2._tag, "NotFoundError")
    })
  })

  describe("catch", () => {
    it.effect("recovers from all errors", () =>
      Effect.gen(function* () {
        class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
          statusCode: Schema.Number,
          message: Schema.String,
        }) {}

        const program: Effect.Effect<string, HttpError> = Effect.fail(
          new HttpError({
            statusCode: 500,
            message: "Server error",
          }),
        )

        const recovered: Effect.Effect<string, never> = program.pipe(
          Effect.catch((error) => Effect.succeed(`Recovered from ${error._tag}`)),
        )

        const result = yield* recovered
        strictEqual(result, "Recovered from HttpError")
      }),
    )

    it.effect("handles multiple error types", () =>
      Effect.gen(function* () {
        class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
          statusCode: Schema.Number,
          message: Schema.String,
        }) {}

        class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
          message: Schema.String,
        }) {}

        const program = (useHttp: boolean): Effect.Effect<string, HttpError | ValidationError> => {
          if (useHttp) {
            return Effect.fail(new HttpError({ statusCode: 404, message: "Not found" }))
          }
          return Effect.fail(new ValidationError({ message: "Invalid input" }))
        }

        const recovered = (useHttp: boolean) =>
          program(useHttp).pipe(Effect.catch((error) => Effect.succeed(`Error: ${error._tag}`)))

        const result1 = yield* recovered(true)
        const result2 = yield* recovered(false)

        strictEqual(result1, "Error: HttpError")
        strictEqual(result2, "Error: ValidationError")
      }),
    )
  })

  describe("catchTag", () => {
    it.effect("catches specific error by tag", () =>
      Effect.gen(function* () {
        class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
          statusCode: Schema.Number,
          message: Schema.String,
        }) {}

        class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
          message: Schema.String,
        }) {}

        const program: Effect.Effect<string, HttpError | ValidationError> = Effect.fail(
          new HttpError({
            statusCode: 500,
            message: "Internal server error",
          }),
        )

        const recovered: Effect.Effect<string, ValidationError> = program.pipe(
          Effect.catchTag("HttpError", (error) => Effect.succeed(`HTTP ${error.statusCode}`)),
        )

        const result = yield* recovered
        strictEqual(result, "HTTP 500")
      }),
    )

    it.effect("preserves unhandled errors", () =>
      Effect.gen(function* () {
        class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
          statusCode: Schema.Number,
          message: Schema.String,
        }) {}

        class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
          message: Schema.String,
        }) {}

        const program: Effect.Effect<string, HttpError | ValidationError> = Effect.fail(
          new ValidationError({ message: "Bad input" }),
        )

        const recovered = program.pipe(
          Effect.catchTag("HttpError", () => Effect.succeed("Recovered from HTTP")),
          Effect.result,
        )

        const result = yield* recovered
        assertFailure(result, new ValidationError({ message: "Bad input" }))
      }),
    )
  })

  describe("catchTags", () => {
    it.effect("handles multiple error tags at once", () =>
      Effect.gen(function* () {
        class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
          statusCode: Schema.Number,
          message: Schema.String,
        }) {}

        class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
          message: Schema.String,
        }) {}

        const program = (errorType: "http" | "validation"): Effect.Effect<string, HttpError | ValidationError> => {
          if (errorType === "http") {
            return Effect.fail(new HttpError({ statusCode: 500, message: "Server error" }))
          }
          return Effect.fail(new ValidationError({ message: "Invalid" }))
        }

        const recovered = (errorType: "http" | "validation") =>
          program(errorType).pipe(
            Effect.catchTags({
              HttpError: () => Effect.succeed("Recovered from HttpError"),
              ValidationError: () => Effect.succeed("Recovered from ValidationError"),
            }),
          )

        const result1 = yield* recovered("http")
        const result2 = yield* recovered("validation")

        strictEqual(result1, "Recovered from HttpError")
        strictEqual(result2, "Recovered from ValidationError")
      }),
    )
  })

  describe("Schema.Defect", () => {
    it.effect("wraps unknown errors", () =>
      Effect.gen(function* () {
        class ApiError extends Schema.TaggedErrorClass("ApiError")("ApiError", {
          endpoint: Schema.String,
          statusCode: Schema.Number,
          error: Schema.Defect,
        }) {}

        const makeError = (message: string) =>
          Effect.fail(
            new ApiError({
              endpoint: "/api/users/123",
              statusCode: 500,
              error: new Error(message),
            }),
          )

        const result = yield* makeError("Network timeout").pipe(
          Effect.catch((error) =>
            Effect.succeed({
              tag: error._tag,
              endpoint: error.endpoint,
              hasError: error.error !== undefined,
            }),
          ),
        )

        strictEqual(result.tag, "ApiError")
        strictEqual(result.endpoint, "/api/users/123")
        assertTrue(result.hasError)
      }),
    )

    it("handles non-Error values", () => {
      class WrappedError extends Schema.TaggedErrorClass("WrappedError")("WrappedError", {
        value: Schema.Defect,
      }) {}

      const error1 = new WrappedError({ value: "string error" })
      const error2 = new WrappedError({ value: { code: 42 } })
      const error3 = new WrappedError({ value: new Error("real error") })

      strictEqual(error1._tag, "WrappedError")
      strictEqual(error2._tag, "WrappedError")
      strictEqual(error3._tag, "WrappedError")
    })
  })

  describe("Error Propagation", () => {
    it.effect("errors bubble up through Effect.gen", () =>
      Effect.gen(function* () {
        class AppError extends Schema.TaggedErrorClass("AppError")("AppError", {
          message: Schema.String,
        }) {}

        const failingStep = Effect.fail(new AppError({ message: "Step failed" }))

        const program = Effect.gen(function* () {
          yield* Effect.succeed(1)
          yield* failingStep // This fails
          yield* Effect.succeed(3) // Never executed
          return "done"
        })

        const result = yield* program.pipe(Effect.result)

        assertFailure(result, new AppError({ message: "Step failed" }))
      }),
    )

    it.effect("can transform errors", () =>
      Effect.gen(function* () {
        class OriginalError extends Schema.TaggedErrorClass("OriginalError")("OriginalError", {
          code: Schema.Number,
        }) {}

        class TransformedError extends Schema.TaggedErrorClass("TransformedError")("TransformedError", {
          originalCode: Schema.Number,
          message: Schema.String,
        }) {}

        const program = Effect.fail(new OriginalError({ code: 404 }))

        const transformed = program.pipe(
          Effect.catchTag("OriginalError", (error) =>
            Effect.fail(
              new TransformedError({
                originalCode: error.code,
                message: `Error code: ${error.code}`,
              }),
            ),
          ),
        )

        const result = yield* transformed.pipe(Effect.result)

        assertFailure(
          result,
          new TransformedError({
            originalCode: 404,
            message: "Error code: 404",
          }),
        )
      }),
    )
  })

  describe("Success Cases", () => {
    it.effect("returns Success for successful effects", () =>
      Effect.gen(function* () {
        class MyError extends Schema.TaggedErrorClass("MyError")("MyError", {
          message: Schema.String,
        }) {}

        const program: Effect.Effect<string, MyError> = Effect.succeed("success")

        const result = yield* program.pipe(Effect.result)

        assertSuccess(result, "success")
      }),
    )
  })
})
