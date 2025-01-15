import { Suspense } from "react";
import { getNavigationData } from "@/app/actions/nav.actions";
import { NavPanel } from "./nav-panel";
import { NavPanelSkeleton } from "./nav-panel-skeleton";

export async function NavPanelServer() {
	const data = await getNavigationData();

	return (
		<Suspense fallback={<NavPanelSkeleton />}>
			<NavPanel initialData={data} />
		</Suspense>
	);
}
