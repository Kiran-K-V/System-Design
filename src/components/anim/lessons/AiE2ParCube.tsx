import { lazy3D } from '../three/lazy3D';

/** The 3D GPU cube. The scene lives in AiE2ParCube3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./AiE2ParCube3D'));
