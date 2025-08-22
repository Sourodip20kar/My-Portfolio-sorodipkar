// src/components/Celebration.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  isExploding: boolean;
  onComplete: () => void;
}

const Celebration: React.FC<CelebrationProps> = ({ isExploding, onComplete }) => {
  useEffect(() => {
    if (isExploding) {
      const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.1,
        decay: 0.94,
        startVelocity: 20,
        shapes: ["star" as const],
        colors: ["#C0C0C0", "#E5E7EB", "#9CA3AF", "#D1D5DB", "#F3F4F6"],
      };

      const shoot = () => {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ["star" as const],
        });

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ["circle" as const],
        });
      };

      setTimeout(shoot, 0);
      setTimeout(shoot, 100);
      setTimeout(shoot, 200);

      // Call onComplete after the animation duration
      setTimeout(onComplete, 3000);
    }
  }, [isExploding, onComplete]);

  return null; // This component doesn't render anything itself
};

export default Celebration;
