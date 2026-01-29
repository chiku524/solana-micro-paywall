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

/** Soft expanding rings (replaces fast dashed flow lines) – calm “pulse” feel */
interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  expandSpeed: number;
  phase: number;
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
        { r: 16, g: 165, b: 120 },   // Emerald (visible on white)
        { r: 59, g: 120, b: 246 },   // Blue
        { r: 124, g: 58, b: 217 },   // Purple
        { r: 212, g: 55, b: 145 },   // Pink
        { r: 234, g: 100, b: 30 },   // Orange
        { r: 22, g: 163, b: 74 },    // Green
        { r: 79, g: 70, b: 229 },    // Indigo
        { r: 139, g: 92, b: 246 },   // Violet
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
    const maxTrailLength = 10;

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
        vx: (Math.random() - 0.5) * (0.1 + Math.random() * 0.15),
        vy: (Math.random() - 0.5) * (0.1 + Math.random() * 0.15),
        baseRadius: 150 + Math.random() * 300,
        radius: 150 + Math.random() * 300,
        color,
        movementPattern: movementPatterns[i % movementPatterns.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.3,
        pulseSpeed: 0.4 + Math.random() * 0.4,
        glowIntensity: 0.15 + Math.random() * 0.2,
        trail: [],
      });
    }

    // Create particle system
    const particles: Particle[] = [];
    const maxParticles = 50;

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
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
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
        vx: (Math.random() - 0.5) * 0.07,
        vy: (Math.random() - 0.5) * 0.07,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[(i + 2) % currentPalette.length],
      });
    }

    const chainLinks: ChainLinkElement[] = [];
    for (let i = 0; i < 4; i++) {
      chainLinks.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[(i + 1) % currentPalette.length],
      });
    }

    const pulseRings: PulseRing[] = [];
    const numRings = 5;
    for (let i = 0; i < numRings; i++) {
      pulseRings.push({
        x: dimensions.width * (0.15 + Math.random() * 0.7),
        y: dimensions.height * (0.15 + Math.random() * 0.7),
        radius: 0,
        maxRadius: 60 + Math.random() * 90,
        expandSpeed: 0.08 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        color: currentPalette[i % currentPalette.length],
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
      time += 0.006;
      const { width, height } = { width: canvas.width, height: canvas.height };

      // Clear with sophisticated fade for trail effect
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const fadeAlpha = theme === 'dark' ? 0.08 : 0.04;
      ctx.fillStyle = theme === 'dark' ? `rgba(10, 10, 10, ${fadeAlpha})` : `rgba(250, 250, 250, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // --- Soft pulse rings (calm replacement for fast flow lines) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      pulseRings.forEach((ring) => {
        ring.radius += ring.expandSpeed;
        if (ring.radius >= ring.maxRadius) ring.radius = 0;
        const r = Math.max(0.01, ring.radius);
        const fade = r < 8 ? r / 8 : Math.max(0, 1 - (r - ring.maxRadius * 0.7) / (ring.maxRadius * 0.3));
        const opacity = (theme === 'dark' ? 0.045 : 0.07) * fade;
        ctx.strokeStyle = `rgba(${ring.color.r}, ${ring.color.g}, ${ring.color.b}, ${opacity})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
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
        const base = theme === 'dark' ? 0.08 : 0.14;
        const opacity = base + Math.sin(time + block.phase) * (theme === 'dark' ? 0.04 : 0.06);
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
        const base = theme === 'dark' ? 0.06 : 0.12;
        const opacity = base + Math.sin(time * 0.8 + hex.phase) * (theme === 'dark' ? 0.04 : 0.06);
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
        link.rotation += 0.005;
        if (link.x < -60) link.x = width + 60;
        if (link.x > width + 60) link.x = -60;
        if (link.y < -40) link.y = height + 40;
        if (link.y > height + 40) link.y = -40;
      });
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      chainLinks.forEach((link) => {
        const base = theme === 'dark' ? 0.07 : 0.13;
        const opacity = base + Math.sin(time + link.phase) * (theme === 'dark' ? 0.03 : 0.05);
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
        const base = theme === 'dark' ? 0.06 : 0.11;
        const opacity = base + pulse * (theme === 'dark' ? 0.05 : 0.07);
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

        // Spawn particles occasionally (lower rate for calmer feel)
        if (Math.random() < 0.06) {
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
        p.life -= 0.008;
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
            const lineOpacity = theme === 'dark' ? 0.08 : 0.14;
            const opacity = (1 - distance / maxDistance) * lineOpacity;
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
          
          const trailOpacity = theme === 'dark' ? 0.22 : 0.38;
          gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${current.opacity * trailOpacity})`);
          gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${next.opacity * trailOpacity})`);

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
        // Theme-tuned: light mode much stronger so orbs clearly visible on white
        const baseOpacity = theme === 'dark' ? 0.05 : 0.10;
        const timeOpacity = Math.sin(time * blob.pulseSpeed + index * 0.5) * (theme === 'dark' ? 0.03 : 0.045);
        const distanceFromCenter = Math.sqrt(
          Math.pow(blob.x - width / 2, 2) + Math.pow(blob.y - height / 2, 2)
        );
        const maxDistance = Math.sqrt(width * width + height * height) / 2;
        const centerFade = 1 - (distanceFromCenter / maxDistance) * 0.2;
        
        const opacity = baseOpacity + timeOpacity;
        const maxCap = theme === 'dark' ? 0.09 : 0.18;
        const finalOpacity = Math.max(0.025, Math.min(maxCap, opacity * centerFade));

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
        const glow1Mult = theme === 'dark' ? 0.15 : 0.22;
        glowGradient1.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${finalOpacity * glow1Mult})`);
        glowGradient1.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = glowGradient1;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, safeRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Second glow layer for extra depth
        const glowGradient2 = ctx.createRadialGradient(
          blob.x,
          blob.y,
          safeRadius * 1.1,
          blob.x,
          blob.y,
          safeRadius * 1.8
        );
        const glow2Mult = theme === 'dark' ? 0.08 : 0.12;
        glowGradient2.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${finalOpacity * glow2Mult})`);
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
      {/* Theme-aware overlay: dark = depth; light = subtle so canvas stays visible */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-neutral-950/30 via-neutral-950/20 to-neutral-950/30'
            : 'bg-gradient-to-br from-white/5 via-transparent to-white/5'
        }`}
      />
    </div>
  );
}
