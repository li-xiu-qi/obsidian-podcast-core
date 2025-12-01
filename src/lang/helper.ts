import zh from "./locale/zh";
import en from "./locale/en";

// 语言映射表
const localeMap: { [k: string]: Partial<typeof en>; } = {
    en,
    zh,
};

// 获取浏览器语言设置
const lang = window.localStorage.getItem("language");
const locale = localeMap[lang || "en"];

// 翻译函数
export function t(text: keyof typeof en): string {
    return (locale && locale[text]) || en[text];
}