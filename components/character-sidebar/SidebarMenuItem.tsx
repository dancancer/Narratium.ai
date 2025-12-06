/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        Sidebar Menu Item Component                        ║
 * ║                                                                           ║
 * ║  通用侧边栏菜单项 - 提供一致的交互和视觉反馈                                   ║
 * ║  支持: 图标 | 文字 | hover 动效 | collapsed 状态                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
 * 类型定义
 * ───────────────────────────────────────────────────────────────────────────── */

type AccentColor = "amber" | "purple" | "blue";

interface SidebarMenuItemProps {
  /** 图标元素 */
  icon: ReactNode;
  /** 显示文字 */
  label: string;
  /** 字体类名 */
  fontClass?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 链接地址 (与 onClick 互斥) */
  href?: string;
  /** 是否折叠状态 */
  isCollapsed?: boolean;
  /** 是否移动端 */
  isMobile?: boolean;
  /** 强调色 - 决定 hover 时的颜色主题 */
  accentColor?: AccentColor;
  /** 是否激活 */
  isActive?: boolean;
  /** 子元素 (如展开箭头) */
  suffix?: ReactNode;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 颜色映射 - 简洁的数据驱动而非条件分支
 * ───────────────────────────────────────────────────────────────────────────── */

const colorMap: Record<AccentColor, { gradient: string; text: string; shadow: string }> = {
  amber: {
    gradient: "from-amber-500/10",
    text: "group-hover:text-amber-400",
    shadow: "group-hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]",
  },
  purple: {
    gradient: "from-purple-500/10",
    text: "group-hover:text-purple-400",
    shadow: "group-hover:shadow-[0_0_8px_rgba(167,139,250,0.4)]",
  },
  blue: {
    gradient: "from-blue-500/10",
    text: "group-hover:text-blue-400",
    shadow: "group-hover:shadow-[0_0_8px_rgba(96,165,250,0.4)]",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 底部渐变线颜色
 * ───────────────────────────────────────────────────────────────────────────── */

const lineColorMap: Record<AccentColor, string> = {
  amber: "via-amber-400",
  purple: "via-purple-400",
  blue: "via-blue-400",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 组件实现
 * ───────────────────────────────────────────────────────────────────────────── */

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  icon,
  label,
  fontClass = "",
  onClick,
  href,
  isCollapsed = false,
  isMobile = false,
  accentColor = "amber",
  isActive = false,
  suffix,
}) => {
  const colors = colorMap[accentColor];
  const lineColor = lineColorMap[accentColor];
  const iconSize = isMobile ? "w-6 h-6" : "w-8 h-8";

  /* ─── 折叠态：仅显示图标 ─── */
  if (isCollapsed) {
    const Wrapper = href ? "a" : "button";
    const wrapperProps = href ? { href } : { onClick };

    return (
      <Wrapper
        {...wrapperProps}
        className="menu-item flex justify-center p-2 rounded-md cursor-pointer hover:bg-muted-surface transition-all duration-300"
      >
        <div
          className={`${iconSize} flex items-center justify-center text-cream bg-surface rounded-lg border border-stroke shadow-inner transition-all duration-300 hover:text-amber-400 hover:border-stroke-strong hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]`}
        >
          {icon}
        </div>
      </Wrapper>
    );
  }

  /* ─── 展开态：图标 + 文字 + 动效 ─── */
  const content = (
    <>
      {/* 背景渐变层 */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} via-transparent to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`}
      />
      {/* 背景色层 */}
      <div className="absolute inset-0 w-full h-full bg-stroke opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0" />
      {/* 底部渐变线 */}
      <div
        className={`absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent ${lineColor} to-transparent w-0 group-hover:w-full transition-all duration-500 z-5`}
      />
      {/* 内容区 */}
      <div className="relative z-5 flex items-center justify-between w-full">
        <div className="flex items-center">
          <div
            className={`${iconSize} flex items-center justify-center flex-shrink-0 text-cream bg-surface rounded-lg border border-stroke shadow-inner transition-all duration-300 group-hover:border-stroke-strong ${colors.text} ${colors.shadow}`}
          >
            {icon}
          </div>
          <div className="ml-2 transition-all duration-300 ease-in-out overflow-hidden">
            <span
              className={`magical-text whitespace-nowrap block text-xs md:text-sm ${colors.text} transition-colors duration-300 ${fontClass}`}
            >
              {label}
            </span>
          </div>
        </div>
        {suffix}
      </div>
    </>
  );

  const baseClassName = `menu-item relative group flex items-center w-full p-2 rounded-md hover:bg-muted-surface overflow-hidden transition-all duration-300 cursor-pointer ${isActive ? "bg-muted-surface" : ""}`;

  /* ─── 链接 or 按钮 ─── */
  if (href) {
    return (
      <a href={href} className={baseClassName}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
};

export default SidebarMenuItem;
