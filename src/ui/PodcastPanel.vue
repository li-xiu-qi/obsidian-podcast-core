<template>
    <div class="podcast-panel">
        <NConfigProvider
            :theme="theme"
            :theme-overrides="theme === null ? lightThemeConfig : darkThemeConfig"
        >
            <!-- Header Section -->
            <div class="podcast-header">
                <h2 class="podcast-title">
                    <Icon>
                        <Mic />
                    </Icon>
                    {{ t('Podcast Generator') }}
                </h2>
                <p class="podcast-subtitle">{{ t('Transform your notes into engaging audio content') }}</p>
            </div>

            <!-- Language Selection -->
            <div class="podcast-card">
                <div class="card-header">
                    <Icon>
                        <Language />
                    </Icon>
                    <span>{{ t('Language') }}</span>
                </div>
                <NSelect
                    v-model:value="currentLanguage"
                    :options="languageOptions"
                    size="medium"
                    style="width: 100%"
                    @update:value="changeLanguage"
                />
            </div>

            <!-- Mode Selection -->
            <div class="podcast-card">
                <div class="card-header">
                    <Icon>
                        <Settings />
                    </Icon>
                    <span>{{ t('Generation Mode') }}</span>
                </div>
                <NButtonGroup>
                    <NButton
                        :type="currentMode === 'monologue' ? 'primary' : 'default'"
                        size="medium"
                        @click="setMode('monologue')"
                        style="flex: 1"
                    >
                        <template #icon>
                            <Icon>
                                <PersonCircle />
                            </Icon>
                        </template>
                        {{ t('Solo Monologue') }}
                    </NButton>
                    <NButton
                        :type="currentMode === 'dialogue' ? 'primary' : 'default'"
                        size="medium"
                        @click="setMode('dialogue')"
                        style="flex: 1"
                    >
                        <template #icon>
                            <Icon>
                                <PeopleCircle />
                            </Icon>
                        </template>
                        {{ t('Dialogue') }}
                    </NButton>
                </NButtonGroup>
            </div>

            <!-- Generate Button -->
            <NButton
                type="primary"
                size="large"
                :loading="isGenerating"
                @click="generatePodcast"
                block
                class="generate-btn"
            >
                <template #icon>
                    <Icon>
                        <PlayCircle />
                    </Icon>
                </template>
                {{ isGenerating ? t('Generating...') : t('Generate Podcast') }}
            </NButton>

            <!-- Processing Log -->
            <div v-if="isGenerating" class="podcast-card log-card">
                <div class="card-header">
                    <Icon>
                        <Cog />
                    </Icon>
                    <span>{{ t('Processing Log') }}</span>
                </div>
                <div class="log-content">
                    <div v-for="(log, idx) in logs" :key="idx" class="log-line">
                        <Icon>
                            <CheckmarkCircle v-if="log.includes('successfully')" />
                            <CloseCircle v-else-if="log.includes('Error')" />
                            <Time v-else />
                        </Icon>
                        {{ log }}
                    </div>
                </div>
            </div>

            <!-- Result Area -->
            <div v-if="script && audioUrl" class="podcast-result">
                <!-- Audio Player -->
                <div class="podcast-card">
                    <div class="card-header">
                        <Icon>
                            <MusicalNote />
                        </Icon>
                        <span>{{ t('Audio Output') }}</span>
                    </div>
                    <audio :src="audioUrl" controls class="audio-player"></audio>
                    <NButton size="medium" type="default" class="export-btn" @click="exportMp3">
                        <template #icon>
                            <Icon>
                                <Download />
                            </Icon>
                        </template>
                        {{ t('Export MP3') }}
                    </NButton>
                </div>

                <!-- Script Display -->
                <div class="podcast-card">
                    <div class="card-header">
                        <Icon>
                            <DocumentText />
                        </Icon>
                        <span>{{ t('Generated Script') }}</span>
                        <NButton
                            v-if="Array.isArray(script) && script.length > 0"
                            size="small"
                            type="default"
                            @click="copyScript"
                            style="margin-left: auto;"
                        >
                            <template #icon>
                                <Icon>
                                    <Copy />
                                </Icon>
                            </template>
                            {{ t('Copy Script') }}
                        </NButton>
                    </div>
                    <div v-if="Array.isArray(script) && script.length > 0" class="script-chat">
                        <div
                            v-for="(line, idx) in script"
                            :key="idx"
                            :class="['script-message', {
                                'message-host': line.speaker === 'Host' || line.speaker === 'Narrator',
                                'message-guest': line.speaker === 'Guest'
                            }]"
                        >
                            <div class="message-avatar">
                                <Icon v-if="line.speaker === 'Host' || line.speaker === 'Narrator'">
                                    <PersonCircle />
                                </Icon>
                                <Icon v-else>
                                    <PeopleCircle />
                                </Icon>
                            </div>
                            <div class="message-content">
                                <div class="message-speaker">{{ line.speaker }}</div>
                                <div class="message-text">{{ line.text }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="script-raw">
                        <pre>{{ JSON.stringify(script, null, 2) }}</pre>
                    </div>
                </div>
            </div>
        </NConfigProvider>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, inject } from 'vue';
