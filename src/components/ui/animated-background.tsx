'use client';

import { useEffect, useRef } from 'react';

interface GradientBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Multi-blockchain color palette - easily configurable
    const colorPalettes = {
      default: [
        { r: 16, g: 185, b: 129 },   // Emerald (Solana-inspired)
        { r: 59, g: 130, b: 246 },   // Blue (Ethereum-inspired)
        { r: 147, g: 51, b: 234 },   // Purple (Polygon-inspired)
        { r: 236, g: 72, b: 153 },   // Pink (Cosmos-inspired)
      ],
      warm: [
        { r: 251, g: 146, b: 60 },   // Orange
        { r: 239, g: 68, b: 68 },    // Red
        { r: 168, g: 85, b: 247 },   // Purple
        { r: 236, g: 72, b: 153 },   // Pink
      ],
      cool: [
        { r: 59, g: 130, b: 246 },   // Blue
        { r: 34, g: 211, b: 238 },   // Cyan
        { r: 16, g: 185, b: 129 },   // Emerald
        { r: 139, g: 92, b: 246 },   // Violet
      ],
    };

    const currentPalette = colorPalettes.default;

    // Create gradient blobs
    const blobs: GradientBlob[] = [];
    const numBlobs = 4;

    for (let i = 0; i < numBlobs; i++) {
      const color = currentPalette[i % currentPalette.length];
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 300 + 200,
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`,
      });
    }

    // Animation loop
    let animationFrameId: number;
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      
      // Clear with slight fade for smooth trail effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update blob positions with smooth movement
      blobs.forEach((blob, index) => {
        // Add subtle sine wave movement for organic feel
        const waveX = Math.sin(time + index) * 0.3;
        const waveY = Math.cos(time + index * 0.7) * 0.3;
        
        blob.x += blob.vx + waveX;
        blob.y += blob.vy + waveY;

        // Bounce off edges with slight damping
        if (blob.x < -blob.radius || blob.x > canvas.width + blob.radius) {
          blob.vx *= -1;
        }
        if (blob.y < -blob.radius || blob.y > canvas.height + blob.radius) {
          blob.vy *= -1;
        }

        // Wrap around edges smoothly
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius;
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius;
      });

      // Draw individual blobs with subtle glow and varying opacity
      blobs.forEach((blob, index) => {
        const color = currentPalette[index % currentPalette.length];
        
        // Create radial gradient for each blob
        const radialGradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        );
        
        // Subtle pulsing effect
        const pulse = Math.sin(time * 2 + index) * 0.05 + 0.1;
        
        radialGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 + pulse})`);
        radialGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.08 + pulse * 0.5})`);
        radialGradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.03)`);
        radialGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          background: 'transparent',
        }}
      />
      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-950/95 to-neutral-950" />
    </div>
  );
}
