import { FolderUp, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UploadedImagesSettings() {
	return (
		<Card className="border-dashed bg-muted/20">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<ShieldAlert aria-hidden="true" className="h-5 w-5 text-warning" />
					<h2 className="font-inherit">Direct uploads retired</h2>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p className="max-w-2xl text-muted-foreground">
					This screen only accepts files from an authorized media root, preserving source traceability,
					permissions, and operation recovery.
				</p>
				<Button asChild>
					<a href="/files">
						<FolderUp aria-hidden="true" />
						Open file browser
					</a>
				</Button>
			</CardContent>
		</Card>
	);
}
