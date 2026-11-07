import { lazy3D } from '../three/lazy3D';

/** Replication across regions on a globe. The scene lives in ReplicationGlobe3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./ReplicationGlobe3D'));
