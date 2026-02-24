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
        <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
          <h2 className="text-xl font-bold italic mb-6">SKYDESK<span className="text-blue-500">360</span></h2>
          <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
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
