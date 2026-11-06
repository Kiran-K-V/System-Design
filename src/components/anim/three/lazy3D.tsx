import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';

function Placeholder({ text }: { text: string }) {
  return (
    <div className="not-prose my-8 grid min-h-[34rem] place-items-center rounded-2xl border border-line bg-surface/40 px-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}

/**
 * Wraps a 3D lesson component so the 3D library never runs on the server.
 * The server and the first paint show a plain box. After the page loads in the browser, the real component is fetched.
 */
export function lazy3D(load: () => Promise<{ default: ComponentType }>): ComponentType {
  const Inner = lazy(load);
  return function Lazy3D() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const wait = <Placeholder text="Loading the 3D picture" />;
    return mounted ? (
      <Suspense fallback={wait}>
        <Inner />
      </Suspense>
    ) : (
      wait
    );
  };
}
