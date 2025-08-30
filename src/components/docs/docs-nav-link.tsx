import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DocsNavLink() {
	return (
		<Link to="/docs">
			<Button className="h-8 px-3" size="sm" variant="ghost">
				<BookOpen className="mr-2 h-4 w-4" />
				Documentación
			</Button>
		</Link>
	);
}
