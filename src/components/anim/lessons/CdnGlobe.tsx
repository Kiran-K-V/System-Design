import { lazy3D } from '../three/lazy3D';

/** The 3D CDN globe. The scene lives in CdnGlobe3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./CdnGlobe3D'));
