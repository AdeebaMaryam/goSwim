import { motion } from 'framer-motion';

const Logo = () => {
  return (
    <motion.div
      className="flex items-center gap-1"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        goSwim
      </span>
    </motion.div>
  );
};

export default Logo;
