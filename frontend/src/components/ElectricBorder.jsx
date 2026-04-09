import { useEffect, useRef, useState } from 'react';

const ElectricBorder = ({
  color = '#5227FF',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  className = '',
  children,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const drawElectricBorder = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const radius = borderRadius;

      // Create points around the border
      const perimeter = 2 * (width + height) - 4 * radius;
      const points = [];
      const pointCount = Math.max(100, Math.floor(perimeter / 2));

      for (let i = 0; i < pointCount; i++) {
        const t = i / pointCount;
        const offset = Math.sin(time * 0.01 * speed + i * chaos) * chaos * 10;
        points.push({
          t,
          offset,
        });
      }

      // Draw the border
      ctx.beginPath();
      points.forEach((point, i) => {
        const t = point.t;
        let x, y;

        // Top
        if (t < 0.25) {
          const segment = t * 4;
          x = segment * width + point.offset;
          y = 0 + point.offset;
        }
        // Right
        else if (t < 0.5) {
          const segment = (t - 0.25) * 4;
          x = width + point.offset;
          y = segment * height + point.offset;
        }
        // Bottom
        else if (t < 0.75) {
          const segment = (t - 0.5) * 4;
          x = width - segment * width + point.offset;
          y = height + point.offset;
        }
        // Left
        else {
          const segment = (t - 0.75) * 4;
          x = 0 + point.offset;
          y = height - segment * height + point.offset;
        }

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      time += 1;
      animationFrameId = requestAnimationFrame(drawElectricBorder);
    };

    drawElectricBorder();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, color, speed, chaos, borderRadius]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: `${borderRadius}px`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ElectricBorder;
