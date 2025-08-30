import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DocsNavLink() {
	return (
		<Link to="/docs">
			<Button variant="ghost" size="sm" className="h-8 px-3">
				<BookOpen className="mr-2 h-4 w-4" />
				Documentación
			</Button>
		</Link>
	);
}
