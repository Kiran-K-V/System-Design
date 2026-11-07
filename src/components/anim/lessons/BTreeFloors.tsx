import { lazy3D } from '../three/lazy3D';

/** A B+tree as floors. The scene lives in BTreeFloors3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./BTreeFloors3D'));
