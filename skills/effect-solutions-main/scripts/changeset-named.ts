#!/usr/bin/env bun

import { Argument, Command, Flag } from "effect/unstable/cli"
import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, pipe } from "effect"

const PACKAGES = {
  website: "@effect-best-practices/website",
  cli: "effect-solutions",
} as const

type PackageKey = keyof typeof PACKAGES
type BumpType = "patch" | "minor" | "major"

const isPackageKey = (value: string): value is PackageKey => value in PACKAGES

const isBumpType = (value: string): value is BumpType => ["patch", "minor", "major"].includes(value)

const changeset = Command.make("changeset", {
  description: Argument.string("description").pipe(Argument.withDescription("Changeset description")),
  package: Flag.string("package").pipe(
    Flag.withAlias("p"),
    Flag.withDescription("Package: website or cli"),
    Flag.withDefault("cli"),
  ),
  bump: Flag.string("bump").pipe(
    Flag.withAlias("b"),
    Flag.withDescription("Bump type: patch, minor, or major"),
    Flag.withDefault("patch"),
  ),
}).pipe(
  Command.withDescription("Create a named changeset file"),
  Command.withHandler(({ description, package: pkg, bump }) =>
    Effect.gen(function* () {
      if (!isPackageKey(pkg)) {
        return yield* Effect.fail(new Error(`Invalid package: ${pkg}. Use: website or cli`))
      }
      if (!isBumpType(bump)) {
        return yield* Effect.fail(new Error(`Invalid bump: ${bump}. Use: patch, minor, or major`))
      }

      const fs = yield* FileSystem.FileSystem
      const packageName = PACKAGES[pkg]
      const kebabName = description.replace(/\s+/g, "-").toLowerCase()
      const fileName = `${kebabName}.md`
      const filePath = `.changeset/${fileName}`

      const content = `---
"${packageName}": ${bump}
---

${description}
`

      yield* fs.writeFileString(filePath, content)
      yield* Effect.log(`Created changeset: ${fileName}`)
    }),
  ),
)

const run = Command.runWith(changeset, {
  name: "changeset-named",
  version: "0.0.0",
})

pipe(run(process.argv.slice(2)), Effect.provide(BunServices.layer), BunRuntime.runMain)
