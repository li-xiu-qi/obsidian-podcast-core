/**
 * 播客生成器插件设置接口。
 */
export interface PodcastSettings {
	/** LLM API 密钥 (用于生成脚本) */
	llmApiKey: string;
	/** LLM 模型名字 */
	llmModel: string;
	/** LLM 基础 URL */
	llmBaseUrl: string;
	/** TTS API 密钥 (用于语音合成) */
	ttsApiKey: string;
	/** TTS 模型名字 */
	ttsModel: string;
	/** TTS 基础 URL */
	ttsBaseUrl: string;
	/** 语言设置 */
	language: 'en' | 'zh';
	/** 默认生成模式: 独白 或 对话 */
	defaultMode: 'monologue' | 'dialogue';
	/** 单人模式语音 */
	monologueVoice: string;
	/** 双人模式主持人语音 */
	hostVoice: string;
	/** 双人模式嘉宾语音 */
	guestVoice: string;
}

/**
 * AiTagger 插件设置接口。
 */
export interface AiTaggerSettings {
	/** LLM API 密钥 */
	llmApiKey: string;
	/** LLM 模型名字 */
	llmModel: string;
	/** LLM 基础 URL */
	llmBaseUrl: string;
	/** 语言设置 */
	language: 'en' | 'zh';
	/** 是否默认标签为小写 */
	lowercaseTags?: boolean;
	/** 是否启用embedding过滤 */
	enableEmbedding: boolean;
	/** 标签最大容量（字数/单词数） */
	maxTagsCapacity: number;
	/** Embedding API 密钥 */
	embeddingApiKey: string;
	/** Embedding 基础 URL */
	embeddingBaseUrl: string;
	/** Embedding 模型名字 */
	embeddingModel: string;
}

/**
 * 默认播客设置
 */
export const DEFAULT_SETTINGS: PodcastSettings = {
	llmApiKey: '',
	llmModel: 'step-2-mini',
	llmBaseUrl: 'https://api.stepfun.com/v1',
	ttsApiKey: '',
	ttsModel: 'step-tts-2',
	ttsBaseUrl: 'https://api.stepfun.com/v1',
	language: 'zh',
	defaultMode: 'monologue',
	monologueVoice: 'qingchunshaonv',
	hostVoice: 'wenrounansheng',
	guestVoice: 'wenroushunv',
};

/**
 * 播客设置标签页
 */
import { App, PluginSettingTab, Setting } from 'obsidian';
import type { PodcastPluginClass } from './plugin';

export class PodcastSettingTab extends PluginSettingTab {
	plugin: PodcastPluginClass;

	constructor(app: App, plugin: PodcastPluginClass) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '播客生成器设置' });

		// LLM 设置
		containerEl.createEl('h3', { text: 'LLM 设置' });

		new Setting(containerEl)
			.setName('LLM API 密钥')
			.setDesc('用于生成脚本的 API 密钥')
			.addText(text => text
				.setPlaceholder('输入您的 API 密钥')
				.setValue(this.plugin.settings.llmApiKey)
				.onChange(async (value) => {
					this.plugin.settings.llmApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('LLM 模型')
			.setDesc('使用的 LLM 模型')
			.addText(text => text
				.setPlaceholder('gpt-4o-mini')
				.setValue(this.plugin.settings.llmModel)
				.onChange(async (value) => {
					this.plugin.settings.llmModel = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('LLM 基础 URL')
			.setDesc('LLM API 的基础 URL')
			.addText(text => text
				.setPlaceholder('https://api.openai.com/v1')
				.setValue(this.plugin.settings.llmBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.llmBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		// TTS 设置
		containerEl.createEl('h3', { text: 'TTS 设置' });

		new Setting(containerEl)
			.setName('TTS API 密钥')
			.setDesc('用于语音合成的 API 密钥')
			.addText(text => text
				.setPlaceholder('输入您的 API 密钥')
				.setValue(this.plugin.settings.ttsApiKey)
				.onChange(async (value) => {
					this.plugin.settings.ttsApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('TTS 模型')
			.setDesc('使用的 TTS 模型')
			.addText(text => text
				.setPlaceholder('tts-1')
				.setValue(this.plugin.settings.ttsModel)
				.onChange(async (value) => {
					this.plugin.settings.ttsModel = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('TTS 基础 URL')
			.setDesc('TTS API 的基础 URL')
			.addText(text => text
				.setPlaceholder('https://api.openai.com/v1')
				.setValue(this.plugin.settings.ttsBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.ttsBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		// 其他设置
		containerEl.createEl('h3', { text: '其他设置' });

		new Setting(containerEl)
			.setName('语言')
			.setDesc('界面和生成的语言')
			.addDropdown(dropdown => dropdown
				.addOption('zh', '中文')
				.addOption('en', 'English')
				.setValue(this.plugin.settings.language)
				.onChange(async (value: 'en' | 'zh') => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('默认生成模式')
			.setDesc('播客的默认生成模式')
			.addDropdown(dropdown => dropdown
				.addOption('monologue', '独白')
				.addOption('dialogue', '对话')
				.setValue(this.plugin.settings.defaultMode)
				.onChange(async (value: 'monologue' | 'dialogue') => {
					this.plugin.settings.defaultMode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('单人模式语音')
			.setDesc('单人模式的语音')
			.addText(text => text
				.setPlaceholder('alloy')
				.setValue(this.plugin.settings.monologueVoice)
				.onChange(async (value) => {
					this.plugin.settings.monologueVoice = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('主持人语音')
			.setDesc('对话模式的主持人语音')
			.addText(text => text
				.setPlaceholder('alloy')
				.setValue(this.plugin.settings.hostVoice)
				.onChange(async (value) => {
					this.plugin.settings.hostVoice = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('嘉宾语音')
			.setDesc('对话模式的嘉宾语音')
			.addText(text => text
				.setPlaceholder('echo')
				.setValue(this.plugin.settings.guestVoice)
				.onChange(async (value) => {
					this.plugin.settings.guestVoice = value;
					await this.plugin.saveSettings();
				}));
	}
}