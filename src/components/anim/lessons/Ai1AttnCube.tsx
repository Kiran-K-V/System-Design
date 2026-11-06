import { lazy3D } from '../three/lazy3D';

/** The 3D score cube. The scene lives in Ai1AttnCube3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./Ai1AttnCube3D'));
