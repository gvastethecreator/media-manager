import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

// Test component to verify context menu functionality
export function ContextMenuTest() {
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Context Menu Test</h1>

			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="w-32 h-32 bg-blue-500 text-white flex items-center justify-center cursor-pointer rounded-lg">
						Right-click me!
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Test Item 1</ContextMenuItem>
					<ContextMenuItem>Test Item 2</ContextMenuItem>
					<ContextMenuItem>Test Item 3</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
}
