# Obsidian 请求 LLM 的常见问题

以下文档总结了在 Obsidian 插件中请求 LLM（大语言模型）时常见的 CORS 和浏览器环境问题，以及解决方案。

---

## 常见错误

在 Obsidian 插件内调用 LLM API 时，用户可能遇到以下错误：

- `Test failed: Connection error: Check your network connectivity and the Base URL setting. See console for details.`
- DevTools Console 中出现：
  - `Access to fetch at 'https://api.stepfun.com/v1/chat/completions' from origin 'app://obsidian.md' has been blocked by CORS policy: Request header field x-stainless-os is not allowed by Access-Control-Allow-Headers in preflight response.`
  - `POST https://api.stepfun.com/v1/chat/completions net::ERR_FAILED`

注意：在 Node.js 环境中运行相同代码通常能成功，说明 API 配置正确。

---

## 原因分析

1. **SDK 阻止浏览器使用密钥**：OpenAI/StepFun SDK 默认检测浏览器环境并阻止 API Key 使用，除非显式允许。
2. **CORS 预检失败**：SDK 添加的自定义头（如 `x-stainless-os`）未被服务器允许，导致预检请求失败。
3. **环境差异**：Obsidian 的 renderer 环境与 Node.js 不同，`fetch` 行为可能不一致。

---

## 解决方案

为解决这些问题，推荐以下策略：

### 1. 优先使用原生 fetch

- 直接使用 `globalThis.fetch` 发起 POST 请求，仅设置标准头（`Authorization` 和 `Content-Type`）。
- 避免 SDK 添加的非标准头，减少 CORS 失败风险。
- 请求体包含必要参数，如 model、messages 等。

### 2. SDK 回退机制

- 初始化 OpenAI client 时，从一开始就设置 `dangerouslyAllowBrowser: true`，允许浏览器使用 API Key。
- 传入 `globalThis.fetch`（如果可用），确保 SDK 使用正确的 fetch 实现。
- 使用 SDK 方法作为 fallback，当原生 fetch 失败时。

### 3. 错误处理和调试

- 添加详细的 console.log 和 console.error，便于诊断问题。
- 检查网络连接、API Key 和 Base URL。
- 在 Node.js 中测试以验证配置。

此方法已在实践中验证有效，兼容浏览器和 Node.js 环境。

