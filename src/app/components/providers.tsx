// components/Providers.tsx
'use client';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Preload Three.js and other heavy dependencies
    const preload = async () => {
      await import('three');
      await import('three/examples/jsm/controls/OrbitControls.js');
    };
    preload();
  }, []);

  return <>{children}</>;
}