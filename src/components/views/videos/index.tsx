import { clientLogger } from '@/lib/logger/client-logger';
import type { ViewProps } from '../types';
import VideosView from './videos-view';

const viewLogger = clientLogger.withContext('VideosViewContainer');

export function VideosViewContainer({ isVisible }: ViewProps) {
	if (!isVisible) {
		return null;
	}

	return <VideosView className="h-full" />;
}

export default VideosView;
export { VideoContentView } from './videos-content-view';
