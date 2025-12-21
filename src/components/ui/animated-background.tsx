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

    // Particle class for Solana blocks/transactions
    class SolanaBlock {
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
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.3 + 0.1;
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

        // Create glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 3);
        gradient.addColorStop(0, `rgba(16, 185, 129, ${this.opacity * this.glow})`);
        gradient.addColorStop(0.5, `rgba(16, 185, 129, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

        // Draw block/transaction shape (small rectangle)
        ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`;
        ctx.fillRect(-this.size * 0.8, -this.size * 0.4, this.size * 1.6, this.size * 0.8);

        ctx.restore();
      }
    }

    // Connection lines between blocks (representing transactions)
    class ConnectionLine {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
      speed: number;
      length: number;

      constructor(block1: SolanaBlock, block2: SolanaBlock) {
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

      update(block1: SolanaBlock, block2: SolanaBlock) {
        this.x1 = block1.x;
        this.y1 = block1.y;
        this.x2 = block2.x;
        this.y2 = block2.y;
        this.opacity += (Math.random() - 0.5) * 0.01;
        this.opacity = Math.max(0.02, Math.min(0.15, this.opacity));
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.length > 200) return; // Don't draw long connections

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${this.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Create particles (Solana blocks)
    const blocks: SolanaBlock[] = [];
    const numBlocks = 30;
    for (let i = 0; i < numBlocks; i++) {
      blocks.push(new SolanaBlock(canvas.width, canvas.height));
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ background: 'transparent' }}
    />
  );
}
