import { lazy3D } from '../three/lazy3D';

/** The 3D shard and replica picture. The scene lives in ShardRegionBlock3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./ShardRegionBlock3D'));
