import { Argument, Command, Flag } from "effect/unstable/cli"
import { FileSystem } from "effect"
import { NodeServices } from "@effect/platform-node"
import { describe, expect, it } from "@effect/vitest"
// biome-ignore lint/suspicious/noShadowRestrictedNames: Effect convention
import { Array, Effect, Layer, Option, Schema, ServiceMap } from "effect"

// ============================================================================
// Task Schema
// ============================================================================

const TaskId = Schema.Number.pipe(Schema.brand("TaskId"))
type TaskId = typeof TaskId.Type

class Task extends Schema.Class("Task")({
  id: TaskId,
  text: Schema.NonEmptyString,
  done: Schema.Boolean,
}) {
  toggle() {
    return new Task({ ...this, done: !this.done })
  }
}

class TaskList extends Schema.Class("TaskList")({
  tasks: Schema.Array(Task),
}) {
  static Json = Schema.fromJsonString(TaskList)
  static empty = new TaskList({ tasks: [] })

  get nextId(): TaskId {
    if (this.tasks.length === 0) return TaskId.makeUnsafe(1)
    return TaskId.makeUnsafe(Math.max(...this.tasks.map((t) => t.id)) + 1)
  }

  add(text: string): [TaskList, Task] {
    const task = new Task({ id: this.nextId, text, done: false })
    return [new TaskList({ tasks: [...this.tasks, task] }), task]
  }

  toggle(id: TaskId): [TaskList, Option.Option<Task>] {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return [this, Option.none()]

    const updated = this.tasks[index].toggle()
    const tasks = [...this.tasks]
    tasks[index] = updated
    return [new TaskList({ tasks }), Option.some(updated)]
  }

  find(id: TaskId): Option.Option<Task> {
    return Array.findFirst(this.tasks, (t) => t.id === id)
  }

  get pending() {
    return this.tasks.filter((t) => !t.done)
  }

  get completed() {
    return this.tasks.filter((t) => t.done)
  }
}

// ============================================================================
// TaskRepo Service
// ============================================================================

class TaskRepo extends ServiceMap.Service<
  TaskRepo,
  {
    readonly list: (all?: boolean) => Effect.Effect<ReadonlyArray<Task>>
    readonly add: (text: string) => Effect.Effect<Task>
    readonly toggle: (id: TaskId) => Effect.Effect<Option.Option<Task>>
  }
>()("TaskRepo") {
  static layer = (path: string) =>
    Layer.effect(
      TaskRepo,
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem

        // Helpers
        const load = Effect.gen(function* () {
          const content = yield* fs.readFileString(path)
          return yield* Schema.decodeEffect(TaskList.Json)(content)
        }).pipe(Effect.orElseSucceed(() => TaskList.empty))

        const save = (list: TaskList) =>
          Effect.gen(function* () {
            const json = yield* Schema.encodeEffect(TaskList.Json)(list)
            yield* fs.writeFileString(path, json)
          })

        // Public API
        const list = Effect.fn("TaskRepo.list")(function* (all?: boolean) {
          const taskList = yield* load
          if (all) return taskList.tasks
          return taskList.tasks.filter((t) => !t.done)
        })

        const add = Effect.fn("TaskRepo.add")(function* (text: string) {
          const list = yield* load
          const [newList, task] = list.add(text)
          yield* save(newList)
          return task
        })

        const toggle = Effect.fn("TaskRepo.toggle")(function* (id: TaskId) {
          const list = yield* load
          const [newList, task] = list.toggle(id)
          yield* save(newList)
          return task
        })

        return { list, add, toggle }
      }),
    )

  static testLayer = Layer.succeed(TaskRepo, {
    list: (_all?) => Effect.succeed([]),
    add: (text) => Effect.succeed(new Task({ id: TaskId.makeUnsafe(1), text, done: false })),
    toggle: () => Effect.succeed(Option.none()),
  })
}

// ============================================================================
// CLI Commands
// ============================================================================

const addCommand = Command.make("add", { text: Argument.string("task") }, ({ text }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    return yield* repo.add(text)
  }),
)

const listCommand = Command.make("list", { all: Flag.boolean("all").pipe(Flag.withAlias("a")) }, ({ all }) =>
  Effect.gen(function* () {
    const repo = yield* TaskRepo
    return yield* repo.list(all)
  }),
)

const toggleCommand = Command.make(
  "toggle",
  { id: Argument.integer("id").pipe(Argument.withSchema(TaskId)) },
  ({ id }) =>
    Effect.gen(function* () {
      const repo = yield* TaskRepo
      return yield* repo.toggle(id)
    }),
)

const _app = Command.make("tasks").pipe(Command.withSubcommands([addCommand, listCommand, toggleCommand]))

