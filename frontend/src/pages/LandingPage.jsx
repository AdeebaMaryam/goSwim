import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, Shield, Users, Droplets, TrendingUp, Award, Bell, Activity, Wifi } from 'lucide-react';
import LiquidEther from '../components/LiquidEther';
import { AnimatedFeatureCard, AnimatedStatCard, AnimatedStepCard } from '../components/AnimatedCards';
import SplitText from '../components/SplitText';

const LandingPage = () => {

  return (
    <div className="w-full">
      {/* ========== HERO SECTION ========== */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Liquid Ether Background */}
        <div className="absolute inset-0 z-0 opacity-100">
          <LiquidEther />
        </div>

        {/* Dark overlay for readability and better text contrast */}
        <div className="absolute inset-0 bg-slate-950/75 z-1" />

        {/* Hero content */}
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-block mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/50 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
              animate={{
                boxShadow: ['0 0 20px rgba(169, 158, 255, 0.3)', '0 0 40px rgba(163, 227, 240, 0.4)', '0 0 20px rgba(169, 158, 255, 0.3)'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              🌊 Powered by Real-time IoT
            </motion.div>
          </motion.div>

          {/* Main heading using SplitText */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-4 leading-tight">
              <SplitText 
                text="Swim with" 
                className="text-white tracking-tight"
                delay={30}
                duration={0.8}
              />
              <br />
              <motion.span
                className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ backgroundSize: '200% 200%' }}
              >
                <SplitText 
                  text="Complete Confidence" 
                  delay={30}
                  duration={0.8}
                />
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle - improved readability */}
          <motion.div
            className="text-lg sm:text-xl text-white mb-10 max-w-3xl mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            Real-time water quality monitoring with IoT-verified data
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 inline-flex items-center gap-2"
              >
                <Wifi className="w-5 h-5" />
                Login
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="border-2 border-cyan-400/50 text-cyan-300 px-8 py-4 rounded-lg font-semibold hover:bg-cyan-400/10 backdrop-blur-md transition-all duration-300 inline-flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Sign Up
              </Link>
            </motion.div>
          </motion.div>

          {/* Info pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {[
              { icon: Droplets, label: 'pH Monitored' },
              { icon: Zap, label: 'Real-time' },
              { icon: Activity, label: '24/7 Data' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/70 border border-purple-500/40 text-white text-sm backdrop-blur-md font-medium"
                whileHover={{ scale: 1.1 }}
              >
                <item.icon className="w-4 h-4 text-cyan-400" />
                {item.label}
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg className="w-6 h-6 text-cyan-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ========== STATS SECTION ========== */}
      <motion.section
        className="relative bg-slate-950/90 backdrop-blur-md text-white py-16 overflow-hidden border-t border-purple-500/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
            backgroundSize: '100px 100px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedStatCard number="500+" label="Pools Connected" index={0} />
            <AnimatedStatCard number="98.5%" label="Avg Quality Score" index={1} />
            <AnimatedStatCard number="24/7" label="Live Monitoring" index={2} />
          </motion.div>
        </div>
      </motion.section>

      {/* ========== FEATURES SECTION ========== */}
      <motion.section
        className="py-20 bg-slate-950"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Why Choose goSwim?
            </h2>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto font-medium">
              Advanced IoT technology meets water safety. Know your pool's exact conditions in real-time.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, staggerChildren: 0.1 }}
          >
            <AnimatedFeatureCard icon={Zap} title="Live Data" description="Real-time sensor readings updated every 30 seconds." index={0} />
            <AnimatedFeatureCard icon={MapPin} title="Pool Finder" description="Interactive map to discover pools near you with ratings." index={1} />
            <AnimatedFeatureCard icon={Shield} title="Verified Safe" description="Blockchain-verified data ensures authenticity." index={2} />
            <AnimatedFeatureCard icon={TrendingUp} title="Trend Analysis" description="Historical data to track water quality patterns." index={3} />
          </motion.div>
        </div>
      </motion.section>

      {/* ========== HOW IT WORKS SECTION ========== */}
      <motion.section
        className="bg-slate-950/80 py-20 border-t border-purple-500/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatedStepCard number="1" title="Find a Pool" description="Browse pools on our interactive map or search." index={0} />
            <AnimatedStepCard number="2" title="Check Quality" description="View real-time pH, chlorine, and cleanliness scores." index={1} />
            <AnimatedStepCard number="3" title="Swim Safely" description="Only swim in pools rated 'Safe' with scores above 85." index={2} />
            <AnimatedStepCard number="4" title="Share Feedback" description="Report issues or share your experience with the community." index={3} />
          </motion.div>
        </div>
      </motion.section>

      {/* ========== EXCLUSIVE FEATURES SECTION ========== */}
      <motion.section
        className="py-20 bg-slate-950"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Exclusive Features
            </h2>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto font-medium">
              Everything you need to find and manage safe swimming pools.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatedFeatureCard icon={Award} title="Pool Reviews" description="Read and write reviews from other swimmers to share experiences and insights about pools." index={0} />
            <AnimatedFeatureCard icon={Bell} title="Smart Alerts" description="Get notified when water quality reaches unsafe levels in your favorite pools." index={1} />
            <AnimatedFeatureCard icon={Users} title="Community Forum" description="Connect with swimmers, share tips, and discuss pool experiences." index={2} />
          </motion.div>
        </div>
      </motion.section>

      {/* ========== CTA SECTION ========== */}
      <motion.section
        className="relative bg-slate-950 text-white py-24 overflow-hidden border-t border-purple-500/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-purple-900/2 to-slate-950/0" />
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-5xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
            Ready to Swim Safely?
          </h2>
          <p className="text-xl text-white mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Join thousands of swimmers using goSwim for real-time water quality data and peace of mind.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-10 py-4 rounded-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
            >
              Get Started Today →
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default LandingPage;
