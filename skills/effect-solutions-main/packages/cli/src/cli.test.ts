import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { renderDocList, renderDocs } from "./cli"
import { DOCS } from "./docs-manifest"
import { BrowserService, IssueService } from "./open-issue-service"

describe("effect-solutions CLI docs", () => {
  test("list output includes all docs", () => {
    const listOutput = renderDocList()
    for (const doc of DOCS) {
      expect(listOutput).toContain(doc.slug)
      expect(listOutput).toContain(doc.title)
      if (doc.description) {
        // Description might be wrapped, so check for key words instead
        const words = doc.description.split(/\s+/).filter((w) => w.length > 3)
        const hasKeyWords = words.some((word) => listOutput.includes(word))
        expect(hasKeyWords).toBe(true)
      }
    }
  })

  test("show renders multiple docs in order", () => {
    const firstTwo = DOCS.slice(0, 2)
    const slugs = firstTwo.map((doc) => doc.slug)
    const output = renderDocs(slugs)
    const firstSlug = slugs[0]
    const secondSlug = slugs[1]
    if (!firstSlug || !secondSlug) {
      throw new Error("Expected at least 2 docs")
    }
    expect(output.indexOf(firstSlug)).toBeLessThan(output.indexOf(secondSlug))
    expect(output).toContain(`(${firstSlug})`)
    expect(output).toContain(`(${secondSlug})`)
    expect(output).toContain("---")
  })

  test("show rejects unknown doc slugs", () => {
    expect(() => renderDocs(["unknown-doc"])).toThrowError(/Unknown doc slug/)
  })

  test("open issue with test layer", async () => {
    const program = Effect.gen(function* () {
      const issueService = yield* IssueService
      const result = yield* issueService.open({
        category: "Fix",
        title: "Broken link",
        description: "Example body",
      })

      expect(result.issueUrl).toContain("https://github.com/kitlangton/effect-solutions/issues/new")
    })

    await Effect.runPromise(program.pipe(Effect.provide(IssueService.layer), Effect.provide(BrowserService.testLayer)))
  })
})
