# Tag input

`tag-input.tsx` exports the provider, input, list, root, and context hook. `TagInputProvider` must contain the other parts; `useTagInput` throws outside that provider.

```tsx
import {
  TagInputProvider, TagInputRoot, TagList, TagInput,
} from '@/components/ui/tag/tag-input';

<TagInputProvider value={tags} onChange={setTags}>
  <TagInputRoot>
    <TagList />
    <TagInput placeholder="Add a new tag..." />
  </TagInputRoot>
</TagInputProvider>
```

Use `value` and `onChange` for controlled tags, or `defaultValue` for the initial uncontrolled list. `disabled` disables input. Values are strings: adding a tag trims whitespace and rejects empty or duplicate values.

Enter adds the current input. Backspace on an empty input removes the last tag. Removing a tag updates the list and calls `onChange`. These are local input operations; the consuming form owns persistence.
