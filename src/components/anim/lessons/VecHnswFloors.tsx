import { lazy3D } from '../three/lazy3D';

/** HNSW layers as stacked floors. The scene lives in VecHnsw3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./VecHnsw3D'));
