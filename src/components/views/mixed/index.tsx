import { clientLogger } from '@/lib/logger/client-logger';
import type { ViewProps } from '../types';
import MixedView from './mixed-view';

const viewLogger = clientLogger.withContext('MixedViewContainer');

export function MixedViewContainer({ isVisible }: ViewProps) {
	if (!isVisible) return null;

	return <MixedView className="h-full" />;
}

export default MixedView;
export { MixedContentView } from './mixed-content-view';
