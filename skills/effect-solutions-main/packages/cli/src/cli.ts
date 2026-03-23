#!/usr/bin/env bun

import { Argument, Command as CliCommand, Flag } from "effect/unstable/cli"
import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Console, Effect, Layer, Option, pipe } from "effect"
import pc from "picocolors"
import pkg from "../package.json" with { type: "json" }
import { DOC_LOOKUP, DOCS } from "./docs-manifest"
import { BrowserService, IssueService, type OpenIssueCategory } from "./open-issue-service"
import { UpdateNotifier, UpdateNotifierConfig } from "./update-notifier"

const CLI_NAME = "effect-solutions"
const CLI_VERSION = pkg.version

const isDocSlug = (value: string): value is keyof typeof DOC_LOOKUP => value in DOC_LOOKUP

const colorizeCodeReferences = (text: string): string => {
  return (
    text
      // Commands in bold green
      .replace(/`bunx [^`]+`/g, (match) => pc.bold(pc.green(match)))
      .replace(/`bun run [^`]+`/g, (match) => pc.bold(pc.green(match)))
      // File references in cyan
      .replace(/`[^`]+\.(ts|json|toml|md)`/g, (match) => pc.cyan(match))
      // Other code in dim
      .replace(/`[^`]+`/g, (match) => pc.dim(match))
  )
}

const MIN_TERMINAL_WIDTH = 40
const FALLBACK_TERMINAL_WIDTH = 80
const MIN_DESCRIPTION_WIDTH = 20

const getTerminalWidth = () => {
  const width = typeof process.stdout?.columns === "number" ? process.stdout.columns : FALLBACK_TERMINAL_WIDTH
  return Math.max(MIN_TERMINAL_WIDTH, width)
}

const wrapText = (text: string, maxWidth: number) => {
  if (text.trim() === "" || maxWidth <= 0) {
    return [text]
  }

  const words = text.split(/\s+/)
  const lines: Array<string> = []
  let current = ""

  for (const word of words) {
    if (current.length === 0) {
      current = word
      continue
    }

    if (current.length + 1 + word.length <= maxWidth) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current.length > 0) {
    lines.push(current)
  }

  return lines
}

export const renderDocList = () => {
  const indent = "  "
  const width = getTerminalWidth()
  const descriptionWidth = Math.max(MIN_DESCRIPTION_WIDTH, width - indent.length)

  const cards = DOCS.map((doc) => {
    const titleLine = `${pc.green(doc.slug)}  ${pc.bold(pc.cyan(doc.title))}`
    const wrappedDescription = wrapText(doc.description, descriptionWidth).map((line) => `${indent}${pc.dim(line)}`)

    return [titleLine, ...wrappedDescription].join("\n")
  })

  return `${cards.join("\n\n")}\n`
}

export const renderDocs = (requested: ReadonlyArray<string>) => {
  const slugs = requested.map((slug) => slug.trim()).filter(Boolean)

  if (slugs.length === 0) {
    throw new Error("Please provide at least one doc slug.")
  }

  const unknown = slugs.filter((slug) => !isDocSlug(slug))
  if (unknown.length > 0) {
    throw new Error(`Unknown doc slug(s): ${unknown.join(", ")}`)
  }

  const uniqueSlugs = Array.from(new Set(slugs)) as Array<keyof typeof DOC_LOOKUP>
  const blocks = uniqueSlugs.map((slug) => {
    const doc = DOC_LOOKUP[slug]
    if (!doc) {
      throw new Error(`Internal error: doc ${slug} not found in lookup`)
    }
    const title = `${pc.bold(pc.cyan(`## ${doc.title}`))} ${pc.dim(`(${doc.slug})`)}`
    const body = colorizeCodeReferences(doc.body.trim())
    return [title, "", body].filter(Boolean).join("\n")
  })

  return `${blocks.join(`\n\n${pc.dim("---")}\n\n`)}\n`
}

const listDocs = Console.log(renderDocList())

const showDocs = (slugs: ReadonlyArray<string>) =>
  Effect.sync(() => renderDocs(slugs)).pipe(Effect.flatMap((output) => Console.log(output)))

const listCommand = CliCommand.make("list").pipe(
  CliCommand.withDescription("List Effect Solutions documentation"),
  CliCommand.withHandler(() => listDocs),
)

const showCommand = CliCommand.make("show", {
  slugs: Argument.string("slug").pipe(
    Argument.withDescription("Doc slug(s) to display (e.g., error-handling, services)"),
    Argument.atLeast(1),
  ),
}).pipe(
  CliCommand.withDescription("Show one or more Effect Solutions docs"),
  CliCommand.withHandler(({ slugs }) => showDocs(slugs)),
)

const openIssueCommand = CliCommand.make("open-issue", {
  category: Flag.string("category").pipe(
    Flag.withDescription("Issue category: 'Topic Request', 'Fix', or 'Improvement'"),
    Flag.optional,
  ),
  title: Flag.string("title").pipe(Flag.withDescription("Brief issue title"), Flag.optional),
  description: Flag.string("description").pipe(
    Flag.withDescription("Detailed issue description"),
    Flag.optional,
  ),
}).pipe(
  CliCommand.withDescription("Open a pre-filled GitHub issue in the effect-solutions repo"),
  CliCommand.withHandler(({ category, title, description }) =>
    Effect.gen(function* () {
      const issueService = yield* IssueService

      const input = {
        ...(Option.isSome(category) && {
          category: category.value as OpenIssueCategory,
        }),
        ...(Option.isSome(title) && { title: title.value }),
        ...(Option.isSome(description) && { description: description.value }),
      }

      const result = yield* issueService.open(input).pipe(
        Effect.catch((error) =>
          Effect.gen(function* () {
            yield* Console.error(pc.red(`Failed to open issue: ${error.message}`))
            return { issueUrl: error.url }
          }),
        ),
      )

      yield* Console.log(
        [pc.bold("Effect Solutions issue"), `URL: ${pc.cyan(result.issueUrl)}`].filter(Boolean).join("\n"),
      )
    }),
  ),
)

export const cli = CliCommand.make(CLI_NAME).pipe(
  CliCommand.withDescription(
    "Effect Solutions CLI - Browse Effect best practices documentation. " +
      "Built for both humans and AI agents to quickly access Effect patterns, setup guides, and configuration examples.",
  ),
  CliCommand.withSubcommands([listCommand, showCommand, openIssueCommand]),
)

export const runCli = (argv: ReadonlyArray<string>) =>
  CliCommand.runWith(cli, {
    version: CLI_VERSION,
  })(argv)

const MainLayer = UpdateNotifier.layer.pipe(
  Layer.provide(UpdateNotifierConfig.layer),
  Layer.merge(IssueService.layer.pipe(Layer.provide(BrowserService.layer))),
  Layer.provideMerge(BunServices.layer),
)

if (import.meta.main) {
  pipe(
    Effect.gen(function* () {
      const notifier = yield* UpdateNotifier
      yield* notifier.check(CLI_NAME, CLI_VERSION)
      // Bun always provides 2 argv prefix elements: ["bun", scriptOrBinaryPath, ...args]
      // This applies in both dev mode (bun src/cli.ts) and compiled binaries.
      yield* runCli(process.argv.slice(2))
    }),
    Effect.provide(MainLayer),
    Effect.tapError((error) => Console.error(pc.red(`Error: ${error}`))),
    Effect.catch(() => Effect.sync(() => process.exit(1))),
    BunRuntime.runMain,
  )
}
