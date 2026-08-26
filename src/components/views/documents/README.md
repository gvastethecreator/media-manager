# Minimal Markdown editor

This view edits and previews Markdown files with `@uiw/react-md-editor`.

## Features

The editor provides the following capabilities:

- WYSIWYG editing and live preview.
- Save button that can connect to real persistence.
- Dynamic import for SSR compatibility.

## Usage example

```tsx
<MdEditor initialValue={'# Title\nText'} onSave={console.log} />
```

## Dependencies

The editor depends on the following package:

- `@uiw/react-md-editor` (add with `bun add @uiw/react-md-editor`)

## Future extensions

The following extensions are planned:

- Support for images, tables, and shortcuts.
- Integration with persistence and version control.

---

```mermaid
graph TD
    A[MdEditor] --> B[Editing]
    A --> C[Preview]
    B --> D[onSave]
```
