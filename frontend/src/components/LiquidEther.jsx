import { useState, useEffect, useRef } from 'react';

const LiquidEther = ({ 
  color1 = '#1e40af', 
  color2 = '#0c1e3a',
  className = '' 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 15, 0.98)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple layers for depth and glow
      for (let layer = 0; layer < 3; layer++) {
        const layerOpacity = 0.15 - layer * 0.04;
        
        // Draw large fluid blobs with smooth animation
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          
          // Smooth wave-like movement
          const xOffset = Math.sin(time * 0.0005 + i * 1.5) * 200;
          const yOffset = Math.cos(time * 0.0003 + i * 1.2) * 150;
          
          const x = (canvas.width / 3) * (i % 2) + xOffset;
          const y = (canvas.height / 2) + yOffset;
          const radius = 250 + Math.sin(time * 0.0002 + i) * 80;

          ctx.arc(x, y, radius, 0, Math.PI * 2);
          
          // Create radial gradient for glow effect
          const radialGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          radialGrad.addColorStop(0, layer === 0 ? '#1e40af' : color1);
          radialGrad.addColorStop(0.5, color1);
          radialGrad.addColorStop(1, color2);
          
          ctx.fillStyle = radialGrad;
          ctx.globalAlpha = layerOpacity;
          ctx.fill();
          
          // Add glow blur effect
          ctx.shadowColor = layer === 0 ? 'rgba(30, 64, 175, 0.3)' : 'rgba(30, 100, 150, 0.15)';
          ctx.shadowBlur = 80 - layer * 20;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowColor = 'transparent';
      time += 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color1, color2]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default LiquidEther;
