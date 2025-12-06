/**
 * Tag Replacer - HTML标签替换和样式注入工具
 * 
 * 设计原则：
 * 1. 递归处理：支持嵌套标签的递归处理
 * 2. 样式合并：保留原有样式，智能合并新样式
 * 3. 安全跳过：自动跳过script、style等敏感标签
 * 4. 性能优化：使用正则表达式批量处理，减少DOM操作
 */

import { generatePalette, detectHtmlTags } from "./html-tag-processor";
import { useSymbolColorStore } from "@/contexts/SymbolColorStore";

/**
 * 替换HTML中的标签，添加样式和语义信息
 * 
 * 处理流程：
 * 1. 检测所有HTML标签
 * 2. 生成颜色调色板
 * 3. 递归处理嵌套标签
 * 4. 为每个标签添加样式、data属性和class
 * 5. 处理自闭合标签
 */
export function replaceTags(html: string): string {
  const tags = detectHtmlTags(html);
  if (tags.length === 0) return html;
  
  const colours = generatePalette(tags);
  const { getColorForHtmlTag } = useSymbolColorStore.getState();

  /**
   * 处理普通标签（有闭合标签）
   */
  function processHtml(htmlStr: string): string {
    htmlStr = htmlStr.replace(/>\s*\n\s*</g, "><");
    
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/g;
    
    return htmlStr.replace(tagRegex, (match, tagName: string, attributes: string, innerContent: string) => {
      const lowerTagName = tagName.toLowerCase();

      // 跳过敏感标签
      const skipTags = ["script", "style", "head", "meta", "link", "title"];
      if (skipTags.includes(lowerTagName)) {
        return match;
      }

      // 递归处理内部内容
      const processedInner = processHtml(innerContent);

      // 提取class属性
      let className = "";
      const classMatch = attributes.match(/class\s*=\s*["']([^"']*)["']/i);
      if (classMatch) {
        className = classMatch[1];
      }

      // 获取标签颜色
      let tagColor = getColorForHtmlTag(lowerTagName, className);
      
      if (!tagColor && colours[lowerTagName]) {
        tagColor = colours[lowerTagName];
      }

      // 如果有颜色，添加样式和属性
      if (tagColor) {
        const preservedAttrs = attributes.trim();
        const styleAttr = `style="color:${tagColor}"`;
        const dataAttr = `data-tag="${tagName}"`;
        const classAttr = "class=\"tag-styled\"";
        
        let finalAttrs = "";
        if (preservedAttrs) {
          const styleMatch = preservedAttrs.match(/style\s*=\s*["']([^"']*)["']/i);
          const classMatch = preservedAttrs.match(/class\s*=\s*["']([^"']*)["']/i);
          
          let modifiedAttrs = preservedAttrs;
          
          // 合并样式
          if (styleMatch) {
            const existingStyle = styleMatch[1];
            const newStyle = `${existingStyle}; color:${tagColor}`;
            modifiedAttrs = modifiedAttrs.replace(styleMatch[0], `style="${newStyle}"`);
          } else {
            modifiedAttrs += ` ${styleAttr}`;
          }
          
          // 合并class
          if (classMatch) {
            const existingClass = classMatch[1];
            const newClass = `${existingClass} tag-styled`;
            modifiedAttrs = modifiedAttrs.replace(classMatch[0], `class="${newClass}"`);
          } else {
            modifiedAttrs += ` ${classAttr}`;
          }
          
          finalAttrs = modifiedAttrs + ` ${dataAttr}`;
        } else {
          finalAttrs = `${classAttr} ${styleAttr} ${dataAttr}`;
        }
        
        return `<${tagName}${finalAttrs ? " " + finalAttrs : ""}>${processedInner}</${tagName}>`;
      } else {
        // 无颜色，返回原样
        return `<${tagName}${attributes ? " " + attributes : ""}>${processedInner}</${tagName}>`;
      }
    });
  }
  
  /**
   * 处理自闭合标签
   */
  function processSelfClosingTags(htmlStr: string): string {
    const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\s*\/\s*>/g;
    
    return htmlStr.replace(selfClosingRegex, (match, tagName: string, attributes: string) => {
      const lowerTagName = tagName.toLowerCase();
      
      // 跳过不需要处理的自闭合标签
      const skipTags = ["br", "hr", "img", "input", "meta", "link"];
      if (skipTags.includes(lowerTagName)) {
        return match;
      }
      
      // 提取class属性
      let className = "";
      const classMatch = attributes.match(/class\s*=\s*["']([^"']*)["']/i);
      if (classMatch) {
        className = classMatch[1];
      }

      // 获取标签颜色
      let tagColor = getColorForHtmlTag(lowerTagName, className);
      
      if (!tagColor && colours[lowerTagName]) {
        tagColor = colours[lowerTagName];
      }
      
      // 如果有颜色，添加样式和属性
      if (tagColor) {
        const preservedAttrs = attributes.trim();
        const styleAttr = `style="color:${tagColor}"`;
        const dataAttr = `data-tag="${tagName}"`;
        const classAttr = "class=\"tag-styled\"";
        
        let finalAttrs = "";
        if (preservedAttrs) {
          const styleMatch = preservedAttrs.match(/style\s*=\s*["']([^"']*)["']/i);
          const classMatch = preservedAttrs.match(/class\s*=\s*["']([^"']*)["']/i);
          
          let modifiedAttrs = preservedAttrs;
          
          // 合并样式
          if (styleMatch) {
            const existingStyle = styleMatch[1];
            const newStyle = `${existingStyle}; color:${tagColor}`;
            modifiedAttrs = modifiedAttrs.replace(styleMatch[0], `style="${newStyle}"`);
          } else {
            modifiedAttrs += ` ${styleAttr}`;
          }
          
          // 合并class
          if (classMatch) {
            const existingClass = classMatch[1];
            const newClass = `${existingClass} tag-styled`;
            modifiedAttrs = modifiedAttrs.replace(classMatch[0], `class="${newClass}"`);
          } else {
            modifiedAttrs += ` ${classAttr}`;
          }
          
          finalAttrs = modifiedAttrs + ` ${dataAttr}`;
        } else {
          finalAttrs = `${classAttr} ${styleAttr} ${dataAttr}`;
        }
        
        return `<${tagName}${finalAttrs ? " " + finalAttrs : ""} />`;
      } else {
        // 无颜色，返回原样
        return match;
      }
    });
  }
  
  // 处理HTML
  let result = processHtml(html);
  result = processSelfClosingTags(result);

  return result;
}
