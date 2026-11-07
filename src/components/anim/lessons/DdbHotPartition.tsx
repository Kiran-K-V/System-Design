import { lazy3D } from '../three/lazy3D';

/** 3D scene wrapper. The scene lives in DdbHotPartition3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./DdbHotPartition3D'));
