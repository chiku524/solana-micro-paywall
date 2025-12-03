'use client';

import { useEffect, useRef, useState } from 'react';

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  // Only render canvas after client-side mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation settings
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      targetOpacity: number;
    }> = [];

    // Create floating orbs - subtle and soothing
    const particleCount = Math.min(5, Math.floor(window.innerWidth / 350));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 180 + Math.random() * 220,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        opacity: 0.12 + Math.random() * 0.08,
        targetOpacity: 0.12 + Math.random() * 0.08,
      });
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep particles within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Smooth opacity transition with breathing effect
        particle.opacity += (particle.targetOpacity - particle.opacity) * 0.008;

        // Randomly change target opacity for gentle breathing effect
        if (Math.random() < 0.003) {
          particle.targetOpacity = 0.12 + Math.random() * 0.08;
        }

        // Draw gradient orb with emerald and subtle blue tones
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius
        );
        // Use emerald-500 and blue-500 with more visible opacity
        gradient.addColorStop(0, `rgba(16, 185, 129, ${particle.opacity})`); // emerald-500
        gradient.addColorStop(0.25, `rgba(16, 185, 129, ${particle.opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${particle.opacity * 0.5})`); // blue-500 for depth
        gradient.addColorStop(0.75, `rgba(16, 185, 129, ${particle.opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  // Don't render canvas during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
}

