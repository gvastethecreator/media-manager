import type { ViewProps } from '../types';
import File3DContentView from './file3d-content-view';

/**
 * Vista contenedor de archivos 3D
 * Delegamos toda la lógica al ContentView que ya usa el store.
 */
export function File3DView(_props: ViewProps) {
	return <File3DContentView />;
}
