import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import loadingAnimation from "@/assets/loading.json";

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ size = 'md', className }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-12 w-12',    // 48x48px
    md: 'h-16 w-16',    // 64x64px
    lg: 'h-24 w-24'     // 96x96px
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="w-full h-full [filter:brightness(0)_saturate(100%)_invert(46%)_sepia(45%)_saturate(1234%)_hue-rotate(213deg)_brightness(95%)_contrast(90%)]">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
} 