import Spline from '@splinetool/react-spline';
import { useEffect, useRef } from 'react';
import DotGrid from './dot-grid';

export default function SplineScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // This function finds and removes the Spline logo element
    const removeLogo = () => {
      const splineLogo = containerRef.current?.querySelector('a[href*="spline.design"]');
      if (splineLogo) {
        // More forceful removal
        splineLogo.remove(); 
        return true; // Logo found and removed
      }
      return false; // Logo not found yet
    };

    // Use a MutationObserver to watch for when Spline adds the logo to the page
    const observer = new MutationObserver((mutationsList, observer) => {
        if (removeLogo()) {
            observer.disconnect(); // Stop watching once the logo is gone
        }
    });

    observer.observe(containerRef.current, { childList: true, subtree: true });

    // Cleanup the observer when the component is removed
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="spline-scene-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      
        <Spline scene="https://prod.spline.design/xLIOLM7mgoV8w04u/scene.splinecode" />
    
      
      {/* Strategic logo cover - using actual DotGrid component */}
      <div 
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '140px',
          height: '40px',
          pointerEvents: 'none',
          zIndex: 999999,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <DotGrid className="w-full h-full" />
      </div>
      
      {/* Alternative cover with DotGrid component */}
      <div 
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '17px',
          width: '120px',
          height: '40px',
          pointerEvents: 'none',
          zIndex: 999998,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <DotGrid className="w-full h-full" />
      </div>
    </div>
  );
}