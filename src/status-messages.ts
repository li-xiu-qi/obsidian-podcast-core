/**
 * UI界面提示词映射
 * 用于国际化和本地化的提示词
 */
export const PROMPT_TEMPLATES = {
    // 生成按钮和状态提示
    generateButtonLabel: 'Generate Podcast',
    generatingButtonLabel: 'Generating...',

    // 日志消息
    logs: {
        generatingScript: 'Generating podcast script...',
        scriptGeneratedSuccess: 'Script generated successfully',
        generatingAudio: 'Generating audio...',
        audioGeneratedSuccess: 'Audio generated successfully',
    },

    // 错误消息
    errors: {
        noFileOpen: 'Please open a file first',
        noAudioAvailable: 'No audio available to export',
        exportFailed: 'Error exporting MP3',
    },

    // 成功消息
    success: {
        podcastGenerated: 'Podcast generated successfully!',
        mp3Exported: 'MP3 exported successfully',
    },

    // 导出相关配置
    export: {
        fileNameFormat: '{fileName}-{date}.mp3',
        dateFormat: 'YYYY-MM-DD',
    }
};