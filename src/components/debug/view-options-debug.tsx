import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

/**
 * Componente temporal de debug para verificar sincronización de estados
 */
export function ViewOptionsDebug() {
	const groupByEntityType = useViewOptionsStore((state) => state.groupByEntityType);
	const includeSubfolders = useViewOptionsStore((state) => state.includeSubfolders);
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);

	return (
		<Card className="m-4 border-orange-500">
			<CardHeader>
				<CardTitle className="text-orange-600">🔍 Debug: Estados del Store</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">groupByEntityType:</span>
							<Badge variant={groupByEntityType ? 'default' : 'secondary'}>
								{groupByEntityType ? 'true' : 'false'}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">includeSubfolders:</span>
							<Badge variant={includeSubfolders ? 'default' : 'secondary'}>
								{includeSubfolders ? 'true' : 'false'}
							</Badge>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">viewMode:</span>
							<Badge>{viewMode}</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">searchQuery:</span>
							<Badge variant="outline">{searchQuery || 'vacío'}</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
