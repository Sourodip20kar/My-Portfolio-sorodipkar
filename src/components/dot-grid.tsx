import { memo } from "react";
import { DotGrid as PaperDotGrid } from "@paper-design/shaders-react";

type DotGridProps = {
  className?: string;
  colorBack?: string;
  colorFill?: string;
  colorStroke?: string;
  size?: number;
  gapX?: number;
  gapY?: number;
  strokeWidth?: number;
  sizeRange?: number;
  opacityRange?: number;
  shape?: "circle" | "triangle" | "diamond" | "square";
  fit?: "cover" | "contain" | "none";
  scale?: number;
  rotation?: number;
  originX?: number;
  originY?: number;
  offsetX?: number;
  offsetY?: number;
  worldWidth?: number;
  worldHeight?: number;
  maxPixelCount?: number;
};

const defaultPreset = {
  colorBack: "#000000", // Full black background
  colorFill: "#71717a", // Zinc-500 color for dots
  colorStroke: "#71717a", // Zinc-500 for stroke as well
  size: 1, // Very small dots
  gapX: 30,
  gapY: 30,
  strokeWidth: 0,
  sizeRange: 0.1,
  opacityRange: 0.6,
  shape: "circle" as const
};

// Mobile-optimized preset for better performance
const mobilePreset = {
  ...defaultPreset,
  gapX: 35, // Slightly larger gaps for better mobile performance
  gapY: 35,
  size: 0.8, // Smaller dots on mobile
  opacityRange: 0.5, // Slightly reduced opacity for better performance
};

const DotGrid = memo(function DotGrid({
  className,
  colorBack = defaultPreset.colorBack,
  colorFill = defaultPreset.colorFill,
  colorStroke = defaultPreset.colorStroke,
  size = defaultPreset.size,
  gapX = defaultPreset.gapX,
  gapY = defaultPreset.gapY,
  strokeWidth = defaultPreset.strokeWidth,
  sizeRange = defaultPreset.sizeRange,
  opacityRange = defaultPreset.opacityRange,
  shape = defaultPreset.shape,
  maxPixelCount = 6016 * 3384,
  ...props
}: DotGridProps) {
  // Detect if we're on mobile for performance optimization
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const preset = isMobile ? mobilePreset : defaultPreset;
  
  return (
    <PaperDotGrid
      className={className}
      colorBack={colorBack}
      colorFill={colorFill}
      colorStroke={colorStroke}
      size={size || preset.size}
      gapX={gapX || preset.gapX}
      gapY={gapY || preset.gapY}
      strokeWidth={strokeWidth}
      sizeRange={sizeRange || preset.sizeRange}
      opacityRange={opacityRange || preset.opacityRange}
      shape={shape}
      maxPixelCount={isMobile ? maxPixelCount * 0.5 : maxPixelCount} // Reduce pixel count on mobile
      {...props}
    />
  );
});

export default DotGrid;
