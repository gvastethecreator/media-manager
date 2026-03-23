import { KeyValueStore } from "effect/unstable/persistence"
import { Terminal, Stdio } from "effect"
import { FileSystem, Path } from "effect"
import { ChildProcessSpawner } from "effect/unstable/process"
import { BrowserKeyValueStore } from "@effect/platform-browser"
import { Console, Effect, Layer, ManagedRuntime, Option, Ref, ServiceMap } from "effect"
import { Task, TaskId, TaskList, TaskRepo } from "./domain"

// =============================================================================
// Browser TaskRepo (KeyValueStore)
// =============================================================================

const STORAGE_KEY = "effect-solutions-tasks-demo"
const INITIALIZED_KEY = "effect-solutions-tasks-initialized"

const DEFAULT_TASKS = new TaskList({
  tasks: [
    new Task({
      id: TaskId.makeUnsafe(1),
      text: "Run the agent-guided setup",
      done: false,
    }),
    new Task({
      id: TaskId.makeUnsafe(2),
      text: "Become effect-pilled",
      done: false,
    }),
  ],
})

const browserTaskRepoLayer = Layer.effect(
  TaskRepo,
  Effect.gen(function* () {
    const kv = KeyValueStore.toSchemaStore(yield* KeyValueStore.KeyValueStore, TaskList)

    const loadTaskList = Effect.gen(function* () {
      const initialized = yield* kv.has(INITIALIZED_KEY)
      if (!initialized) {
        yield* kv.set(INITIALIZED_KEY, TaskList.empty)
        yield* kv.set(STORAGE_KEY, DEFAULT_TASKS)
        return DEFAULT_TASKS
      }
      const stored = yield* kv.get(STORAGE_KEY)
      return Option.getOrElse(stored, () => TaskList.empty)
    }).pipe(Effect.orElseSucceed(() => TaskList.empty))

    const saveTaskList = (list: TaskList) => kv.set(STORAGE_KEY, list).pipe(Effect.ignore)

    return TaskRepo.of({
      list: Effect.fn("TaskRepo.list")(function* (all?: boolean) {
        const taskList = yield* loadTaskList
        return all ? taskList.tasks : taskList.tasks.filter((t) => !t.done)
      }),
      add: Effect.fn("TaskRepo.add")(function* (text: string) {
        const list = yield* loadTaskList
        const [newList, task] = list.add(text)
        yield* saveTaskList(newList)
        return task
      }),
      toggle: Effect.fn("TaskRepo.toggle")(function* (id: TaskId) {
        const list = yield* loadTaskList
        const [newList, task] = list.toggle(id)
        yield* saveTaskList(newList)
        return task
      }),
      clear: Effect.fn("TaskRepo.clear")(function* () {
        yield* saveTaskList(TaskList.empty)
      }),
    })
  }),
).pipe(Layer.provide(BrowserKeyValueStore.layerLocalStorage))

// =============================================================================
// Terminal Output Service (line accumulator)
// =============================================================================

export class TerminalOutput extends ServiceMap.Service<
  TerminalOutput,
  {
    readonly log: (...args: ReadonlyArray<unknown>) => Effect.Effect<void>
    readonly logSync: (...args: ReadonlyArray<unknown>) => void
    readonly getLines: Effect.Effect<ReadonlyArray<string>>
  }
>()("TerminalOutput") {}

export const TerminalOutputLive = Layer.sync(TerminalOutput, () => {
  const lines: string[] = []
  return TerminalOutput.of({
    log: (...args) => Effect.sync(() => { for (const a of args) lines.push(String(a)) }),
    logSync: (...args) => { for (const a of args) lines.push(String(a)) },
    getLines: Effect.sync(() => [...lines]),
  })
})

// Helper to log to TerminalOutput
export const log = (...args: ReadonlyArray<unknown>) =>
  Effect.gen(function* () {
    const out = yield* TerminalOutput
    yield* out.log(...args)
  })

// =============================================================================
// Mock Platform Services (minimal browser stubs)
// =============================================================================

// Terminal mock - display goes to our TerminalOutput accumulator
export const MockTerminalLayer = Layer.effect(
  Terminal.Terminal,
  Effect.gen(function* () {
    const output = yield* TerminalOutput
    return Terminal.make({
      columns: Effect.succeed(80),
      display: (text: string) =>
        Effect.gen(function* () {
          yield* output.log(text)
        }),
      readLine: Effect.die("readLine not implemented in browser"),
      readInput: Effect.die("readInput not implemented in browser"),
    })
  }),
)

// Console mock - @effect/cli uses Console.log/error for help and error output
const noop = () => {}
export const makeMockConsole = Effect.gen(function* () {
  const output = yield* TerminalOutput
  return {
    log: (...args: any[]) => output.logSync(...args),
    error: (...args: any[]) => output.logSync(...args),
    assert: noop,
    clear: noop,
    count: noop,
    countReset: noop,
    debug: noop,
    dir: noop,
    dirxml: noop,
    group: noop,
    groupCollapsed: noop,
    groupEnd: noop,
    info: noop,
    table: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    trace: noop,
    warn: noop,
  } satisfies Console.Console
})

// FileSystem.layerNoop provides a no-op FileSystem where all operations fail by default
const mockFileSystemLayer = FileSystem.layerNoop({})

// Path.layer is a built-in cross-platform Path implementation that works in browsers
const mockPathLayer = Path.layer

// Stub layers for CLI Environment requirements not needed in browser
const mockStdioLayer = Stdio.layerTest({})
const mockSpawnerLayer = Layer.succeed(
  ChildProcessSpawner.ChildProcessSpawner,
  ChildProcessSpawner.make(
    () => Effect.die("ChildProcessSpawner not available in browser"),
  ),
)

// Combined browser platform layer (without Terminal - that needs TerminalOutput)
const browserPlatformLayer = Layer.mergeAll(mockFileSystemLayer, mockPathLayer, mockStdioLayer, mockSpawnerLayer)

// Combined layer for all browser services
const browserLiveLayer = Layer.mergeAll(browserPlatformLayer, browserTaskRepoLayer)

// Managed runtime with all browser services baked in
export const BrowserRuntime = ManagedRuntime.make(browserLiveLayer)

export { INITIALIZED_KEY, STORAGE_KEY }
