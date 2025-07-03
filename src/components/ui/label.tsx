// Base UI no expone un componente 'label' directamente. Se utiliza el
// paquete `field` y se extrae `Field.Label`.
import { Field } from '@base-ui-components/react/field';

const BaseUILabel = Field.Label;

import * as React from 'react';

import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<typeof BaseUILabel>) {
	return (
		<BaseUILabel
			className={cn(
				'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className
			)}
			{...props}
		/>
	);
}

export { Label };
