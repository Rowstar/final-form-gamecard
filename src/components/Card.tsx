import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { API_URL } from "../lib/api.ts";
import { soundManager } from '../lib/soundManager';

export default function Card({
  card,
  isReveal = false,
  artOnly = false,
  motionEnabled = true,
}: {
  card: any,
  isReveal?: boolean,
  artOnly?: boolean,
  motionEnabled?: boolean,
}) {
  if (!card) return null;

  // Parallax setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!motionEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Mobile Gyroscope Parallax
  useEffect(() => {
    if (!motionEnabled) {
      x.set(0);
      y.set(0);
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!event.gamma || !event.beta) return;
      const gamma = Math.max(-30, Math.min(30, event.gamma));
      const beta = Math.max(-30, Math.min(30, event.beta - 45));
      x.set(gamma * 5);
      y.set(beta * 5);
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [motionEnabled, x, y]);

  return (
    <motion.div
      initial={isReveal ? { scale: 0.8, opacity: 0 } : { opacity: 1 }}
      animate={isReveal ? { scale: 1, opacity: 1 } : { opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100, duration: 1.5 }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.15 })}
      className={`relative inline-block w-full max-w-sm mx-auto rounded-2xl group cursor-pointer bg-transparent leading-none p-0 m-0`}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full rounded-2xl leading-none"
      >
        {/* FRONT OF CARD */}
        <div
          className="card-face-front relative w-full rounded-2xl overflow-hidden leading-none bg-zinc-900"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative z-0 leading-none h-full flex flex-col">
            {card.video_url ? (
              <video
                src={`${API_URL.replace('/api', '')}${card.video_url}`}
                poster={`${API_URL.replace('/api', '')}${typeof card.image_url === 'string' ? card.image_url : ''}`}
                autoPlay
                loop
                muted
                playsInline
                className="block w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                crossOrigin="anonymous"
              />
            ) : (
              <img
                src={`${API_URL.replace('/api', '')}${typeof card.image_url === 'string' ? card.image_url : ''}`}
                alt={typeof card.identity === 'string' ? card.identity : "Card Image"}
                className="block w-full h-auto transition-transform duration-700 group-hover:scale-[1.02] min-h-[400px] object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}

            {!artOnly && motionEnabled && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
                {/* Premium Overlay */}
                <div className="absolute inset-0 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay" />
                <div className="absolute inset-0 rounded-2xl border border-white/10 mix-blend-overlay" />
                <div className="absolute inset-[-150%] mix-blend-overlay" style={{
                  backgroundImage: 'linear-gradient(to top right, transparent 40%, rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 55%, transparent 60%)',
                  animation: 'foil-sheen 6s infinite linear'
                }} />
                {/* Micro sparkle dust */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full mix-blend-screen"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                      opacity: 0,
                      animation: `micro-sparkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s ease-in-out`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {!card.is_premium && !artOnly && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="w-[150%] bg-black/50 backdrop-blur-sm py-2 -rotate-12 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border-y border-white/10">
                <span className="text-xl font-black text-white/50 uppercase tracking-[0.3em] drop-shadow-md">
                  WATERMARK
                </span>
              </div>
            </div>
          )}

          {!artOnly && <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent mix-blend-overlay" />}
        </div>
      </motion.div>
    </motion.div>
  );
}
