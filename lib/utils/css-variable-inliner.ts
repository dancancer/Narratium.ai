/**
 * CSS Variable Inliner - CSS变量内联工具
 * 
 * 设计原则：
 * 1. 隔离上下文兼容：在iframe等隔离环境中内联CSS变量
 * 2. 性能优先：缓存变量值，避免重复计算
 * 3. 安全降级：当变量未定义时使用合理的默认值
 * 4. 保持简洁：只做一件事，并做到极致
 */

// 从 app/globals.css 提取的CSS变量定义
// 深色主题默认值
const CSS_VARIABLES = {
  // 背景色
  "--color-canvas": "#171717",
  "--color-surface": "#1c1c1c",
  "--color-layer": "#232323",
  "--color-deep": "#1a1816",
  "--color-ember": "#1f1c1a",
  "--color-coal": "#13100e",
  "--color-muted-surface": "#252220",
  "--color-overlay": "#2a261f",
  "--color-card": "#292929",
  "--color-input": "#2a2a2a",
  
  // 边框和线条
  "--color-stroke": "#333333",
  "--color-stroke-strong": "#444444",
  
  // 文本颜色
  "--color-text": "#d0d0d0",
  "--color-text-muted": "#8a8a8a",
  "--color-ink": "#534741",
  "--color-ink-soft": "#a18d6f",
  
  // 主题色
  "--color-amber-soft": "#c0a480",
  "--color-cream": "#f4e8c1",
  "--color-cream-soft": "#eae6db",
  "--color-amber": "#d1a35c",
  "--color-amber-bright": "#f9c86d",
  "--color-highlight": "#ffd475",
  "--color-sand": "#e0cfa0",
  
  // 状态色
  "--color-success": "#aef6da",
  "--color-info": "#c093ff",
  "--color-sky-strong": "#3b82f6",
  "--color-sky": "#93c5fd",
  "--color-danger": "#ef4444",
} as const;

type CssVariableName = keyof typeof CSS_VARIABLES;

/**
 * 内联CSS变量 - 将 var(--variable) 替换为实际值
 * 
 * @param cssText - 包含CSS变量的样式字符串
 * @returns 内联后的样式字符串
 * 
 * @example
 * inlineCssVariables("color: var(--color-danger);")
 * // 返回 "color: #ef4444;"
 */
export function inlineCssVariables(cssText: string): string {
  if (!cssText || !cssText.includes("var(--")) {
    return cssText;
  }

  let result = cssText;
  
  // 替换所有CSS变量引用
  Object.entries(CSS_VARIABLES).forEach(([variable, value]) => {
    // 匹配 var(--variable) 和 var(--variable, fallback) 两种形式
    const regex = new RegExp(`var\\(${variable}(?:,\\s*[^)]+)?\\)`, "g");
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * 获取CSS变量的值
 * 
 * @param variableName - CSS变量名称，如 "--color-danger"
 * @returns 变量的值，如果未定义则返回undefined
 */
export function getCssVariableValue(variableName: CssVariableName): string | undefined {
  return CSS_VARIABLES[variableName];
}

/**
 * 检查字符串是否包含CSS变量引用
 * 
 * @param text - 要检查的文本
 * @returns 如果包含CSS变量则返回true
 */
export function containsCssVariables(text: string): boolean {
  return text.includes("var(--");
}
