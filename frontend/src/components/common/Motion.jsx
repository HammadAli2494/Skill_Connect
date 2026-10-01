import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { menuMotion } from '../../utils/motion';

export function AnimatedShow({ show, children, className = '', ...rest }) {
  const [mounted, setMounted] = useState(show);
  if (show && !mounted) setMounted(true);

  useEffect(() => {
    if (show || !mounted) return undefined;
    const timer = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [show, mounted]);

  if (!mounted) return null;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -4 }}
      animate={show ? menuMotion.animate : menuMotion.exit}
      transition={menuMotion.transition}
      {...rest}
      aria-hidden={show ? undefined : true}
    >
      {children}
    </motion.div>
  );
}
