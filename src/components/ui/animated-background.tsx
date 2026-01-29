'use client';

import { useEffect, useRef, useState } from 'react';

interface GradientBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: { r: number; g: number; b: number };
  movementPattern: 'circular' | 'linear' | 'figure8' | 'spiral' | 'wave' | 'lissajous';
  phase: number;
  speed: number;
  pulseSpeed: number;
  glowIntensity: number;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number };
}

// Blockchain / paywall themed elements
interface BlockElement {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  phase: number;
  color: { r: number; g: number; b: number };
}

interface HexagonElement {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  phase: number;
  color: { r: number; g: number; b: number };
}

interface ChainLinkElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  phase: number;
  color: { r: number; g: number; b: number };
}

interface FlowLine {
  path: Array<{ x: number; y: number }>;
  dashOffset: number;
  speed: number;
  color: { r: number; g: number; b: number };
}

interface LockShape {
  x: number;
  y: number;
  size: number;
  phase: number;
  pulseSpeed: number;
  color: { r: number; g: number; b: number };
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Get theme from DOM class (works during SSR and client)
  useEffect(() => {
    setMounted(true);
    
    // Check initial theme from DOM
    const checkTheme = () => {
      if (typeof window === 'undefined') return;
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Modern, playful yet professional color palette - "stay playful, ship serious"
    const colorPalettes = {
      dark: [
        { r: 16, g: 185, b: 129 },   // Vibrant Emerald
        { r: 59, g: 130, b: 246 },   // Electric Blue
        { r: 147, g: 51, b: 234 },   // Rich Purple
        { r: 236, g: 72, b: 153 },   // Playful Pink
        { r: 251, g: 146, b: 60 },   // Warm Orange
        { r: 34, g: 197, b: 94 },    // Fresh Green
        { r: 99, g: 102, b: 241 },   // Indigo
        { r: 168, g: 85, b: 247 },   // Violet
      ],
      light: [
        { r: 5, g: 150, b: 105 },    // Deep Emerald
        { r: 37, g: 99, b: 235 },    // Deep Blue
        { r: 126, g: 34, b: 206 },   // Deep Purple
        { r: 219, g: 39, b: 119 },   // Deep Pink
        { r: 234, g: 88, b: 12 },    // Deep Orange
        { r: 22, g: 163, b: 74 },    // Deep Green
        { r: 67, g: 56, b: 202 },    // Deep Indigo
        { r: 139, g: 92, b: 246 },   // Deep Violet
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

    // Create diverse gradient blobs with trails
    const blobs: GradientBlob[] = [];
    const numBlobs = 10;
    const maxTrailLength = 15;

    const movementPatterns: Array<'circular' | 'linear' | 'figure8' | 'spiral' | 'wave' | 'lissajous'> = [
      'circular',
      'linear',
      'figure8',
      'spiral',
      'wave',
      'lissajous',
    ];

    for (let i = 0; i < numBlobs; i++) {
      const color = currentPalette[i % currentPalette.length];
      blobs.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        vy: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        baseRadius: 150 + Math.random() * 300,
        radius: 150 + Math.random() * 300,
        color,
        movementPattern: movementPatterns[i % movementPatterns.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        pulseSpeed: 0.6 + Math.random() * 0.6,
        glowIntensity: 0.15 + Math.random() * 0.2,
        trail: [],
      });
    }

    // Create particle system
    const particles: Particle[] = [];
    const maxParticles = 80;

    const createParticle = (x: number, y: number, color: { r: number; g: number; b: number }) => {
      if (particles.length < maxParticles) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1,
          maxLife: 0.5 + Math.random() * 1.5,
          size: 1 + Math.random() * 3,
          color,
        });
      }
    };

    // --- Blockchain / paywall themed elements ---
    const blocks: BlockElement[] = [];
    for (let i = 0; i < 6; i++) {
      blocks.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        w: 24 + Math.random() * 32,
        h: 16 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[i % currentPalette.length],
      });
    }

    const hexagons: HexagonElement[] = [];
    for (let i = 0; i < 5; i++) {
      hexagons.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        radius: 18 + Math.random() * 28,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[(i + 2) % currentPalette.length],
      });
    }

    const chainLinks: ChainLinkElement[] = [];
    for (let i = 0; i < 4; i++) {
      chainLinks.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[(i + 1) % currentPalette.length],
      });
    }

    const flowLines: FlowLine[] = [];
    const numFlowLines = 3;
    for (let fl = 0; fl < numFlowLines; fl++) {
      const steps = 12 + Math.floor(Math.random() * 8);
      const path: Array<{ x: number; y: number }> = [];
      const startX = Math.random() * dimensions.width * 0.3;
      const startY = Math.random() * dimensions.height;
      const ctrlX = dimensions.width * (0.3 + Math.random() * 0.4);
      const ctrlY = dimensions.height * (0.2 + Math.random() * 0.6);
      const endX = dimensions.width * (0.7 + Math.random() * 0.25);
      const endY = Math.random() * dimensions.height;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
        path.push({ x, y });
      }
      flowLines.push({
        path,
        dashOffset: Math.random() * 100,
        speed: 0.5 + Math.random() * 0.8,
        color: currentPalette[fl % currentPalette.length],
      });
    }

    const lockShapes: LockShape[] = [];
    for (let i = 0; i < 3; i++) {
      lockShapes.push({
        x: 0.15 * dimensions.width + Math.random() * 0.7 * dimensions.width,
        y: 0.1 * dimensions.height + Math.random() * 0.8 * dimensions.height,
        size: 14 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.4 + Math.random() * 0.4,
        color: currentPalette[(i + 4) % currentPalette.length],
      });
    }

    // Animation loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      try {
      time += 0.01;
      const { width, height } = { width: canvas.width, height: canvas.height };

      // Clear with sophisticated fade for trail effect
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const fadeAlpha = theme === 'dark' ? 0.08 : 0.06;
      ctx.fillStyle = theme === 'dark' ? `rgba(10, 10, 10, ${fadeAlpha})` : `rgba(250, 250, 250, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // --- Transaction flow lines (paywall: payment flow) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      flowLines.forEach((line) => {
        line.dashOffset += line.speed;
        const opacity = theme === 'dark' ? 0.12 : 0.08;
        ctx.strokeStyle = `rgba(${line.color.r}, ${line.color.g}, ${line.color.b}, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 16]);
        ctx.lineDashOffset = -line.dashOffset;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(line.path[0].x, line.path[0].y);
        for (let i = 1; i < line.path.length; i++) {
          ctx.lineTo(line.path[i].x, line.path[i].y);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();

      // --- Blockchain blocks ---
      blocks.forEach((block) => {
        block.x += block.vx;
        block.y += block.vy;
        block.rotation += block.rotSpeed;
        if (block.x < -block.w * 2) block.x = width + block.w;
        if (block.x > width + block.w * 2) block.x = -block.w;
        if (block.y < -block.h * 2) block.y = height + block.h;
        if (block.y > height + block.h * 2) block.y = -block.h;
      });
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      blocks.forEach((block) => {
        const opacity = 0.08 + Math.sin(time + block.phase) * 0.04;
        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate(block.rotation);
        ctx.strokeStyle = `rgba(${block.color.r}, ${block.color.g}, ${block.color.b}, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-block.w / 2, -block.h / 2, block.w, block.h);
        ctx.beginPath();
        ctx.moveTo(-block.w / 2 + 4, 0);
        ctx.lineTo(block.w / 2 - 4, 0);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // --- Hexagons (crypto/network nodes) ---
      hexagons.forEach((hex) => {
        hex.x += hex.vx;
        hex.y += hex.vy;
        hex.rotation += hex.rotSpeed;
        if (hex.x < -hex.radius * 2) hex.x = width + hex.radius * 2;
        if (hex.x > width + hex.radius * 2) hex.x = -hex.radius * 2;
        if (hex.y < -hex.radius * 2) hex.y = height + hex.radius * 2;
        if (hex.y > height + hex.radius * 2) hex.y = -hex.radius * 2;
      });
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      hexagons.forEach((hex) => {
        const opacity = 0.06 + Math.sin(time * 0.8 + hex.phase) * 0.04;
        ctx.save();
        ctx.translate(hex.x, hex.y);
        ctx.rotate(hex.rotation);
        ctx.strokeStyle = `rgba(${hex.color.r}, ${hex.color.g}, ${hex.color.b}, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 6;
          const px = hex.radius * Math.cos(a);
          const py = hex.radius * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // --- Chain links (blockchain) ---
      chainLinks.forEach((link) => {
        link.x += link.vx;
        link.y += link.vy;
        link.rotation += 0.008;
        if (link.x < -60) link.x = width + 60;
        if (link.x > width + 60) link.x = -60;
        if (link.y < -40) link.y = height + 40;
        if (link.y > height + 40) link.y = -40;
      });
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      chainLinks.forEach((link) => {
        const opacity = 0.07 + Math.sin(time + link.phase) * 0.03;
        ctx.save();
        ctx.translate(link.x, link.y);
        ctx.rotate(link.rotation);
        ctx.strokeStyle = `rgba(${link.color.r}, ${link.color.g}, ${link.color.b}, ${opacity})`;
        ctx.lineWidth = 1.5;
        const r = 20;
        const w = 28;
        ctx.beginPath();
        ctx.ellipse(0, -r / 2, w / 2, r / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, r / 2, w / 2, r / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // --- Lock shapes (paywall / gated access) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      lockShapes.forEach((lock) => {
        const pulse = 0.5 + 0.5 * Math.sin(time * lock.pulseSpeed + lock.phase);
        const opacity = 0.06 + pulse * 0.05;
        ctx.save();
        ctx.translate(lock.x, lock.y);
        ctx.strokeStyle = `rgba(${lock.color.r}, ${lock.color.g}, ${lock.color.b}, ${opacity})`;
        ctx.lineWidth = 1.5;
        const s = Math.max(1, lock.size);
        const r1 = Math.max(0.01, s * 0.5);
        const r2 = Math.max(0.01, s * 0.15);
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, r1, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        ctx.strokeRect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.9);
        ctx.beginPath();
        ctx.arc(0, s * 0.25, r2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // Update blob positions with diverse movement patterns
      blobs.forEach((blob, index) => {
        const t = time * blob.speed + blob.phase;
        let dx = 0;
        let dy = 0;

        switch (blob.movementPattern) {
          case 'circular':
            dx = Math.cos(t) * 30;
            dy = Math.sin(t) * 30;
            break;
          case 'linear':
            dx = Math.cos(t * 0.7) * 25;
            dy = Math.sin(t * 0.5) * 25;
            break;
          case 'figure8':
            dx = Math.sin(t) * 35;
            dy = Math.sin(t * 2) * 18;
            break;
          case 'spiral':
            const spiralRadius = t * 0.8;
            dx = Math.cos(t) * spiralRadius;
            dy = Math.sin(t) * spiralRadius;
            break;
          case 'wave':
            dx = Math.sin(t * 1.2) * 28;
            dy = Math.cos(t * 0.8) * 22;
            break;
          case 'lissajous':
            dx = Math.sin(t * 2) * 32;
            dy = Math.sin(t * 3) * 24;
            break;
        }

        const prevX = blob.x;
        const prevY = blob.y;

        blob.x += blob.vx + dx * 0.12;
        blob.y += blob.vy + dy * 0.12;

        // Wrap around edges smoothly
        if (blob.x < -blob.radius) blob.x = width + blob.radius;
        if (blob.x > width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = height + blob.radius;
        if (blob.y > height + blob.radius) blob.y = -blob.radius;

        // Dynamic pulsing radius
        const pulse = Math.sin(time * blob.pulseSpeed + index) * 0.2 + 0.8;
        blob.radius = blob.baseRadius * pulse;

        // Update trail
        blob.trail.push({ x: blob.x, y: blob.y, opacity: 1 });
        if (blob.trail.length > maxTrailLength) {
          blob.trail.shift();
        }
        blob.trail.forEach((point, i) => {
          point.opacity = i / blob.trail.length;
        });

        // Spawn particles occasionally
        if (Math.random() < 0.15) {
          createParticle(blob.x, blob.y, blob.color);
        }
      });

      // Update and draw particles (skip draw when lifeRatio <= 0 to avoid negative arc radius)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.vx *= 0.98;
        p.vy *= 0.98;

        const lifeRatio = p.life / p.maxLife;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const radius = Math.max(0.01, p.size * lifeRatio);
        const alpha = lifeRatio * 0.6;

        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw connecting lines between nearby blobs
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const dx = blobs[j].x - blobs[i].x;
          const dy = blobs[j].y - blobs[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 400;

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15;
            const gradient = ctx.createLinearGradient(
              blobs[i].x,
              blobs[i].y,
              blobs[j].x,
              blobs[j].y
            );
            
            gradient.addColorStop(0, `rgba(${blobs[i].color.r}, ${blobs[i].color.g}, ${blobs[i].color.b}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${blobs[j].color.r}, ${blobs[j].color.g}, ${blobs[j].color.b}, ${opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(blobs[i].x, blobs[i].y);
            ctx.lineTo(blobs[j].x, blobs[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw blob trails
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      blobs.forEach((blob) => {
        if (blob.trail.length < 2) return;

        ctx.strokeStyle = `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.3)`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let i = 0; i < blob.trail.length - 1; i++) {
          const current = blob.trail[i];
          const next = blob.trail[i + 1];
          
          const gradient = ctx.createLinearGradient(
            current.x,
            current.y,
            next.x,
            next.y
          );
          
          gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${current.opacity * 0.4})`);
          gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${next.opacity * 0.4})`);

          ctx.strokeStyle = gradient;
          if (i === 0) {
            ctx.moveTo(current.x, current.y);
          }
          ctx.lineTo(next.x, next.y);
        }
        ctx.stroke();
      });
      ctx.restore();

      // Draw blobs with enhanced glow and blending (dimmed so other elements stand out)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      blobs.forEach((blob, index) => {
        const safeRadius = Math.max(1, blob.radius);
        // Dimmed base opacity so orbs are subtler and other elements show better
        const baseOpacity = theme === 'dark' ? 0.09 : 0.06;
        const timeOpacity = Math.sin(time * blob.pulseSpeed + index * 0.5) * 0.05;
        const distanceFromCenter = Math.sqrt(
          Math.pow(blob.x - width / 2, 2) + Math.pow(blob.y - height / 2, 2)
        );
        const maxDistance = Math.sqrt(width * width + height * height) / 2;
        const centerFade = 1 - (distanceFromCenter / maxDistance) * 0.2;
        
        const opacity = baseOpacity + timeOpacity;
        const finalOpacity = Math.max(0.04, Math.min(0.16, opacity * centerFade));

        // Create radial gradient with multiple color stops for enhanced glow
        const radialGradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          safeRadius
        );

        // Dynamic glow intensity with more variation
        const glow = blob.glowIntensity + Math.sin(time * 2.5 + index) * 0.08;
        const coreOpacity = finalOpacity * (1.2 + glow);
        const midOpacity = finalOpacity * 0.7;
        const edgeOpacity = finalOpacity * 0.4;
        const outerOpacity = finalOpacity * 0.1;

        radialGradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${coreOpacity})`);
        radialGradient.addColorStop(0.2, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${midOpacity * 1.2})`);
        radialGradient.addColorStop(0.4, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${edgeOpacity})`);
        radialGradient.addColorStop(0.7, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${outerOpacity})`);
        radialGradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, safeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced outer glow with multiple layers (dimmed)
        const glowGradient1 = ctx.createRadialGradient(
          blob.x,
          blob.y,
          safeRadius * 0.7,
          blob.x,
          blob.y,
          safeRadius * 1.3
        );
        glowGradient1.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${finalOpacity * 0.25})`);
        glowGradient1.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = glowGradient1;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, safeRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Second glow layer for extra depth (dimmed)
        const glowGradient2 = ctx.createRadialGradient(
          blob.x,
          blob.y,
          safeRadius * 1.1,
          blob.x,
          blob.y,
          safeRadius * 1.8
        );
        glowGradient2.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${finalOpacity * 0.12})`);
        glowGradient2.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = glowGradient2;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, safeRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[AnimatedBackground]', err);
        }
      }
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
  }, [mounted, theme]);

  // Don't render anything during SSR
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-[1] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'transparent',
        }}
      />
      {/* Enhanced theme-aware gradient overlay with more depth */}
      <div
        className={`absolute inset-0 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-neutral-950/30 via-neutral-950/20 to-neutral-950/30'
            : 'bg-gradient-to-br from-white/25 via-white/15 to-white/25'
        }`}
      />
    </div>
  );
}
