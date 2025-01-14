import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { TagUsage } from "./tag-usage";
import { getSystemStats } from "@/app/actions/stats.actions";

export async function TopTags() {
	const stats = await getSystemStats();

	return (
		<>
			<CardHeader className="px-0 py-2 mt-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Tag className="h-4 w-4 text-primary" />
					Etiquetas Más Usadas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 space-y-1 w-full gap-2">
				{stats.topTags.map((tag, i) => (
					<TagUsage key={i} tag={tag} />
				))}
			</CardContent>
		</>
	);
}
