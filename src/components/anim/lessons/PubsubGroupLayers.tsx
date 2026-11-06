import { lazy3D } from '../three/lazy3D';

/** Consumer groups as layers over the same partitions. The scene lives in PubsubGroupLayers3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./PubsubGroupLayers3D'));
