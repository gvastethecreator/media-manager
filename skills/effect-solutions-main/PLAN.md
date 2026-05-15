# Effect Solutions - Project Plan

## Overview

Multi-purpose repository for Effect TypeScript best practices with multiple distribution/usage modes.

## Use Cases

### 1. Documentation Files (Markdown)

- Best practices for setting up Effect applications
- Reference material for developers
- Living documentation that stays current

### 2. Frontend Server

- Web interface to browse best practices
- Read/navigate documentation easily
- Hosted viewing experience

### 3. Documentation Maintenance

- Validate external links/docs on demand
- Open issues/PRs when documentation outdated
- Keep best practices current without scheduled automation

### 4. Docs CLI Distribution

- `bunx effect-solutions` is the single entry point for humans/agents
- `list` + `show` commands expose LM-friendly packets sourced from `packages/cli/resources`
- No separate skill artifacts—everything stays in the repository and updates via regular git changes
- Encourage teams to mention the CLI in `CLAUDE.md` / `AGENTS.md` so agents run it first

## Questions to Resolve

- Frontend framework choice?
- Which external sites to validate?
- Topic scope - which Effect areas deserve their own CLI packet?
