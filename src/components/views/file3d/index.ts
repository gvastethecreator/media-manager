import { clientLogger } from '@/lib/logger/client-logger';
import type { ViewProps } from '../types';
import { File3DView } from './file3d-view';

const viewLogger = clientLogger.withContext('File3DViewContainer');

export function File3DViewContainer({ isVisible }: ViewProps) {
  if (!isVisible) return null;

  return <File3DView isVisible={isVisible} />;
}

export default File3DView;
export { File3DView };
export { default as File3DContentView } from './file3d-content-view';