// ============================================================================
// Tests
// ============================================================================

describe("Domain Model", () => {
  describe("Task", () => {
    it("toggle flips done state", () => {
      const task = new Task({ id: TaskId.makeUnsafe(1), text: "Test", done: false })
      const toggled = task.toggle()

      expect(toggled.done).toBe(true)
      expect(toggled.text).toBe("Test")
      expect(toggled.id).toBe(task.id)

      // Original unchanged (immutable)
      expect(task.done).toBe(false)
    })

    it("toggle works both directions", () => {
      const task = new Task({ id: TaskId.makeUnsafe(1), text: "Test", done: true })
      expect(task.toggle().done).toBe(false)
    })
  })

  describe("TaskList", () => {
    it("empty creates empty list", () => {
      expect(TaskList.empty.tasks).toHaveLength(0)
    })

    it("nextId returns 1 for empty list", () => {
      expect(TaskList.empty.nextId).toBe(TaskId.makeUnsafe(1))
    })

    it("nextId returns max + 1", () => {
      const list = new TaskList({
        tasks: [
          new Task({ id: TaskId.makeUnsafe(5), text: "A", done: false }),
          new Task({ id: TaskId.makeUnsafe(3), text: "B", done: false }),
        ],
      })
      expect(list.nextId).toBe(TaskId.makeUnsafe(6))
    })

    it("add creates task with nextId", () => {
      const [list, task] = TaskList.empty.add("New task")

      expect(task.id).toBe(TaskId.makeUnsafe(1))
      expect(task.text).toBe("New task")
      expect(task.done).toBe(false)
      expect(list.tasks).toHaveLength(1)
    })

    it("add increments id for subsequent tasks", () => {
      const [list1, task1] = TaskList.empty.add("First")
      const [list2, task2] = list1.add("Second")

      expect(task1.id).toBe(TaskId.makeUnsafe(1))
      expect(task2.id).toBe(TaskId.makeUnsafe(2))
      expect(list2.tasks).toHaveLength(2)
    })

    it("toggle toggles task by id", () => {
      const [list] = TaskList.empty.add("Task")
      const [newList, result] = list.toggle(TaskId.makeUnsafe(1))

      expect(Option.isSome(result)).toBe(true)
      if (Option.isSome(result)) {
        expect(result.value.done).toBe(true)
      }
      expect(newList.tasks[0].done).toBe(true)
    })

    it("toggle returns none for missing id", () => {
      const [, result] = TaskList.empty.toggle(TaskId.makeUnsafe(999))
      expect(Option.isNone(result)).toBe(true)
    })

    it("find returns task by id", () => {
      const [list] = TaskList.empty.add("Find me")
      const found = list.find(TaskId.makeUnsafe(1))

      expect(Option.isSome(found)).toBe(true)
      if (Option.isSome(found)) {
        expect(found.value.text).toBe("Find me")
      }
    })

    it("find returns none for missing id", () => {
      expect(Option.isNone(TaskList.empty.find(TaskId.makeUnsafe(1)))).toBe(true)
    })

    it("pending filters incomplete tasks", () => {
      let [list] = TaskList.empty.add("Done")
      ;[list] = list.toggle(TaskId.makeUnsafe(1))
      ;[list] = list.add("Not done")

      expect(list.pending).toHaveLength(1)
      expect(list.pending[0].text).toBe("Not done")
    })

    it("completed filters done tasks", () => {
      let [list] = TaskList.empty.add("Done")
      ;[list] = list.toggle(TaskId.makeUnsafe(1))
      ;[list] = list.add("Not done")

      expect(list.completed).toHaveLength(1)
      expect(list.completed[0].text).toBe("Done")
    })
  })
})

