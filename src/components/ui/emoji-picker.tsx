import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

const emojiCategories = [
  {
    id: "recent",
    label: "🕒",
    emojis: ["⭐", "🌟", "💫", "✨", "🎨", "🎭", "🎬", "📸", "🖼️", "📷", "🎞️", "🎪", "🎯", "🎲", "🎮", "🎼"]
  },
  {
    id: "smileys",
    label: "😊",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗"]
  },
  {
    id: "nature",
    label: "🌿",
    emojis: ["🌸", "💐", "🌷", "🌹", "🌺", "🌻", "🌼", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "☘️", "🍀", "🌺"]
  },
  {
    id: "objects",
    label: "💡",
    emojis: ["💡", "📱", "💻", "🖥️", "📷", "🎥", "📸", "🎬", "🎨", "🎭", "🎪", "🎯", "🎲", "🎮", "🎼", "🎧"]
  },
  {
    id: "symbols",
    label: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💝"]
  }
]

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>(() => {
    const stored = localStorage.getItem('recent-emojis')
    return stored ? JSON.parse(stored) : emojiCategories[0].emojis
  })

  const handleEmojiSelect = React.useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const newRecent = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 16)
      localStorage.setItem('recent-emojis', JSON.stringify(newRecent))
      return newRecent
    })
    onEmojiSelect(emoji)
  }, [onEmojiSelect])

  return (
    <div className={cn("w-full rounded-md border bg-popover text-popover-foreground shadow-md", className)}>
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="w-full h-auto flex items-center justify-between bg-muted/50 rounded-t-md p-0.5 gap-0.5">
          {emojiCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex-1 h-7 px-1.5 rounded-sm data-[state=active]:bg-background"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {emojiCategories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="mt-0 border-0 p-0"
          >
            <ScrollArea className="h-[160px] p-2">
              <div className="grid grid-cols-8 gap-0.5">
                {(category.id === 'recent' ? recentEmojis : category.emojis).map((emoji, index) => (
                  <button
                    key={`${category.id}-${index}`}
                    className="inline-flex items-center justify-center w-7 h-7 text-base hover:bg-muted rounded-sm transition-colors"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}