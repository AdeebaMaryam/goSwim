import { motion } from 'framer-motion';
import ElectricBorder from './ElectricBorder';

export const AnimatedFeatureCard = ({ icon: Icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: 'easeOut',
      }}
      viewport={{ once: true, margin: '-100px' }}
      whileHover={{
        y: -10,
      }}
    >
      <ElectricBorder
        color="#a99eff"
        speed={1.5}
        chaos={0.1}
        borderRadius={16}
        className="p-8 h-full"
      >
        <div className="flex flex-col h-full relative z-10">
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 bg-gradient-to-br from-purple-400 to-cyan-300 transition-opacity duration-300"
            animate={{
              background: [
                'linear-gradient(135deg, rgba(169,158,255,0) 0%, rgba(163,227,240,0) 100%)',
                'linear-gradient(135deg, rgba(169,158,255,0.1) 0%, rgba(163,227,240,0.1) 100%)',
                'linear-gradient(135deg, rgba(169,158,255,0) 0%, rgba(163,227,240,0) 100%)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                delay: index * 0.2 + 0.2,
              }}
              viewport={{ once: true }}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30"
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>

            <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
            <p className="text-gray-100 leading-relaxed font-medium">{description}</p>

            {/* Animated underline */}
            <motion.div
              className="mt-4 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: '2rem' }}
              transition={{
                duration: 0.6,
                delay: index * 0.2 + 0.4,
              }}
              viewport={{ once: true }}
            />
          </div>
        </div>
      </ElectricBorder>
    </motion.div>
  );
};

export const AnimatedStatCard = ({ number, label, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        type: 'spring',
      }}
      viewport={{ once: true }}
      className="text-center"
    >
      <motion.div
        className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2"
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: index * 0.2,
        }}
      >
        {number}
      </motion.div>
      <div className="text-cyan-300">{label}</div>
    </motion.div>
  );
};

export const AnimatedStepCard = ({ number, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
      }}
      viewport={{ once: true }}
      className="text-center relative"
    >
      <motion.div
        className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative shadow-lg shadow-purple-500/50"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(169, 158, 255, 0.7)',
            '0 0 0 30px rgba(169, 158, 255, 0)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {number}
      </motion.div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-100 font-medium">{description}</p>

      {/* Connector line */}
      {index < 3 && (
        <motion.div
          className="hidden md:block absolute top-8 -right-8 w-16 h-1 bg-gradient-to-r from-purple-600 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{
            duration: 0.6,
            delay: index * 0.15 + 0.3,
          }}
          viewport={{ once: true }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </motion.div>
  );
};
