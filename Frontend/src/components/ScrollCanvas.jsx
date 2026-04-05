import React, { useCallback, useEffect, useRef, useState } from 'react';

const ScrollCanvas = ({ frameCount = 240, isLoaded, setIsLoaded }) => {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [progress, setProgress] = useState(0);
  const currentFrameRef = useRef(0);

  const getImageUrl = (index) => `/frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

  const renderCanvas = useCallback((index) => {
    const canvas = canvasRef.current;
    const frame = imagesRef.current[index];
    if (!canvas || !frame) return;
    
    const ctx = canvas.getContext('2d');
    const img = frame;
    currentFrameRef.current = index;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight, x, y;

    if (canvasRatio > imgRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
      x = 0;
      y = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      drawHeight = height;
      x = (width - drawWidth) / 2;
      y = 0;
    }

    ctx.clearRect(0, 0, width, height);
    
    // Quality Tweak: Disable image smoothing for sharper edges if images are high-res
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }, []);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;

    // Reset transform before applying ratio to avoid cumulative scaling.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderCanvas(currentFrameRef.current);
  }, [renderCanvas]);

  useEffect(() => {
    const loadImages = () => {
      const loadedImages = [];
      let count = 0;
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = getImageUrl(i);
        img.onload = () => {
          count++;
          setProgress(Math.floor((count / frameCount) * 100));
          if (count === frameCount) {
            imagesRef.current = loadedImages;
            setIsLoaded(true);
            setTimeout(updateCanvasSize, 100);
          }
        };
        loadedImages.push(img);
      }
    };

    loadImages();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [frameCount, setIsLoaded, updateCanvasSize]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isLoaded) return;
      const html = document.documentElement;
      const scrollFraction = window.scrollY / (html.scrollHeight - window.innerHeight);
      const index = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
      requestAnimationFrame(() => renderCanvas(index));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [frameCount, isLoaded, renderCanvas]);

  return (
    <>
      {!isLoaded && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: '#020204',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Ambient orbs */}
          <div style={{ position: 'absolute', top: '30%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0,242,254,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>
              <span style={{ color: '#fff' }}>SKY</span>
              <span style={{
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>DESK360</span>
            </div>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#1e293b' }}>
              Loading Experience
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '180px', position: 'relative' }}>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px',
                background: 'linear-gradient(90deg, #00f2fe, #a855f7)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
                boxShadow: '0 0 12px rgba(0,242,254,0.5)',
              }} />
            </div>
            <div style={{
              position: 'absolute', right: 0, top: '8px',
              fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: '#1e293b',
            }}>
              {progress}%
            </div>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 z-0 pointer-events-none"
        style={{ 
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            imageRendering: 'auto',
            filter: 'brightness(0.75) contrast(1.05)'
        }}
      />
    </>
  );
};

export default ScrollCanvas;
