import { useState, useEffect, useRef } from 'react';
import type { AnimationConfig, AnimationType } from '../types';

interface AnimationState {
  isExiting: boolean;      // 當前歌詞是否正在退出
  isEntering: boolean;     // 新歌詞是否正在進入
  exitOpacity: number;     // 退出歌詞的透明度
  enterOpacity: number;    // 進入歌詞的透明度
  exitTransform: string;   // 退出歌詞的變換
  enterTransform: string;  // 進入歌詞的變換
}

const INITIAL_STATE: AnimationState = {
  isExiting: false,
  isEntering: false,
  exitOpacity: 1,
  enterOpacity: 0,
  exitTransform: '',
  enterTransform: '',
};

export function useLyricAnimation(
  currentIndex: number | null,
  animationConfig: AnimationConfig,
  onAnimationComplete?: (newIndex: number) => void
) {
  const [state, setState] = useState<AnimationState>(INITIAL_STATE);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousIndexRef = useRef<number | null>(null);

  // 當索引變化時觸發動畫
  useEffect(() => {
    if (!animationConfig.enabled || currentIndex === null) {
      setDisplayIndex(currentIndex);
      setState(INITIAL_STATE);
      return;
    }

    // 如果索引沒有變化，不執行動畫
    if (currentIndex === previousIndexRef.current) {
      return;
    }

    // 清除之前的動畫計時器
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    const isFirstLoad = previousIndexRef.current === null;

    if (isFirstLoad) {
      // 首次載入，直接顯示
      setDisplayIndex(currentIndex);
      previousIndexRef.current = currentIndex;
      return;
    }

    // 開始動畫序列
    startAnimation(currentIndex);
  }, [currentIndex, animationConfig]);

  const startAnimation = (newIndex: number) => {
    const { type, duration, easing } = animationConfig;
    const halfDuration = duration / 2;

    switch (type) {
      case 'fade-out-in':
        // 淡出 -> 淡入
        setState({
          isExiting: true,
          isEntering: false,
          exitOpacity: 0,
          enterOpacity: 0,
          exitTransform: '',
          enterTransform: '',
        });

        animationTimerRef.current = setTimeout(() => {
          setDisplayIndex(newIndex);
          setState({
            isExiting: false,
            isEntering: true,
            exitOpacity: 0,
            enterOpacity: 1,
            exitTransform: '',
            enterTransform: '',
          });

          animationTimerRef.current = setTimeout(() => {
            setState(INITIAL_STATE);
            previousIndexRef.current = newIndex;
            onAnimationComplete?.(newIndex);
          }, halfDuration);
        }, halfDuration);
        break;

      case 'crossfade':
        // 同時淡出淡入
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 0,
          enterOpacity: 1,
          exitTransform: '',
          enterTransform: '',
        });

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      case 'slide':
        // 滑入滑出
        const direction = newIndex > (previousIndexRef.current || 0) ? -1 : 1;
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 1,
          enterOpacity: 1,
          exitTransform: `translateX(${direction * 100}%)`,
          enterTransform: `translateX(${-direction * 100}%)`,
        });

        animationTimerRef.current = setTimeout(() => {
          setState({
            isExiting: false,
            isEntering: false,
            exitOpacity: 1,
            enterOpacity: 1,
            exitTransform: `translateX(${direction * 100}%)`,
            enterTransform: 'translateX(0)',
          });
        }, 50);

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      case 'scale':
        // 縮放效果
        setDisplayIndex(newIndex);
        setState({
          isExiting: true,
          isEntering: true,
          exitOpacity: 1,
          enterOpacity: 1,
          exitTransform: 'scale(0.8)',
          enterTransform: 'scale(1.2)',
        });

        animationTimerRef.current = setTimeout(() => {
          setState({
            isExiting: false,
            isEntering: false,
            exitOpacity: 1,
            enterOpacity: 1,
            exitTransform: 'scale(0.8)',
            enterTransform: 'scale(1)',
          });
        }, 50);

        animationTimerRef.current = setTimeout(() => {
          setState(INITIAL_STATE);
          previousIndexRef.current = newIndex;
          onAnimationComplete?.(newIndex);
        }, duration);
        break;

      default:
        setDisplayIndex(newIndex);
        setState(INITIAL_STATE);
        previousIndexRef.current = newIndex;
    }
  };

  // 清理計時器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  return {
    displayIndex,
    previousIndex: previousIndexRef.current,
    ...state,
  };
}
