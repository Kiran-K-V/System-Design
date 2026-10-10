import FlowDiagram from '../FlowDiagram';

/** Static infographic: where a load balancer, an API gateway, and a service mesh sit. */
export default function GatewayLayers() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <FlowDiagram
        width={720}
        height={280}
        label="Client traffic enters through a load balancer and an API gateway. Inside the cluster a service mesh carries service-to-service calls."
        nodes={[
          { id: 'client', x: 60, y: 110, w: 90, h: 56, label: 'Client' },
          { id: 'lb', x: 190, y: 110, w: 110, h: 56, label: 'Load balancer' },
          { id: 'gw', x: 345, y: 110, w: 110, h: 56, label: 'API gateway', tone: 'accent' },
          { id: 'orders', x: 540, y: 80, w: 100, h: 50, label: 'Orders' },
          { id: 'users', x: 540, y: 150, w: 100, h: 50, label: 'Users' },
          { id: 'pay', x: 665, y: 115, w: 80, h: 50, label: 'Pay' },
        ]}
        edges={[
          { from: 'client', to: 'lb' },
          { from: 'lb', to: 'gw' },
          { from: 'gw', to: 'orders' },
          { from: 'gw', to: 'users' },
          { from: 'orders', to: 'pay', tone: 'purple' },
          { from: 'users', to: 'pay', tone: 'purple' },
        ]}
        groups={[{ x: 460, y: 20, w: 250, h: 200, label: 'Cluster with a mesh' }]}
        notes={[
          { x: 200, y: 215, text: 'North-south: outside to inside', anchor: 'middle', tone: 'accent' },
          { x: 200, y: 240, text: 'API gateway: auth, limits, routes', anchor: 'middle' },
          { x: 590, y: 245, text: 'East-west: service to service', anchor: 'middle', tone: 'purple' },
          { x: 590, y: 265, text: 'Mesh sidecars: retries, mTLS', anchor: 'middle' },
        ]}
      />
    </figure>
  );
}
