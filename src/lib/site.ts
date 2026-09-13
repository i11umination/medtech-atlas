/**
 * 将站内绝对路径转换为带部署 base 前缀的路径。
 * GitHub Pages 子路径部署时 BASE_URL 形如 "/medtech-atlas/"。
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const sitePath = (path: string): string => `${base}${path}`;
