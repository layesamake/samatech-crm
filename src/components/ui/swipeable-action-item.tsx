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
  const contentRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isSwipingRef = useRef(false);
  const offsetRef = useRef(0);
  const SWIPE_THRESHOLD = 80;

  const updateTransform = (x: number, animate: boolean = false) => {
    if (contentRef.current) {
      contentRef.current.style.transition = animate ? 'transform 0.2s ease-out' : 'none';
      contentRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
      if (x !== 0) {
        contentRef.current.classList.add('shadow-xl');
      } else {
        contentRef.current.classList.remove('shadow-xl');
      }
    }
  };

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    isSwipingRef.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!isSwipingRef.current) return;
    currentX.current = clientX;
    const diff = currentX.current - startX.current;
    
    if (diff > 0 && !onSwipeRight) return;
    if (diff < 0 && !onSwipeLeft) return;
    
    const boundedDiff = Math.max(Math.min(diff, 100), -100);
    offsetRef.current = boundedDiff;
    
    // Direct DOM manipulation
    updateTransform(boundedDiff, false);
  };

  const handleEnd = () => {
    isSwipingRef.current = false;
    const offset = offsetRef.current;
    
    if (offset > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    
    offsetRef.current = 0;
    updateTransform(0, true);
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
        ref={contentRef}
        className="relative z-10 bg-card text-card-foreground w-full h-full rounded-xl will-change-transform cursor-grab active:cursor-grabbing"
        style={{ transform: `translate3d(0px, 0, 0)` }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => isSwipingRef.current && handleEnd()}
      >
        {children}
      </div>
    </div>
  );
}
