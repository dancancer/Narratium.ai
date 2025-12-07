/**
 * LoadingTransition Component
 * 
 * The animation in this component is inspired by the open-source project by JIEJOE'S WEB Tutorial:
 * https://github.com/JIEJOE-WEB-Tutorial/014-snake-loading
 * 
 * Original Author: JIEJOE'S WEB Tutorial  
 * License: MIT License
 * 
 * This implementation adapts and extends the original animation by adding sound effects,
 * auto-redirect functionality, GSAP timeline controls, and other enhancements.
 * It serves as a visual transition during page loading in the application.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
import { useSoundContext } from "@/contexts/SoundContext";

interface LoadingTransitionProps {
  onAnimationComplete?: () => void;
  redirectUrl?: string;
  autoRedirect?: boolean;
  duration?: number;
}

export default function LoadingTransition({
  onAnimationComplete,
  redirectUrl,
  autoRedirect = true,
}: LoadingTransitionProps) {
  const { soundEnabled } = useSoundContext();

  const [logoShown, setLogoShown] = useState(false);
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathsRef = useRef<SVGPathElement[]>([]);
  const circleRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const movementSoundRef = useRef<HTMLAudioElement>(null);
  const completionSoundRef = useRef<HTMLAudioElement>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressBarFillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  
  // ═══════════════════════════════════════════════════════════════
  // GSAP Timeline 管理：统一清理所有动画，防止内存泄漏
  // ═══════════════════════════════════════════════════════════════
  const timelinesRef = useRef<gsap.core.Timeline[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (movementSoundRef.current && completionSoundRef.current) {
        Promise.all([
          new Promise(resolve => {
            if (movementSoundRef.current) {
              movementSoundRef.current.addEventListener("canplaythrough", resolve, { once: true });
            }
          }),
          new Promise(resolve => {
            if (completionSoundRef.current) {
              completionSoundRef.current.addEventListener("canplaythrough", resolve, { once: true });
            }
          }),
        ]).then(() => {
          setSoundsLoaded(true);
        });
      } else {
        setSoundsLoaded(true);
      }
    } else {
      setSoundsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!logoShown || !autoRedirect || !redirectUrl) return;

    logoTimerRef.current = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      router.push(redirectUrl);
    }, 2000);
    
    return () => {
      if (logoTimerRef.current) {
        clearTimeout(logoTimerRef.current);
      }
    };
  }, [logoShown, autoRedirect, redirectUrl, onAnimationComplete, router]);

  // ═══════════════════════════════════════════════════════════════
  // 完成动画：消除特殊情况，统一管理所有 tween
  // ═══════════════════════════════════════════════════════════════
  const finishAnimation = useCallback(() => {
    // 淡出移动音效
    if (soundEnabled && movementSoundRef.current) {
      const volumeTween = gsap.to(movementSoundRef.current, {
        volume: 0,
        duration: 0.5,
        onComplete: () => {
          movementSoundRef.current?.pause();
          if (movementSoundRef.current) movementSoundRef.current.volume = 1;
        },
      });
      tweensRef.current.push(volumeTween);
    }
    
    // 主动画时间线
    const timeline = gsap.timeline();
    timelinesRef.current.push(timeline);
    
    timeline
      .to(pathsRef.current[1], {
        strokeWidth: 0,
        duration: 0.3,
        ease: "power3.out",
      })
      .to(pathsRef.current[0], {
        strokeDasharray: "150 0 0 0 0 0 0 0 0 500",
        strokeDashoffset: -300,
        duration: 0.7,
        ease: "power3.out",
      }, "<")
      .to(circleRef.current, {
        opacity: 0.9,
        duration: 0.6,
        ease: "power3.out",
        onStart: () => {
          if (soundEnabled && completionSoundRef.current) {
            completionSoundRef.current.muted = true;
            completionSoundRef.current.currentTime = 0;
            const playPromise = completionSoundRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                if (completionSoundRef.current) {
                  completionSoundRef.current.muted = false;
                  completionSoundRef.current.volume = 0.2;
                }
              }).catch(e => {
                console.log("Completion sound failed:", e);
              });
            }
          }
        },
        onComplete: () => {
          // 圆圈呼吸动画
          const circleTween = gsap.to(circleRef.current, {
            scale: 1.03,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          tweensRef.current.push(circleTween);
          
          // Logo 淡入 + 呼吸动画
          if (logoRef.current) {
            const logoFadeIn = gsap.to(logoRef.current, {
              opacity: 1,
              duration: 0.8,
              delay: 0,
              ease: "power2.out",
              onComplete: () => {
                const logoBreath = gsap.to(logoRef.current, {
                  scale: 1.05,
                  duration: 1.5,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut",
                });
                tweensRef.current.push(logoBreath);

                setLogoShown(true);
              },
            });
            tweensRef.current.push(logoFadeIn);
          }
          
          if (!autoRedirect && onAnimationComplete) {
            onAnimationComplete();
          }
        },
      }, "<0.3");
  }, [autoRedirect, onAnimationComplete, soundEnabled]);

  // ═══════════════════════════════════════════════════════════════
  // 启动动画：移除 finishAnimation 依赖，打破循环
  // ═══════════════════════════════════════════════════════════════
  const startAnimation = useCallback(() => {
    if (!soundsLoaded) return;
    
    // 播放移动音效
    if (soundEnabled && soundsLoaded && movementSoundRef.current) {
      movementSoundRef.current.muted = true;
      movementSoundRef.current.currentTime = 0;
      const playPromise = movementSoundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (movementSoundRef.current) {
            movementSoundRef.current.muted = false;
            movementSoundRef.current.volume = 0.8;
          }
        }).catch(e => {
          console.log("Movement sound failed:", e);
        });
      }
    }
    
    // 路径描边动画
    const strokeTween = gsap.to(pathsRef.current, {
      stroke: "var(--color-amber-bright)",
      strokeWidth: (i: number) => i === 0 ? 2 : 4,
      duration: 0.3,
      ease: "power1.in",
    });
    tweensRef.current.push(strokeTween);

    // 主时间线
    const timeline = gsap.timeline({
      onComplete: () => {
        finishAnimation();
      },
    });
    timelinesRef.current.push(timeline);
    
    timeline.fromTo(
      pathsRef.current,
      {
        strokeDashoffset: (i: number) => i === 0 ? 0 : 480,
      },
      {
        strokeDashoffset: (i: number) => i === 0 ? -275 : 205,
        duration: 0.8,
        ease: "power2.inOut",
      },
    );

    // 进度条填充
    const progressFillTween = gsap.to(progressBarFillRef.current, {
      width: "100%",
      duration: timeline.duration(),
      ease: "power2.inOut",
    });
    tweensRef.current.push(progressFillTween);

    // 进度条样式
    const progressStyleTween = gsap.to(progressBarFillRef.current, {
      background: "linear-gradient(90deg, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.8) 50%, rgba(255,215,0,0.4) 100%)",
      boxShadow: "0 0 8px rgba(255,215,0,0.6)",
      duration: timeline.duration(),
      ease: "power2.inOut",
    });
    tweensRef.current.push(progressStyleTween);

    // 文字淡入
    const textTween = gsap.to(textRef.current, {
      opacity: 1,
      duration: 0.5,
      delay: 0.3,
      ease: "power1.out",
    });
    tweensRef.current.push(textTween);
  }, [soundEnabled, soundsLoaded, finishAnimation]);

  // ═══════════════════════════════════════════════════════════════
  // 动画初始化：只执行一次，避免循环依赖
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!soundsLoaded) return;
    
    pathsRef.current = Array.from(document.querySelectorAll(".loading_icon path"));
    startAnimation();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundsLoaded]); // 只依赖 soundsLoaded，打破循环

  // ═══════════════════════════════════════════════════════════════
  // 组件卸载清理：kill 所有 GSAP 动画，防止内存泄漏
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      // 清理所有 timeline
      timelinesRef.current.forEach(tl => tl.kill());
      timelinesRef.current = [];
      
      // 清理所有 tween
      tweensRef.current.forEach(tw => tw.kill());
      tweensRef.current = [];
      
      // 停止所有音频
      if (movementSoundRef.current) {
        movementSoundRef.current.pause();
        movementSoundRef.current.currentTime = 0;
      }
      if (completionSoundRef.current) {
        completionSoundRef.current.pause();
        completionSoundRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden [background-color:var(--color-layer)]"
    >
      <div
        className="absolute inset-0 z-0 opacity-35 bg-[url('/loading_yellow.png')] bg-cover bg-center bg-no-repeat"
      />
      <div
        className="absolute inset-0 z-1 opacity-45 bg-[url('/loading_red.png')] bg-cover bg-center bg-no-repeat mix-blend-multiply"
      />
      <audio  
        ref={movementSoundRef} 
        src="/sounds/movement.mp3" 
        preload="auto"
        playsInline
      />
      <audio 
        ref={completionSoundRef} 
        src="/sounds/completion.mp3" 
        preload="auto"
        playsInline
      />
      <div className="loading relative flex items-center justify-center w-[min(35rem,90vw)] h-[min(35rem,90vw)] -translate-y-[5%]">
        <svg viewBox="0 0 100 50" className="loading_icon absolute w-[60%] max-w-[300px]">
          <path 
            d="M50,25c0-12.14,9.84-21.99,21.99-21.99S93.98,12.86,93.98,25s-9.84,21.99-21.99,21.99S50,37.21,50,25.06
            S40.16,3.01,28.01,3.01S6.02,12.86,6.02,25s9.84,21.99,21.99,21.99S50,37.14,50,25c0-8.14,4.42-15.24,10.99-19.05
            C67.57,9.76,71.99,16.86,71.99,25c0,8.14-4.42,15.24-10.99,19.04c0,0,0,0,0,0c-3.23,1.87-6.99,2.94-10.99,2.94
            c-4.01,0-7.76-1.07-10.99-2.94h0C32.43,40.24,28.01,33.14,28.01,25c0-8.14,4.42-15.24,10.99-19.05l0,0
            C42.24,4.08,45.99,3.01,50,3.01s7.76,1.07,10.99,2.94l0,0"
            style={{ 
              fill: "none",
              strokeLinecap: "round",
              strokeWidth: 0,
              strokeDasharray: "0 5 0 5 0 5 0 5 0 500",
            }}
          />
          <path 
            d="M50,25c0-12.14,9.84-21.99,21.99-21.99S93.98,12.86,93.98,25s-9.84,21.99-21.99,21.99S50,37.21,50,25.06
            S40.16,3.01,28.01,3.01S6.02,12.86,6.02,25s9.84,21.99,21.99,21.99S50,37.14,50,25c0-8.14,4.42-15.24,10.99-19.05
            C67.57,9.76,71.99,16.86,71.99,25c0,8.14-4.42,15.24-10.99,19.04c0,0,0,0,0,0c-3.23,1.87-6.99,2.94-10.99,2.94
            c-4.01,0-7.76-1.07-10.99-2.94h0C32.43,40.24,28.01,33.14,28.01,25c0-8.14,4.42-15.24,10.99-19.05l0,0
            C42.24,4.08,45.99,3.01,50,3.01s7.76,1.07,10.99,2.94l0,0"
            style={{ 
              fill: "none",
              strokeLinecap: "round",
              strokeWidth: 0,
              strokeDasharray: "0 500 0 500",
              strokeDashoffset: 480,
            }}
          />
        </svg>
        <div 
          ref={circleRef}
          className="loading_circle absolute w-[min(10rem,25vw)] h-[min(10rem,25vw)] rounded-full bg-[rgba(251,165,61,0.1)] border-2 border-[var(--color-amber-bright)] shadow-[0_0_15px_rgba(251,146,60,0.5)] opacity-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        ></div>
        <Image 
          ref={logoRef}
          src="/logo-narratium.png" 
          alt="Narratium Logo"
          fill
          sizes="(min-width:1024px) 240px, 200px"
          className="logo absolute w-[min(10rem,25vw)] opacity-0 z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain" 
        />
        <div
          ref={progressBarRef}
          className="absolute bottom-[25%] w-[70%] h-[min(8px,2vw)] bg-[rgba(251,165,61,0.2)] rounded overflow-hidden left-1/2 z-[11] -translate-x-1/2 -translate-y-1/2"
        >
          <div
            ref={progressBarFillRef}
            className="w-0 h-full bg-[linear-gradient(90deg,rgba(251,146,60,0.4)_0%,rgba(251,146,60,0.8)_50%,rgba(251,146,60,0.4)_100%)] shadow-[0_0_8px_rgba(251,146,60,0.6)] rounded"
          ></div>
        </div>
        <p
          ref={textRef}
          className="absolute bottom-[5%] text-[var(--color-amber-bright)] text-[clamp(0.8rem,3vw,1.2rem)] font-[var(--font-cinzel)] text-center opacity-0 z-[11] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap [text-shadow:0_0_5px_rgba(255,215,0,0.7)] px-4 max-w-[90vw] overflow-hidden text-ellipsis"
        >
          To build a time machine takes only two steps: dream it, then do it.
        </p>
      </div>
    </div>
  );
}
