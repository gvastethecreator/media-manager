import { type Effect, Option, Schema, ServiceMap } from "effect"

// =============================================================================
// Task Schema & Domain
// =============================================================================

export const TaskId = Schema.Number.pipe(Schema.brand("TaskId"))
export type TaskId = typeof TaskId.Type

export class Task extends Schema.Class<Task>("Task")({
  id: TaskId,
  text: Schema.NonEmptyString,
  done: Schema.Boolean,
}) {
  toggle() {
    return new Task({ ...this, done: !this.done })
  }
}

export class TaskList extends Schema.Class<TaskList>("TaskList")({
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

    // biome-ignore lint/style/noNonNullAssertion: index check above
    const updated = this.tasks[index]!.toggle()
    const tasks = [...this.tasks]
    tasks[index] = updated
    return [new TaskList({ tasks }), Option.some(updated)]
  }
}

// =============================================================================
// TaskRepo Service
// =============================================================================

export class TaskRepo extends ServiceMap.Service<
  TaskRepo,
  {
    readonly list: (all?: boolean) => Effect.Effect<ReadonlyArray<Task>>
    readonly add: (text: string) => Effect.Effect<Task>
    readonly toggle: (id: TaskId) => Effect.Effect<Option.Option<Task>>
    readonly clear: () => Effect.Effect<void>
  }
>()("TaskRepo") {}