import { App, TFile, Notice } from 'obsidian';
import { darkTheme, GlobalThemeOverrides } from 'naive-ui';
import {
    NConfigProvider,
    NButton,
    NButtonGroup,
    NSelect,
    NInput,
    type SelectOption,
} from 'naive-ui';
import { VOICE_OPTIONS } from '../voices';
import { Icon } from "@vicons/utils";
import { PersonCircle, PeopleCircle, PlayCircle, Download, Mic, Language, Settings, VolumeHigh, Cog, CheckmarkCircle, CloseCircle, Time, MusicalNote, DocumentText, Copy } from '@vicons/ionicons5';
import { t } from '../lang/helper';
import type { PodcastPlugin } from '../plugin';
import { generatePodcastScript, generateAudio, PodcastScript } from '../podcast-generator';

interface Props {
    app: App;
    plugin: PodcastPlugin;
    currentFile: TFile | null;
    content: string;
}

withDefaults(defineProps<Props>(), {});

// 从PodcastView注入
const plugin = inject('plugin') as PodcastPlugin;
const container = inject('container') as HTMLElement;

// 状态
const currentMode = ref<'monologue' | 'dialogue'>('monologue');
const isGenerating = ref(false);
const logs = ref<string[]>([]);
const script = ref<PodcastScript[] | null>(null);
const audioUrl = ref<string | null>(null);
const currentLanguage = ref<string>(window.localStorage.getItem("language") || "en");

// 设置 - 使用 computed 自动同步插件设置的改动
const settings = computed(() => ({
    monologueVoice: plugin.settings.monologueVoice || 'qinhenvsheng',
    hostVoice: plugin.settings.hostVoice || 'qinhenvsheng',
    guestVoice: plugin.settings.guestVoice || 'wenrounansheng',
    hostPersona: plugin.settings.hostPersona || '亲切自然的女主持人，富有感染力，善于引导话题并提问。',
    guestPersona: plugin.settings.guestPersona || '沉稳、有洞察力的男嘉宾，善于提出观点并给出细致的分析。',
    narratorPersona: plugin.settings.narratorPersona || '温柔自然的讲述者，语速适中、情感自然。',
}));

// 音色选项
const voiceOptions: SelectOption[] = [
    { label: '清新女声', value: 'qinhenvsheng' },
    { label: '温柔男声', value: 'wenrounansheng' },
    { label: '温柔女声', value: 'wenroushunv' },
];

// 语言选项
const languageOptions: SelectOption[] = [
    { label: 'English', value: 'en' },
    { label: '中文', value: 'zh' },
];

// 主题配置
type ThemeOverrides = GlobalThemeOverrides;

const lightThemeConfig = reactive<ThemeOverrides>({
    common: {
        primaryColor: getDefaultColor(),
        primaryColorHover: getDefaultColor(),
    },
});

const darkThemeConfig = reactive<ThemeOverrides>({
    common: {
        primaryColor: getDefaultColor(),
        primaryColorHover: getDefaultColor(),
    },
});

const theme = computed(() => {
    return document.body.classList.contains('theme-dark') ? darkTheme : null;
});

function getDefaultColor() {
    // 获取默认颜色
    let button = document.body.createEl('button', {
        cls: 'mod-cta',
        attr: { style: 'width: 0px; height: 0px;' },
    });
    let color = getComputedStyle(button, null).getPropertyValue('background-color');
    button.remove();
    return color;
}

// 方法
const setMode = (mode: 'monologue' | 'dialogue') => {
    currentMode.value = mode;
};

const changeLanguage = (lang: string) => {
    window.localStorage.setItem("language", lang);
    currentLanguage.value = lang;
    // 通过触发小的状态变化来强制重新渲染
    window.location.reload();
};

const addLog = (msg: string) => {
    logs.value.push(`> ${msg}`);
};

