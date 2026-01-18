'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-context';

interface GradientBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: { r: number; g: number; b: number };
  movementPattern: 'circular' | 'linear' | 'figure8' | 'spiral';
  phase: number;
  speed: number;
  pulseSpeed: number;
  glowIntensity: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Color palettes for light and dark modes
    const colorPalettes = {
      dark: [
        { r: 16, g: 185, b: 129 },   // Emerald (Solana-inspired)
        { r: 59, g: 130, b: 246 },   // Blue (Ethereum-inspired)
        { r: 147, g: 51, b: 234 },   // Purple (Polygon-inspired)
        { r: 236, g: 72, b: 153 },   // Pink (Cosmos-inspired)
        { r: 249, g: 115, b: 22 },   // Orange
        { r: 34, g: 197, b: 94 },    // Green
      ],
      light: [
        { r: 5, g: 150, b: 105 },    // Darker Emerald
        { r: 37, g: 99, b: 235 },    // Darker Blue
        { r: 126, g: 34, b: 206 },   // Darker Purple
        { r: 219, g: 39, b: 119 },   // Darker Pink
        { r: 234, g: 88, b: 12 },    // Darker Orange
        { r: 22, g: 163, b: 74 },    // Darker Green
      ],
    };

    const currentPalette = colorPalettes[theme];

    // Set canvas size
    const setCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      return { width, height };
    };

    const dimensions = setCanvasSize();
    const handleResize = () => {
      setCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    // Create diverse gradient blobs with different patterns
    const blobs: GradientBlob[] = [];
    const numBlobs = 8;

    const movementPatterns: Array<'circular' | 'linear' | 'figure8' | 'spiral'> = [
      'circular',
      'linear',
      'figure8',
      'spiral',
    ];

    for (let i = 0; i < numBlobs; i++) {
      const color = currentPalette[i % currentPalette.length];
      blobs.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * (0.3 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * (0.3 + Math.random() * 0.4),
        baseRadius: 200 + Math.random() * 400,
        radius: 200 + Math.random() * 400,
        color,
        movementPattern: movementPatterns[i % movementPatterns.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
        pulseSpeed: 0.5 + Math.random() * 0.5,
        glowIntensity: 0.1 + Math.random() * 0.15,
      });
    }

    // Animation loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.012;
      const { width, height } = { width: canvas.width, height: canvas.height };

      // Clear with fade - more subtle for dark mode, slightly more visible for light
      const fadeAlpha = theme === 'dark' ? 0.04 : 0.03;
      ctx.fillStyle = theme === 'dark' ? `rgba(10, 10, 10, ${fadeAlpha})` : `rgba(255, 255, 255, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);

      // Update blob positions with diverse movement patterns
      blobs.forEach((blob, index) => {
        const t = time * blob.speed + blob.phase;
        let dx = 0;
        let dy = 0;

        switch (blob.movementPattern) {
          case 'circular':
            dx = Math.cos(t) * 20;
            dy = Math.sin(t) * 20;
            break;
          case 'linear':
            dx = Math.cos(t * 0.7) * 15;
            dy = Math.sin(t * 0.5) * 15;
            break;
          case 'figure8':
            dx = Math.sin(t) * 25;
            dy = Math.sin(t * 2) * 12;
            break;
          case 'spiral':
            const spiralRadius = t * 0.5;
            dx = Math.cos(t) * spiralRadius;
            dy = Math.sin(t) * spiralRadius;
            break;
        }

        blob.x += blob.vx + dx * 0.1;
        blob.y += blob.vy + dy * 0.1;

        // Wrap around edges smoothly
        if (blob.x < -blob.radius) blob.x = width + blob.radius;
        if (blob.x > width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = height + blob.radius;
        if (blob.y > height + blob.radius) blob.y = -blob.radius;

        // Dynamic pulsing radius
        const pulse = Math.sin(time * blob.pulseSpeed + index) * 0.15 + 0.85;
        blob.radius = blob.baseRadius * pulse;
      });

      // Draw blobs with dynamic glow and opacity
      blobs.forEach((blob, index) => {
        // Dynamic opacity based on time and position
        const baseOpacity = theme === 'dark' ? 0.12 : 0.08;
        const timeOpacity = Math.sin(time * blob.pulseSpeed + index * 0.5) * 0.08;
        const distanceFromCenter = Math.sqrt(
          Math.pow(blob.x - width / 2, 2) + Math.pow(blob.y - height / 2, 2)
        );
        const maxDistance = Math.sqrt(width * width + height * height) / 2;
        const centerFade = 1 - (distanceFromCenter / maxDistance) * 0.3;
        
        const opacity = baseOpacity + timeOpacity;
        const finalOpacity = Math.max(0.05, Math.min(0.25, opacity * centerFade));

        // Create radial gradient with multiple color stops for glow effect
        const radialGradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        );

        // Dynamic glow intensity
        const glow = blob.glowIntensity + Math.sin(time * 2 + index) * 0.05;
        const coreOpacity = finalOpacity * (1 + glow);
        const midOpacity = finalOpacity * 0.6;
        const edgeOpacity = finalOpacity * 0.3;
        const outerOpacity = 0;

        radialGradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${coreOpacity})`);
        radialGradient.addColorStop(0.25, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${midOpacity})`);
        radialGradient.addColorStop(0.5, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${edgeOpacity})`);
        radialGradient.addColorStop(0.75, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${outerOpacity + 0.02})`);
        radialGradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${outerOpacity})`);

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle outer glow for extra depth
        const glowGradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          blob.radius * 0.8,
          blob.x,
          blob.y,
          blob.radius * 1.5
        );
        glowGradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${finalOpacity * 0.3})`);
        glowGradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    const timeoutId = setTimeout(() => {
      animate();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-[1] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'transparent',
        }}
      />
      {/* Theme-aware gradient overlay */}
      <div
        className={`absolute inset-0 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-neutral-950/25 via-neutral-950/15 to-neutral-950/25'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-white/20'
        }`}
      />
    </div>
  );
}
