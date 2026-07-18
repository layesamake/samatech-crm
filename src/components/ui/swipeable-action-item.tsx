'use client';
import { ReactNode, useState, useRef, TouchEvent, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SwipeableActionItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftIcon?: LucideIcon;
  leftLabel?: string;
  leftBgColor?: string;
  rightIcon?: LucideIcon;
  rightLabel?: string;
  rightBgColor?: string;
}

export function SwipeableActionItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftIcon: LeftIcon,
  leftLabel,
  leftBgColor = 'bg-blue-600',
  rightIcon: RightIcon,
  rightLabel,
  rightBgColor = 'bg-red-600',
}: SwipeableActionItemProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const SWIPE_THRESHOLD = 80;

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    setIsSwiping(true);
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping) return;
    currentX.current = clientX;
    const diff = currentX.current - startX.current;
    
    if (diff > 0 && !onSwipeRight) return;
    if (diff < 0 && !onSwipeLeft) return;
    
    const boundedDiff = Math.max(Math.min(diff, 100), -100);
    setOffset(boundedDiff);
  };

  const handleEnd = () => {
    setIsSwiping(false);
    if (offset > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/30 w-full touch-pan-y group">
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-between pointer-events-none">
        {onSwipeRight && (
          <div className={cn("flex items-center w-1/2 px-4 text-white font-medium justify-start", leftBgColor)}>
             {LeftIcon && <LeftIcon className="w-5 h-5 mr-2" />}
             {leftLabel && <span className="text-sm">{leftLabel}</span>}
          </div>
        )}
        {onSwipeLeft && (
          <div className={cn("flex items-center w-1/2 px-4 text-white font-medium justify-end ml-auto", rightBgColor)}>
             {rightLabel && <span className="text-sm">{rightLabel}</span>}
             {RightIcon && <RightIcon className="w-5 h-5 ml-2" />}
          </div>
        )}
      </div>

      {/* Foreground Content */}
      <div 
        className={cn(
          "relative z-10 bg-card text-card-foreground w-full h-full rounded-xl transition-transform will-change-transform cursor-grab active:cursor-grabbing", 
          isSwiping ? "duration-0" : "duration-200 ease-out",
          offset !== 0 && "shadow-xl"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => isSwiping && handleEnd()}
      >
        {children}
      </div>
    </div>
  );
}
