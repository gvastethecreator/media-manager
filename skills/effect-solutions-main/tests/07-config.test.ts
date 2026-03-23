import { describe, it } from "@effect/vitest"
import { assertSome, assertTrue, strictEqual } from "@effect/vitest/utils"
import { Config, ConfigProvider, Effect, Layer, Redacted, Schema, ServiceMap } from "effect"

describe("07-config", () => {
  describe("Basic Config Usage", () => {
    it.effect("reads from ConfigProvider", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const apiKey = yield* Config.redacted("API_KEY")
          const port = yield* Config.int("PORT")
          return { apiKey: Redacted.value(apiKey), port }
        })

        const testConfigProvider = ConfigProvider.fromUnknown({
          API_KEY: "test-key-123",
          PORT: "3000",
        })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfigProvider)))

        strictEqual(result.apiKey, "test-key-123")
        strictEqual(result.port, 3000)
      }),
    )

    it.effect("handles multiple config values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const host = yield* Config.string("HOST")
          const port = yield* Config.int("PORT")
          const debug = yield* Config.boolean("DEBUG")
          return { host, port, debug }
        })

        const testConfig = ConfigProvider.fromUnknown({
          HOST: "localhost",
          PORT: "8080",
          DEBUG: "true",
        })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result.host, "localhost")
        strictEqual(result.port, 8080)
        strictEqual(result.debug, true)
      }),
    )
  })

  describe("Config Layer Pattern", () => {
    it.effect("creates config service with layer", () =>
      Effect.gen(function* () {
        class ApiConfig extends ServiceMap.Service<
          ApiConfig,
          {
            readonly apiKey: Redacted.Redacted<string>
            readonly baseUrl: string
            readonly timeout: number
          }
        >()("@app/ApiConfig") {
          static readonly layer = Layer.effect(
            ApiConfig,
            Effect.gen(function* () {
              const apiKey = yield* Config.redacted("API_KEY")
              const baseUrl = yield* Config.string("API_BASE_URL").pipe(
                Config.orElse(() => Config.succeed("https://api.example.com")),
              )
              const timeout = yield* Config.int("API_TIMEOUT").pipe(Config.orElse(() => Config.succeed(30000)))

              return { apiKey, baseUrl, timeout }
            }),
          )

          static readonly testLayer = Layer.succeed(ApiConfig, {
            apiKey: Redacted.make("test-key"),
            baseUrl: "https://test.example.com",
            timeout: 5000,
          })
        }

        const program = Effect.gen(function* () {
          const config = yield* ApiConfig
          return {
            apiKey: Redacted.value(config.apiKey),
            baseUrl: config.baseUrl,
            timeout: config.timeout,
          }
        })

        const result = yield* program.pipe(Effect.provide(ApiConfig.testLayer))

        strictEqual(result.apiKey, "test-key")
        strictEqual(result.baseUrl, "https://test.example.com")
        strictEqual(result.timeout, 5000)
      }),
    )

    it.effect("uses real config with provider", () =>
      Effect.gen(function* () {
        class DbConfig extends ServiceMap.Service<
          DbConfig,
          {
            readonly host: string
            readonly port: number
            readonly database: string
          }
        >()("@app/DbConfig") {
          static readonly layer = Layer.effect(
            DbConfig,
            Effect.gen(function* () {
              const host = yield* Config.string("DB_HOST")
              const port = yield* Config.int("DB_PORT")
              const database = yield* Config.string("DB_NAME")

              return { host, port, database }
            }),
          )
        }

        const testConfig = ConfigProvider.fromUnknown({
          DB_HOST: "localhost",
          DB_PORT: "5432",
          DB_NAME: "testdb",
        })

        const program = Effect.gen(function* () {
          const config = yield* DbConfig
          return config
        })

        const result = yield* program.pipe(
          Effect.provide(DbConfig.layer),
          Effect.provide(ConfigProvider.layer(testConfig)),
        )

        strictEqual(result.host, "localhost")
        strictEqual(result.port, 5432)
        strictEqual(result.database, "testdb")
      }),
    )
  })

  describe("Defaults and Fallbacks", () => {
    it.effect("uses orElse for defaults", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const port = yield* Config.int("PORT").pipe(Config.orElse(() => Config.succeed(3000)))

          const host = yield* Config.string("HOST").pipe(Config.orElse(() => Config.succeed("0.0.0.0")))

          return { port, host }
        })

        // Empty config - should use defaults
        const emptyConfig = ConfigProvider.fromUnknown({})

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(emptyConfig)))

        strictEqual(result.port, 3000)
        strictEqual(result.host, "0.0.0.0")
      }),
    )

    it.effect("handles optional config values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const required = yield* Config.string("REQUIRED")
          const optional = yield* Config.option(Config.string("OPTIONAL"))

          return { required, optional }
        })

        const testConfig = ConfigProvider.fromUnknown({ REQUIRED: "value" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result.required, "value")
        assertTrue(result.optional._tag === "None")
      }),
    )

    it.effect("optional returns Some when value exists", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const optional = yield* Config.option(Config.string("OPTIONAL"))
          return optional
        })

        const testConfig = ConfigProvider.fromUnknown({ OPTIONAL: "present" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        assertSome(result, "present")
      }),
    )
  })

  describe("Validation with Schema", () => {
    it.effect("validates with Config.schema", () =>
      Effect.gen(function* () {
        const Port = Schema.NumberFromString.pipe(
          Schema.check(Schema.isInt()),
          Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
        )
        const Environment = Schema.Literals(["development", "staging", "production"])

        const program = Effect.gen(function* () {
          const port = yield* Config.schema(Port, "PORT")
          const env = yield* Config.schema(Environment, "ENV")
          return { port, env }
        })

        const testConfig = ConfigProvider.fromUnknown({
          PORT: "8080",
          ENV: "development",
        })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result.port, 8080)
        strictEqual(result.env, "development")
      }),
    )

    it.effect("validates with branded types", () =>
      Effect.gen(function* () {
        const Port = Schema.NumberFromString.pipe(
          Schema.check(Schema.isInt()),
          Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
          Schema.brand("Port"),
        )

        const program = Effect.gen(function* () {
          const port = yield* Config.schema(Port, "PORT")
          return port
        })

        const testConfig = ConfigProvider.fromUnknown({ PORT: "3000" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result, 3000)
      }),
    )

    it.effect("handles validation errors", () =>
      Effect.gen(function* () {
        const Port = Schema.NumberFromString.pipe(
          Schema.check(Schema.isInt()),
          Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
        )

        const program = Effect.gen(function* () {
          const port = yield* Config.schema(Port, "PORT")
          return port
        })

        const invalidConfig = ConfigProvider.fromUnknown({ PORT: "99999" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(invalidConfig)), Effect.result)

        assertTrue(result._tag === "Failure")
      }),
    )
  })

  describe("Config Primitives", () => {
    it.effect("reads string values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          return yield* Config.string("MY_VAR")
        })

        const testConfig = ConfigProvider.fromUnknown({ MY_VAR: "hello" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result, "hello")
      }),
    )

    it.effect("reads number values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const number = yield* Config.number("FLOAT")
          const integer = yield* Config.int("INT")
          return { number, integer }
        })

        const testConfig = ConfigProvider.fromUnknown({
          FLOAT: "3.14",
          INT: "42",
        })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result.number, 3.14)
        strictEqual(result.integer, 42)
      }),
    )

    it.effect("reads boolean values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const debug = yield* Config.boolean("DEBUG")
          return debug
        })

        const testConfig = ConfigProvider.fromUnknown({ DEBUG: "true" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result, true)
      }),
    )

    it.effect("reads redacted values", () =>
      Effect.gen(function* () {
        const program = Effect.gen(function* () {
          const secret = yield* Config.redacted("SECRET")
          return Redacted.value(secret)
        })

        const testConfig = ConfigProvider.fromUnknown({ SECRET: "my-secret" })

        const result = yield* program.pipe(Effect.provide(ConfigProvider.layer(testConfig)))

        strictEqual(result, "my-secret")
      }),
    )
  })

  describe("Complex Config Scenarios", () => {
    it.effect("combines multiple config sources", () =>
      Effect.gen(function* () {
        class AppConfig extends ServiceMap.Service<
          AppConfig,
          {
            readonly server: { port: number; host: string }
            readonly database: { url: string }
            readonly features: { enableCache: boolean }
          }
        >()("@app/AppConfig") {
          static readonly layer = Layer.effect(
            AppConfig,
            Effect.gen(function* () {
              const port = yield* Config.int("PORT")
              const host = yield* Config.string("HOST")
              const dbUrl = yield* Config.string("DATABASE_URL")
              const enableCache = yield* Config.boolean("ENABLE_CACHE").pipe(Config.orElse(() => Config.succeed(false)))

              return {
                server: { port, host },
                database: { url: dbUrl },
                features: { enableCache },
              }
            }),
          )
        }

        const testConfig = ConfigProvider.fromUnknown({
          PORT: "8080",
          HOST: "localhost",
          DATABASE_URL: "postgres://localhost/test",
        })

        const program = Effect.gen(function* () {
          const config = yield* AppConfig
          return config
        })

        const result = yield* program.pipe(
          Effect.provide(AppConfig.layer),
          Effect.provide(ConfigProvider.layer(testConfig)),
        )

        strictEqual(result.server.port, 8080)
        strictEqual(result.server.host, "localhost")
        strictEqual(result.database.url, "postgres://localhost/test")
        strictEqual(result.features.enableCache, false)
      }),
    )
  })
})
