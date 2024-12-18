import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

type Folder = {
  name: string;
  count: number;
  children?: { name: string; count: number }[];
}

type FoldersProps = {
  folders: Folder[];
}

export function Folders({ folders }: FoldersProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Carpetas</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {folders.map((folder) => (
            <Collapsible key={folder.name}>
              <SidebarMenuItem className="sidebar-item">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    {folder.name}
                    <span className="ml-auto text-xs text-muted-foreground">({folder.count})</span>
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>
              <CollapsibleContent>
                <SidebarMenu className="ml-4">
                  {folder.children?.map((child) => (
                    <SidebarMenuItem key={child.name} className="sidebar-item">
                      <SidebarMenuButton>
                        {child.name}
                        <span className="ml-auto text-xs text-muted-foreground">({child.count})</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

