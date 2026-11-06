import { lazy3D } from '../three/lazy3D';

/** The MVCC version stack. The scene lives in TxVersionStack3D so the 3D library loads only in the browser. */
export default lazy3D(() => import('./TxVersionStack3D'));
