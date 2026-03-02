import React, { useCallback, useId } from 'react';
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from 'framer-motion';

const GridPattern = ({ offsetX, offsetY, id }) => {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-800 dark:text-slate-200"
          />
        </motion.pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export function useGridMouse() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const handleMouseMove = useCallback((e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  }, [mouseX, mouseY]);

  return { mouseX, mouseY, handleMouseMove, handleMouseLeave };
}

export default function GridBackground({ mouseX, mouseY }) {
  const uid = useId();
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.3) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.3) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
      {/* Always-visible subtle background grid */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ width: '100%', height: '100%' }}>
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} id={`${uid}-bg`} />
      </div>

      {/* Mouse-reveal brighter grid */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{ maskImage, WebkitMaskImage: maskImage, width: '100%', height: '100%' }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} id={`${uid}-hover`} />
      </motion.div>
    </div>
  );
}
