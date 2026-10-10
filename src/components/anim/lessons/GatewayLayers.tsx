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
          { id: 'client', x: 70, y: 110, w: 90, h: 56, label: 'Client' },
          { id: 'lb', x: 215, y: 110, w: 130, h: 56, label: 'Load balancer' },
          { id: 'gw', x: 380, y: 110, w: 120, h: 56, label: 'API gateway', tone: 'accent' },
          { id: 'orders', x: 560, y: 80, w: 90, h: 50, label: 'Orders' },
          { id: 'users', x: 560, y: 150, w: 90, h: 50, label: 'Users' },
          { id: 'pay', x: 668, y: 115, w: 70, h: 50, label: 'Pay' },
        ]}
        edges={[
          { from: 'client', to: 'lb' },
          { from: 'lb', to: 'gw' },
          { from: 'gw', to: 'orders' },
          { from: 'gw', to: 'users' },
          { from: 'orders', to: 'pay', tone: 'purple' },
          { from: 'users', to: 'pay', tone: 'purple' },
        ]}
        groups={[{ x: 495, y: 20, w: 215, h: 200, label: 'Cluster with a mesh' }]}
        notes={[
          { x: 225, y: 215, text: 'North-south: outside to inside', anchor: 'middle', tone: 'accent' },
          { x: 225, y: 240, text: 'API gateway: auth, limits, routes', anchor: 'middle' },
          { x: 600, y: 245, text: 'East-west: service to service', anchor: 'middle', tone: 'purple' },
          { x: 600, y: 265, text: 'Mesh sidecars: retries, mTLS', anchor: 'middle' },
        ]}
      />
    </figure>
  );
}
