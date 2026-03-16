import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';
import { useRef, useCallback, useState } from 'react';

const GradientText = ({
  children,
  className = '',
  colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#4f46e5'],
  animationSpeed = 8,
  showBorder = false,
}) => {
  const svgRef = useRef(null);
  const progress = useMotionValue(0);
  const [isPaused, setIsPaused] = useState(false);

  useAnimationFrame((_, delta) => {
    if (!isPaused) {
      progress.set(progress.get() + delta * animationSpeed * 0.001);
    }
  });

  const backgroundPosition = useTransform(progress, (val) => {
    return `${(val * 50) % 300}% 0%`;
  });

  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const borderGradient = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '300% 100%',
  };

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        ...gradientStyle,
        backgroundPosition,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showBorder && (
        <motion.span
          className="absolute inset-0 rounded-lg pointer-events-none z-0"
          style={{
            padding: '2px',
            background: `linear-gradient(90deg, ${colors.join(', ')})`,
            backgroundSize: '300% 100%',
            backgroundPosition,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            borderRadius: 'inherit',
          }}
        />
      )}
      {children}
    </motion.span>
  );
};

export default GradientText;
