import { Argument, Command, Flag } from "effect/unstable/cli"
import { Console, Effect, Exit, Layer, Option } from "effect"
import { TaskId, TaskRepo } from "./domain"
import { BrowserRuntime, log, MockTerminalLayer, makeMockConsole, TerminalOutput, TerminalOutputLive } from "./services"

// =============================================================================
// CLI Commands
// =============================================================================

// add <task>
const textArg = Argument.string("task").pipe(Argument.withDescription("The task description"))

const addCommand = Command.make("add", { text: textArg }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    const task = yield* repo.add(text)
    yield* log(`\x1b[32mAdded\x1b[0m task \x1b[36m#${task.id}\x1b[0m: ${task.text}`)
  }),
).pipe(Command.withDescription("Add a new task"))

// list [--all]
const allOption = Flag.boolean("all").pipe(
  Flag.withAlias("a"),
  Flag.withDescription("Show all tasks including completed"),
)

const listCommand = Command.make("list", { all: allOption }, ({ all }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    const tasks = yield* repo.list(all)

    if (tasks.length === 0) {
      yield* log("No tasks.")
      return
    }

    for (const task of tasks) {
      const id = `\x1b[36m#${task.id}\x1b[0m`
      const status = task.done ? "\x1b[32m[x]\x1b[0m" : "\x1b[90m[ ]\x1b[0m"
      yield* log(`${id} ${status} ${task.text}`)
    }
  }),
).pipe(Command.withDescription("List pending tasks"))

// toggle <id>
const idArg = Argument.integer("id").pipe(Argument.withSchema(TaskId), Argument.withDescription("The task ID to toggle"))

const toggleCommand = Command.make("toggle", { id: idArg }, ({ id }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    const result = yield* repo.toggle(id)

    yield* Option.match(result, {
      onNone: () => log(`\x1b[31mTask \x1b[36m#${id}\x1b[31m not found\x1b[0m`),
      onSome: (task) => {
        const status = task.done ? "\x1b[32mdone\x1b[0m" : "\x1b[33mpending\x1b[0m"
        return log(`\x1b[33mToggled\x1b[0m: ${task.text} (${status})`)
      },
    })
  }),
).pipe(Command.withDescription("Toggle a task's done status"))

// clear
const clearCommand = Command.make("clear", {}, () =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    yield* repo.clear()
    yield* log("\x1b[33mCleared\x1b[0m all tasks.")
  }),
).pipe(Command.withDescription("Clear all tasks"))

// Root command with subcommands
export const app = Command.make("tasks", {}).pipe(
  Command.withDescription("A simple task manager"),
  Command.withSubcommands([addCommand, listCommand, toggleCommand, clearCommand]),
)

export const cli = Command.runWith(app, {
  version: "1.0.0",
})

// =============================================================================
// Run CLI in Browser
// =============================================================================

export interface CliResult {
  output: string
  isError?: boolean
}

function parseArgs(input: string): string[] {
  const args: string[] = []
  let current = ""
  let inQuote: string | null = null

  for (const char of input) {
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null
      } else {
        current += char
      }
    } else if (char === '"' || char === "'") {
      inQuote = char
    } else if (char === " ") {
      if (current) {
        args.push(current)
        current = ""
      }
    } else {
      current += char
    }
  }
  if (current) args.push(current)
  return args
}

export async function runCliCommand(args: string): Promise<CliResult> {
  // Build argv: ["node", "tasks", ...args]
  const argv = ["node", "tasks", ...parseArgs(args)]

  // Create a fresh output accumulator per command
  const program = Effect.gen(function* () {
    // Create mock console and override the default Console reference
    const mockConsole = yield* makeMockConsole
    const consoleLayer = Layer.succeed(Console.Console, mockConsole)

    // Run the CLI command with mock console
    const exit = yield* cli(argv).pipe(Effect.provide(consoleLayer), Effect.provide(MockTerminalLayer), Effect.exit)

    // Retrieve output from the accumulator
    const termOutput = yield* TerminalOutput
    const lines = yield* termOutput.getLines
    const output = lines.join("\n")

    if (Exit.isFailure(exit)) {
      // If we have captured output, show it (e.g. help text or errors)
      if (output) {
        return { output, isError: true }
      }
      return { output: String(exit.cause), isError: true }
    }

    return { output, isError: false }
  }).pipe(
    // Provide the terminal output (stateful accumulator)
    Effect.provide(TerminalOutputLive),
  )

  // Use the managed runtime which has platform and repo layers baked in
  return BrowserRuntime.runPromise(program)
}
