/**
 * Markdown Converter - 将Markdown转换为HTML的工具
 * 
 * 设计原则：
 * 1. 渐进增强：优先处理复杂结构，再处理简单标记
 * 2. 占位符机制：避免嵌套结构冲突
 * 3. 正则表达式优化：避免重复编译，提高性能
 * 4. 纯函数设计：无副作用，易于测试
 */

/**
 * 将Markdown字符串转换为HTML
 * 
 * 处理流程：
 * 1. 图片占位符（避免与其他处理冲突）
 * 2. 代码块（保护内部内容不被其他规则处理）
 * 3. 引用块
 * 4. 行内代码
 * 5. 强调文本（粗体、斜体）
 * 6. 对话标记
 * 7. 括号内容
 * 8. 恢复图片
 */
export function convertMarkdown(str: string): string {
  const imagePlaceholders: string[] = [];

  // 第一步：提取图片，使用占位符避免冲突
  str = str.replace(/!\[\]\(([^)]+)\)/g, (_match, url) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imagePlaceholders.length}__`;
    imagePlaceholders.push(`<img src="${url}" alt="Image" />`);
    return placeholder;
  });

  // 移除分隔线
  str = str.replace(/^---$/gm, "");

  // 处理代码块
  str = str.replace(/```[\s\S]*?```/g, (match) => {
    const content = match.replace(/^```\w*\n?/, "").replace(/```$/, "");
    return `<pre>${content}</pre>`;
  });

  // 处理引用块
  str = str.replace(/^>\s*(.+)$/gm, "<blockquote>$1</blockquote>");
  str = str.replace(/<\/blockquote>\s*<blockquote>/g, "\n");

  // 恢复图片（处理未被占位符捕获的）
  str = str.replace(/!\[\]\(([^)]+)\)/g, "<img src=\"$1\" alt=\"Image\" />");

  // 处理强调文本
  str = str.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  str = str.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 处理对话标记（引号）
  str = str.replace(/(<[^>]+>)|(["“”][^"“”]+["“”])/g, (_match, tag, quote) => {
    if (tag) return tag;
    return `<talk>${quote}</talk>`;
  });

  // 处理方括号和花括号内容
  str = str.replace(/\[([^\]]+)\]|【([^】]+)】/g, (_match, latinContent, cjkContent) => {
    const content = latinContent || cjkContent;
    return `<bracket-content>${content}</bracket-content>`;
  });

  // 最后：恢复图片占位符
  imagePlaceholders.forEach((html, i) => {
    str = str.replace(`__IMAGE_PLACEHOLDER_${i}__`, html);
  });

  return str;
}