const generatePodcast = async () => {
    if (!plugin.app.workspace.getActiveFile()) {
        new Notice(t('Please open a file first'));
        return;
    }

    isGenerating.value = true;
    logs.value = [];
    script.value = null;
    audioUrl.value = null;

    try {
        addLog(t('Generating podcast script...'));
        const currentFile = plugin.app.workspace.getActiveFile();
        const content = currentFile ? await plugin.app.vault.read(currentFile) : '';
        
        const requestSettings: any = plugin.settings;

        const generatedScript = await generatePodcastScript(
            content,
            requestSettings,
            currentMode.value
        );
        script.value = generatedScript;
        addLog(t('Script generated successfully'));

        addLog(t('Generating audio...'));
        const url = await generateAudio(generatedScript, requestSettings, currentMode.value);
        audioUrl.value = url;
        addLog(t('Audio generated successfully'));

        new Notice(t('Podcast generated successfully!'));
    } catch (error) {
        const message = (error as any)?.message ?? String(error);
        addLog(`Error: ${message}`);
        new Notice(`Error: ${message}`);
        console.error(error);
    } finally {
        isGenerating.value = false;
    }
};

const exportMp3 = async () => {
    if (!audioUrl.value) {
        new Notice(t('No audio available to export'));
        return;
    }

    try {
        // 获取当前文件名作为MP3名称
        const currentFile = plugin.app.workspace.getActiveFile();
        const fileName = currentFile ? currentFile.basename : 'podcast';
        const timestamp = new Date().toISOString().slice(0, 10);
        const mp3Name = `${fileName}-${timestamp}.mp3`;

        // 从blob URL获取音频数据
        const response = await fetch(audioUrl.value);
        const blob = await response.blob();

        // 创建下载链接并触发下载
        const link = document.createElement('a');
        link.href = audioUrl.value;
        link.download = mp3Name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        new Notice(t('MP3 exported successfully') + `: ${mp3Name}`);
    } catch (error) {
        const message = (error as any)?.message ?? String(error);
        new Notice(`Error exporting MP3: ${message}`);
        console.error(error);
    }
};

const copyScript = async () => {
    if (!script.value || !Array.isArray(script.value)) {
        new Notice(t('No script available to copy'));
        return;
    }

    try {
        const scriptText = script.value.map(line => `${line.speaker}: ${line.text}`).join('\n');
        await navigator.clipboard.writeText(scriptText);
        new Notice(t('Script copied to clipboard'));
    } catch (error) {
        const message = (error as any)?.message ?? String(error);
        new Notice(`Error copying script: ${message}`);
        console.error(error);
    }
};
</script>

<style scoped>
.podcast-panel {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
    font-family: var(--font-interface);
    font-size: var(--font-ui-small);
    background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
    min-height: 100%;
}

.podcast-header {
    text-align: center;
    margin-bottom: 24px;
}

.podcast-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: var(--font-ui-larger);
    font-weight: var(--font-bold);
    color: var(--text-accent);
    margin-bottom: 8px;
}

.podcast-subtitle {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0;
}

.podcast-card {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.podcast-card:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin-bottom: 12px;
}

.card-header span {
    flex: 1;
}

.config-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.config-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    font-weight: 500;
}

.config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.generate-btn {
    margin: 20px 0;
    background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
    border: none;
    border-radius: 8px;
    font-weight: var(--font-semibold);
    transition: all 0.3s ease;
}

.generate-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.log-card {
    border-left: 4px solid var(--interactive-accent);
}

.log-content {
    font-family: monospace;
    font-size: 12px;
    color: var(--text-muted);
    max-height: 200px;
    overflow-y: auto;
}

.log-line {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.5;
    margin-bottom: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--background-secondary);
}

.podcast-result {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.audio-player {
    width: 100%;
    height: 40px;
    margin-bottom: 12px;
    border-radius: 8px;
    outline: none;
    background: var(--background-secondary);
}

.export-btn {
    width: 100%;
    border-radius: 6px;
}

.script-chat {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
}

.script-message {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.message-host {
    justify-content: flex-start;
}

.message-guest {
    justify-content: flex-end;
    flex-direction: row-reverse;
}

.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--interactive-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.message-guest .message-avatar {
    background: var(--text-accent);
}

.message-content {
    max-width: 70%;
    background: var(--background-secondary);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-host .message-content {
    border-bottom-left-radius: 4px;
}

.message-guest .message-content {
    border-bottom-right-radius: 4px;
}

.message-speaker {
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-accent);
    margin-bottom: 4px;
}

.message-text {
    color: var(--text-normal);
    line-height: 1.5;
    word-break: break-word;
}

.script-raw {
    padding: 12px;
    background: var(--background-secondary);
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    color: var(--text-normal);
    max-height: 400px;
    overflow-y: auto;
}

.script-raw pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}

/* Mobile Responsive */
@media (max-width: 480px) {
    .podcast-panel {
        padding: 12px;
    }

    .config-grid {
        grid-template-columns: 1fr;
    }

    .script-chat {
        max-height: 300px;
    }

    .message-content {
        max-width: 85%;
    }
}
</style>