describe("CLI", () => {
  describe("Argument", () => {
    it("Argument.string parses positional argument", () => {
      const name = Argument.string("name")
      expect(name).toBeDefined()
    })

    it("Argument.optional makes argument optional", () => {
      const output = Argument.string("output").pipe(Argument.optional)
      expect(output).toBeDefined()
    })

    it("Argument.withDefault provides default value", () => {
      const format = Argument.string("format").pipe(Argument.withDefault("json"))
      expect(format).toBeDefined()
    })

    it("Argument.variadic allows zero or more", () => {
      const files = Argument.string("files").pipe(Argument.variadic())
      expect(files).toBeDefined()
    })

    it("Argument.atLeast requires minimum count", () => {
      const files = Argument.string("files").pipe(Argument.atLeast(1))
      expect(files).toBeDefined()
    })
  })

  describe("Flag", () => {
    it("Flag.boolean creates flag", () => {
      const verbose = Flag.boolean("verbose").pipe(Flag.withAlias("v"))
      expect(verbose).toBeDefined()
    })

    it("Flag.string creates text option", () => {
      const output = Flag.string("output").pipe(Flag.withAlias("o"))
      expect(output).toBeDefined()
    })

    it("Flag.optional makes option optional", () => {
      const config = Flag.string("config").pipe(Flag.optional)
      expect(config).toBeDefined()
    })

    it("Flag.choice restricts values", () => {
      const format = Flag.choice("format", ["json", "yaml", "toml"])
      expect(format).toBeDefined()
    })

    it("Flag.integer parses numbers", () => {
      const count = Flag.integer("count").pipe(Flag.withDefault(10))
      expect(count).toBeDefined()
    })
  })

  describe("Commands", () => {
    it("Command.make creates command", () => {
      const cmd = Command.make("test", {}, () => Effect.void)
      expect(cmd).toBeDefined()
    })

    it("Command.withSubcommands adds subcommands", () => {
      const sub = Command.make("sub", {}, () => Effect.void)
      const parent = Command.make("parent").pipe(Command.withSubcommands([sub]))
      expect(parent).toBeDefined()
    })
  })

  describe("TaskRepo Service", () => {
    it.effect("add creates task with text", () =>
      Effect.gen(function* () {
        const repo = yield* TaskRepo
        const task = yield* repo.add("Test task")
        expect(task.text).toBe("Test task")
        expect(task.done).toBe(false)
      }).pipe(Effect.provide(TaskRepo.testLayer)),
    )

    it.effect("list returns tasks", () =>
      Effect.gen(function* () {
        const repo = yield* TaskRepo
        const tasks = yield* repo.list()
        expect(Array.isArray(tasks)).toBe(true)
      }).pipe(Effect.provide(TaskRepo.testLayer)),
    )

    it.effect("toggle returns Option", () =>
      Effect.gen(function* () {
        const repo = yield* TaskRepo
        const result = yield* repo.toggle(TaskId.makeUnsafe(1))
        expect(Option.isOption(result)).toBe(true)
      }).pipe(Effect.provide(TaskRepo.testLayer)),
    )
  })

  describe("TaskRepo Live (with temp files)", () => {
    it.effect("add persists task to file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tempDir = yield* fs.makeTempDirectoryScoped()
        const path = `${tempDir}/tasks.json`

        const repo = yield* Effect.provide(Effect.gen(function* () { return yield* TaskRepo }), TaskRepo.layer(path).pipe(Layer.provide(NodeServices.layer)))

        // Initially empty
        const before = yield* repo.list()
        expect(before).toHaveLength(0)

        // Add a task
        const task = yield* repo.add("Buy milk")
        expect(task.text).toBe("Buy milk")
        expect(task.done).toBe(false)

        // Verify persisted
        const after = yield* repo.list()
        expect(after).toHaveLength(1)
        expect(after[0].text).toBe("Buy milk")
      }).pipe(Effect.provide(NodeServices.layer)),
    )

    it.effect("toggle marks task as done", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tempDir = yield* fs.makeTempDirectoryScoped()
        const path = `${tempDir}/tasks.json`

        const repo = yield* Effect.provide(Effect.gen(function* () { return yield* TaskRepo }), TaskRepo.layer(path).pipe(Layer.provide(NodeServices.layer)))

        // Add and complete
        const task = yield* repo.add("Walk the dog")
        const result = yield* repo.toggle(task.id)

        expect(Option.isSome(result)).toBe(true)
        if (Option.isSome(result)) {
          expect(result.value.done).toBe(true)
        }

        // Verify persisted
        const tasks = yield* repo.list(true)
        expect(tasks[0].done).toBe(true)
      }).pipe(Effect.provide(NodeServices.layer)),
    )

    it.effect("loads existing tasks from file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tempDir = yield* fs.makeTempDirectoryScoped()
        const path = `${tempDir}/tasks.json`

        // Pre-populate file
        const initial = new TaskList({
          tasks: [new Task({ id: TaskId.makeUnsafe(1), text: "Existing", done: false })],
        })
        const json = yield* Schema.encodeEffect(TaskList.Json)(initial)
        yield* fs.writeFileString(path, json)

        // Load via repo
        const repo = yield* Effect.provide(Effect.gen(function* () { return yield* TaskRepo }), TaskRepo.layer(path).pipe(Layer.provide(NodeServices.layer)))
        const tasks = yield* repo.list()

        expect(tasks).toHaveLength(1)
        expect(tasks[0].text).toBe("Existing")
      }).pipe(Effect.provide(NodeServices.layer)),
    )
  })
})
