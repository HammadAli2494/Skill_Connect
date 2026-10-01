export const easeOut = [0.22, 1, 0.36, 1];

export const menuMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.16, ease: easeOut },
};
