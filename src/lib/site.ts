/**
 * 将站内绝对路径转换为带部署 base 前缀的路径。
 * GitHub Pages 子路径部署时 BASE_URL 形如 "/medtech-atlas/"。
 */
export const sitePath = (path: string): string =>
  path === "/" ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}${path}`;
