import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SplitText = ({ 
  text, 
  tag: Tag = 'p', 
  className = '',
  delay = 50,
  duration = 1.25,
  staggerChildren = true,
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 }
}) => {
  const characters = text.split('');
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerChildren ? (delay / 1000) : 0,
        delayChildren: 0,
      },
    },
  };

  const charVariants = {
    hidden: from,
    visible: {
      ...to,
      transition: {
        duration,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={{ display: 'inline-block' }}
    >
      {characters.map((char, i) => (
        <motion.span key={i} variants={charVariants}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default SplitText;
