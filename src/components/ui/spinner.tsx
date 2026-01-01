import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
	return <Loader2Icon aria-label="Cargando" className={cn('size-4 animate-spin', className)} role="status" {...props} />;
}

export { Spinner };
