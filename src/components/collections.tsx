import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

type Collection = {
  emoji: string;
  name: string;
  count: number;
}

type CollectionsProps = {
  collections: Collection[];
}

export function Collections({ collections }: CollectionsProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Colecciones</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {collections.map((collection) => (
            <SidebarMenuItem key={collection.name} className="sidebar-item">
              <SidebarMenuButton>
                <span className="mr-2">{collection.emoji}</span>
                <span className="flex-1">{collection.name}</span>
                <span className="text-xs text-muted-foreground">({collection.count})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

