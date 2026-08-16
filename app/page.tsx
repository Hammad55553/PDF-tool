'use client';

import Link from 'next/link';
import ToolExplorer from '@/components/ToolExplorer';
import AdSlot from '@/components/AdSlot';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// The 3D Parallax Background Component
function ParallaxBackground() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Transform values for parallax effect
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white to-white" />
      
      {/* 3D Abstract Shapes */}
      <motion.div 
        style={{ y: y1, rotate: rotate1, scale }}
        className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-[80px]" 
      />
      <motion.div 
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-accent-400/20 blur-[100px]" 
      />
      <motion.div 
        style={{ y: y1 }}
        className="absolute -bottom-48 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[60px]" 
      />
      
      {/* Grid Pattern for 3D depth */}
      <motion.div 
        style={{ y: y2, opacity: useTransform(scrollYProgress, [0, 1], [0.3, 0.1]) }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />
    </div>
  );
}

export default function HomePage() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="relative">
      <ParallaxBackground />

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeUpVariant}>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-200 bg-white/80 backdrop-blur-md px-4 py-2 text-[11px] font-semibold leading-snug text-brand-700 shadow-sm sm:text-xs transition-all hover:bg-white hover:shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Every tool runs on our own servers — nothing outsourced
            </span>
          </motion.div>
          
          <motion.h1 variants={fadeUpVariant} className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Every PDF & image tool you need,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
              in one place
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUpVariant} className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            Merge, split, compress, convert, watermark and protect your files in seconds.
            Free to start — no account required.
          </motion.p>
          
          <motion.div variants={fadeUpVariant} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <Link href="#tools" className="btn-primary w-full sm:w-auto px-8 py-4 text-base shadow-brand-500/30 shadow-xl">
              Browse tools
            </Link>
            <Link href="/pricing" className="btn-secondary w-full sm:w-auto px-8 py-4 text-base shadow-sm">
              See Pro plans
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Tool grid with search + category tabs */}
      <section id="tools" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">All tools, always free to try</h2>
          <p className="mt-3 text-lg text-slate-500">Search or browse by category — processing happens instantly.</p>
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUpVariant}
        >
          <ToolExplorer />
        </motion.div>
        
        {/* Ad shown only to Free users (hidden for Pro / Ultra Pro) */}
        <AdSlot variant="banner" className="mt-12" />
      </section>

      {/* Go Pro banner */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-10 text-center text-white shadow-2xl shadow-brand-500/25 sm:flex-row sm:gap-8 sm:px-10 sm:py-12 sm:text-left overflow-hidden relative"
        >
          {/* Decorative shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-[-100%] hover:animate-[shine_1.5s_ease-in-out_infinite]" />
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold sm:text-3xl">Ready for unlimited, watermark-free files?</h3>
            <p className="mt-3 text-base text-white/90 sm:text-lg">
              Go Pro for bigger uploads, more files per batch, and priority processing.
            </p>
          </div>
          <Link
            href="/pricing"
            className="relative z-10 w-full whitespace-nowrap rounded-xl bg-white px-8 py-4 text-center text-base font-bold text-brand-700 shadow-xl transition-all hover:bg-brand-50 hover:scale-105 hover:shadow-2xl sm:w-auto"
          >
            Upgrade to Pro
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
