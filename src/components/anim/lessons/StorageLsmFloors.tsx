import { lazy3D } from '../three/lazy3D';

/** An LSM tree drawn as floors. The scene lives in StorageLsmFloors3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./StorageLsmFloors3D'));
