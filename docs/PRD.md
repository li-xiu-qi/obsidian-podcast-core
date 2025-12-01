# Obsidian Podcast Core - Product Requirements Document (PRD)

## 产品概述

Obsidian Podcast Core 是一个Obsidian插件，旨在将用户的Markdown笔记转换为播客音频内容。通过集成AI技术，用户可以轻松地将笔记转换为结构化的播客脚本，并生成相应的音频文件。

## 目标用户

- Obsidian用户，希望将笔记内容转换为音频播客
- 内容创作者，需要快速生成播客内容
- 学习者，希望通过音频形式复习笔记

## 核心功能需求

### 1. 笔记输入与处理

- **功能描述**: 用户在Obsidian中选择笔记内容作为输入
- **输入格式**: Markdown文本
- **处理能力**: 支持标准Markdown语法，包括标题、列表、链接等

### 2. 播客生成模式

- **单人独白模式 (Monologue)**:
  - 生成单个讲述者的播客脚本
  - 支持选择不同的语音类型
  - 输出格式: JSON数组，包含speaker和text字段

- **双人对谈模式 (Dialogue)**:
  - 生成Host和Guest之间的对话脚本
  - 支持分别为Host和Guest选择语音
  - 输出格式: JSON数组，区分Host和Guest的发言

### 3. AI脚本生成

- **技术栈**: 使用StepFun API
- **输入**: 用户的Markdown笔记
- **输出**: 结构化的JSON脚本
- **语言**: 简体中文
- **长度限制**: 控制在200字以内
- **语气**: 轻松、专业

### 4. 语音合成

- **技术栈**: StepFun TTS API
- **音频格式**: MP3格式
- **语音选项**:
  - 单人模式: qinhenvsheng (Female - Natural)
  - 双人模式: Host (qinhenvsheng), Guest (wenrounansheng)

### 5. 用户界面

- **插件界面**: 集成到Obsidian的侧边栏
- **设置面板**: 选择生成模式和语音配置
- **进度显示**: 实时显示生成进度和状态
- **结果展示**: 音频播放器和脚本预览（聊天气泡形式）

### 6. 音频输出与导出

- **播放功能**: 内置音频播放器
- **导出选项**: 支持导出为WAV文件
- **存储**: 生成的音频文件存储在Obsidian vault中

## 技术规格

### API集成

- **LLM API**: Google Gemini 2.5 Flash (JSON模式)
- **TTS API**: Google Gemini 2.5 Flash TTS
- **认证**: API Key配置

### 数据格式

- **脚本格式**:

  ```json
  [
    {"speaker": "Host", "text": "欢迎来到播客..."},
    {"speaker": "Guest", "text": "谢谢邀请我..."}
  ]
  ```

### 性能要求

- **响应时间**: 脚本生成 < 10秒，音频合成 < 30秒
- **错误处理**: 网络重试机制，API错误提示
- **资源使用**: 轻量级，不影响Obsidian性能

## 用户体验流程

1. 用户在Obsidian中打开笔记
2. 点击插件图标打开Podcast Generator面板
3. 选择生成模式（单人/双人）
4. 配置语音设置
5. 点击"生成音频"按钮
6. 系统显示处理进度
7. 生成完成后，显示音频播放器和脚本预览
8. 用户可以播放音频或导出文件
