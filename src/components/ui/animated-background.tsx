'use client';

import { useEffect, useRef } from 'react';

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

    // Particle class for blockchain transaction blocks
    class TransactionBlock {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      glow: number;
      rotation: number;
      rotationSpeed: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
      this.size = Math.random() * 5 + 3; // Increased size for better visibility
      this.speed = Math.random() * 1 + 0.4; // Slightly faster movement
      this.opacity = Math.random() * 0.5 + 0.3; // Increased opacity for better visibility
        this.glow = Math.random() * 0.5 + 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;

        if (this.y > canvasHeight + 10) {
          this.y = -10;
          this.x = Math.random() * canvasWidth;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Create glow effect (blockchain-agnostic neon color)
        // Color can be easily changed: Emerald (16,185,129), Blue (59,130,246), Purple (147,51,234)
        const glowColor = '16, 185, 129'; // Emerald green - default, easily configurable
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 5);
        gradient.addColorStop(0, `rgba(${glowColor}, ${this.opacity * this.glow * 0.8})`);
        gradient.addColorStop(0.3, `rgba(${glowColor}, ${this.opacity * 0.7})`);
        gradient.addColorStop(0.6, `rgba(${glowColor}, ${this.opacity * 0.4})`);
        gradient.addColorStop(0.9, `rgba(${glowColor}, ${this.opacity * 0.1})`);
        gradient.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size * 2.5, -this.size * 2.5, this.size * 5, this.size * 5);

        // Draw blockchain transaction block shape (rectangular block)
        ctx.fillStyle = `rgba(${glowColor}, ${this.opacity * 1.2})`;
        ctx.fillRect(-this.size * 0.9, -this.size * 0.5, this.size * 1.8, this.size * 1);

        ctx.restore();
      }
    }

    // Connection lines between blocks (representing transaction chains)
    class ConnectionLine {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
      speed: number;
      length: number;

      constructor(block1: TransactionBlock, block2: TransactionBlock) {
        this.x1 = block1.x;
        this.y1 = block1.y;
        this.x2 = block2.x;
        this.y2 = block2.y;
        this.opacity = Math.random() * 0.1 + 0.05;
        this.speed = Math.random() * 0.3 + 0.1;
        this.length = Math.sqrt(
          Math.pow(this.x2 - this.x1, 2) + Math.pow(this.y2 - this.y1, 2)
        );
      }

      update(block1: TransactionBlock, block2: TransactionBlock) {
        this.x1 = block1.x;
        this.y1 = block1.y;
        this.x2 = block2.x;
        this.y2 = block2.y;
        this.opacity += (Math.random() - 0.5) * 0.01;
        this.opacity = Math.max(0.02, Math.min(0.15, this.opacity));
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.length > 200) return; // Don't draw long connections

        // Blockchain-agnostic connection color
        const glowColor = '16, 185, 129'; // Emerald green - default
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        
        // Add glow effect to connection lines
        ctx.shadowBlur = 4;
        ctx.shadowColor = `rgba(${glowColor}, ${this.opacity * 0.8})`;
        ctx.strokeStyle = `rgba(${glowColor}, ${this.opacity * 1.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Create particles (blockchain transaction blocks)
    const blocks: TransactionBlock[] = [];
    const numBlocks = 50; // Increased for better visibility
    for (let i = 0; i < numBlocks; i++) {
      blocks.push(new TransactionBlock(canvas.width, canvas.height));
    }

    // Create connection lines between nearby blocks
    const connections: ConnectionLine[] = [];
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const dist = Math.sqrt(
          Math.pow(blocks[j].x - blocks[i].x, 2) + Math.pow(blocks[j].y - blocks[i].y, 2)
        );
        if (dist < 150) {
          connections.push(new ConnectionLine(blocks[i], blocks[j]));
        }
      }
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw connections
      connections.forEach((conn, idx) => {
        if (idx < blocks.length - 1) {
          conn.update(blocks[idx], blocks[idx + 1]);
          conn.draw(ctx);
        }
      });

      // Update and draw blocks
      blocks.forEach((block) => {
        block.update(canvas.width, canvas.height);
        block.draw(ctx);
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
          mixBlendMode: 'screen', // Makes the glow effect more visible
        }}
      />
    </div>
  );
}
