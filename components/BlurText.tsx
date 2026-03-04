import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, Variants } from 'motion/react';

interface BlurTextProps {
  text: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  delay?: number;
  stepDuration?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  onAnimationComplete?: () => void;
}

export default function BlurText({
  text,
  animateBy = 'words',
  direction = 'top',
  delay = 200,
  stepDuration = 0.35,
  threshold = 0.1,
  rootMargin = '0px',
  className = '',
  onAnimationComplete,
}: BlurTextProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const tokens = animateBy === 'words' ? text.split(' ') : text.split('');

  const yOffset = direction === 'top' ? -20 : 20;

  const variants: Variants = {
    hidden: { opacity: 0, filter: 'blur(10px)', y: yOffset },
    visible: (i: number) => ({
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        delay: (i * delay) / 1000,
        duration: stepDuration,
        ease: 'easeOut',
      },
    }),
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          controls.start('visible').then(() => {
            setHasAnimated(true);
            onAnimationComplete?.();
          });
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [controls, hasAnimated, threshold, rootMargin, onAnimationComplete]);

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {tokens.map((token, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          initial="hidden"
          animate={controls}
          className="inline-block"
          style={{ whiteSpace: animateBy === 'words' ? undefined : 'pre' }}
        >
          {token}{animateBy === 'words' && i < tokens.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
