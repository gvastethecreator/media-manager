import net from "node:net"
import { ChildProcess } from "effect/unstable/process"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http"
import { Console, Effect, Layer, Schedule, ServiceMap, Stream } from "effect"
import { getBaseUrl, NEXT_CACHE_DIR, TEMPLATE_ROUTE } from "./config.js"

// =============================================================================
// Server Handle
// =============================================================================

interface ServerHandle {
  baseUrl: string
}

// =============================================================================
// Port Discovery
// =============================================================================

/** Find an available port by binding to port 0 */
const getRandomPort = Effect.callback<number>((resume) => {
  const server = net.createServer()
  server.listen(0, "localhost", () => {
    const address = server.address()
    const port = typeof address === "object" && address ? address.port : 0
    server.close(() => resume(Effect.succeed(port)))
  })
  server.on("error", (err) => resume(Effect.fail(err)))
})

// =============================================================================
// HTTP Helpers
// =============================================================================

const checkServer = (url: string) =>
  HttpClient.execute(HttpClientRequest.get(url)).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.as(true),
    Effect.catch(() => Effect.succeed(false)),
    Effect.provide(FetchHttpClient.layer),
  )

const waitForServer = (url: string) =>
  checkServer(url).pipe(
    Effect.filterOrFail(
      (ok) => ok,
      () => new Error("Server not ready"),
    ),
    Effect.retry(Schedule.spaced("500 millis")),
    Effect.timeout("45 seconds"),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new Error(`Timed out waiting for Next.js dev server at ${url}`)),
    ),
  )

// =============================================================================
// Server Lifecycle
// =============================================================================

const startDevServer = Effect.gen(function* () {
  const port = yield* getRandomPort
  const baseUrl = `http://localhost:${port}`

  yield* Console.log(`Starting temporary Next.js server for OG template on ${baseUrl}...`)

  const handle = yield* ChildProcess.make("bunx", ["next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSER: "none",
      NEXT_CACHE_DIR,
    },
    stderr: "inherit",
  })

  // Pipe stdout to console with prefix
  yield* handle.stdout
    .pipe(
      Stream.decodeText(),
      Stream.runForEach((chunk) => Effect.sync(() => process.stdout.write(`[og-dev] ${chunk}`))),
    )
    .pipe(Effect.forkChild)

  // Wait for server to be ready
  yield* waitForServer(new URL(TEMPLATE_ROUTE, baseUrl).toString())

  return { baseUrl } satisfies ServerHandle
})

const acquireServer = Effect.gen(function* () {
  // Check for explicit base URL override
  const explicitBaseUrl = getBaseUrl()
  if (explicitBaseUrl) {
    return { baseUrl: explicitBaseUrl } satisfies ServerHandle
  }

  // Always start our own server on a random port to avoid cross-project contamination
  return yield* startDevServer
})

// =============================================================================
// Template Server Service
// =============================================================================

export class TemplateServer extends ServiceMap.Service<TemplateServer, { readonly baseUrl: string }>()(
  "TemplateServer",
) {
  static layer = Layer.effect(TemplateServer, acquireServer.pipe(Effect.map((handle) => ({ baseUrl: handle.baseUrl }))))

  static test = (baseUrl: string) => Layer.succeed(TemplateServer, TemplateServer.of({ baseUrl }))
}
