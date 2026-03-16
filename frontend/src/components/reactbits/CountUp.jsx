import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  // When from === to (e.g. both 0), the spring never fires 'change',
  // so set the initial text content directly.
  useEffect(() => {
    if (ref.current && from === to) {
      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      };
      const formatted = Intl.NumberFormat('en-US', options).format(to);
      ref.current.textContent = separator
        ? formatted.replace(/,/g, separator)
        : formatted;
    }
  }, [from, to, separator]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isInView, startWhen, direction, from, to, delay, motionValue, onStart]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const options = {
          useGrouping: !!separator,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        };

        const formattedNumber = Intl.NumberFormat('en-US', options).format(
          latest.toFixed(0)
        );

        ref.current.textContent = separator
          ? formattedNumber.replace(/,/g, separator)
          : formattedNumber;
      }
    });

    return () => unsubscribe();
  }, [springValue, separator]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      const target = direction === 'down' ? from : to;
      if (
        direction === 'down' ? latest <= target : latest >= target
      ) {
        if (typeof onEnd === 'function') onEnd();
        unsubscribe();
      }
    });

    return () => unsubscribe();
  }, [springValue, direction, from, to, onEnd]);

  return <span ref={ref} className={className} />;
}
