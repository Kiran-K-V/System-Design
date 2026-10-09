import { useEffect, useState, type ReactNode } from 'react';
import { BorderBeam, type BorderBeamColorVariant, type BorderBeamSize } from 'border-beam';

interface Props {
  children: ReactNode;
  size?: BorderBeamSize;
  colors?: BorderBeamColorVariant;
  radius: number;
  strength?: number;
  className?: string;
}

// libraries.dev border-beam, blue-purple unless told otherwise. Stops for users who ask for reduced motion.
export default function Beam({ children, size = 'sm', colors = 'ocean', radius, strength = 1, className }: Props) {
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    setMotion(!q.matches);
    const on = () => setMotion(!q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  return (
    <BorderBeam
      size={size}
      colorVariant={colors}
      theme="auto"
      borderRadius={radius}
      strength={strength}
      active={motion}
      className={className}
    >
      {children}
    </BorderBeam>
  );
}
