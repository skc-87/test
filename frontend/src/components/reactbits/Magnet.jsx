import { useRef, useState } from 'react';

const Magnet = ({
  children,
  padding = 80,
  disabled = false,
  magnetStrength = 2,
  innerMagnetStrength = 0.2,
  className = '',
}) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [innerPosition, setInnerPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;

    setPosition({ x: distX / magnetStrength, y: distY / magnetStrength });
    setInnerPosition({ x: distX * innerMagnetStrength, y: distY * innerMagnetStrength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setInnerPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transition-transform duration-300 ease-out ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        padding: `${padding}px`,
        margin: `-${padding}px`,
      }}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translate(${innerPosition.x}px, ${innerPosition.y}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
