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

    // Multi-blockchain color palette - easily configurable
    const colorPalettes = {
      default: [
        { r: 16, g: 185, b: 129 },   // Emerald (Solana-inspired)
        { r: 59, g: 130, b: 246 },   // Blue (Ethereum-inspired)
        { r: 147, g: 51, b: 234 },   // Purple (Polygon-inspired)
        { r: 236, g: 72, b: 153 },   // Pink (Cosmos-inspired)
      ],
    };

    const currentPalette = colorPalettes.default;

    // Set canvas size - use window dimensions for better reliability
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

    // Create gradient blobs
    const blobs: GradientBlob[] = [];
    const numBlobs = 6; // Increased for more visibility

    for (let i = 0; i < numBlobs; i++) {
      const color = currentPalette[i % currentPalette.length];
      blobs.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 400 + 300, // Larger blobs
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`, // More visible
      });
    }

    // Animation loop
    let animationFrameId: number;
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      
      const rect = canvas.getBoundingClientRect();
      
      // Clear with slight fade for smooth trail effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'; // Less fade for more visibility
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Update blob positions with smooth movement
      blobs.forEach((blob, index) => {
        // Add subtle sine wave movement for organic feel
        const waveX = Math.sin(time + index) * 0.3;
        const waveY = Math.cos(time + index * 0.7) * 0.3;
        
        blob.x += blob.vx + waveX;
        blob.y += blob.vy + waveY;

        // Bounce off edges with slight damping
        if (blob.x < -blob.radius || blob.x > rect.width + blob.radius) {
          blob.vx *= -1;
        }
        if (blob.y < -blob.radius || blob.y > rect.height + blob.radius) {
          blob.vy *= -1;
        }

        // Wrap around edges smoothly
        if (blob.x < -blob.radius) blob.x = rect.width + blob.radius;
        if (blob.x > rect.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = rect.height + blob.radius;
        if (blob.y > rect.height + blob.radius) blob.y = -blob.radius;
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
        
        // Subtle pulsing effect - increased visibility
        const pulse = Math.sin(time * 2 + index) * 0.08 + 0.15;
        
        radialGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.25 + pulse})`);
        radialGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 + pulse * 0.6})`);
        radialGradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
        radialGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation immediately
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
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-[1] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'transparent',
        }}
      />
      {/* Additional gradient overlay for depth - much more transparent to show animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/30 via-neutral-950/20 to-neutral-950/30" />
    </div>
  );
}
