import OpenAI from 'openai';
import { Notice } from 'obsidian';
import type { PodcastSettings } from './settings';
import { PODCAST_SYSTEM_PROMPT, MONOLOGUE_PROMPT, DIALOGUE_PROMPT } from './llm-prompts';

export interface PodcastScript {
    speaker: string;
    text: string;
}

/**
 * 从内容生成播客脚本
 */
export async function generatePodcastScript(
    content: string,
    settings: Partial<PodcastSettings>,
    mode: 'monologue' | 'dialogue' = 'monologue'
): Promise<PodcastScript[]> {
    const llmApiKey = (settings as any)?.llmApiKey;
    const llmBaseUrl = (settings as any)?.llmBaseUrl || 'https://api.stepfun.com/v1';
    const llmModel = (settings as any)?.llmModel || 'step-2-mini';

    if (!llmApiKey) {
        throw new Error('LLM API Key is not configured. Please set it in settings.');
    }

    const prompt = mode === 'monologue' ? MONOLOGUE_PROMPT : DIALOGUE_PROMPT;

    const messages = [
        { role: 'system' as const, content: PODCAST_SYSTEM_PROMPT },
        { role: 'user' as const, content: `${prompt}\n\nContent:\n${content}` }
    ];

    const requestBody = {
        model: llmModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
    };

    let scriptText: string | null = null;

    // 首先尝试使用原生fetch以避免SDK添加的头部导致CORS问题
    if (globalThis.fetch) {
        try {
            const chatUrl = `${llmBaseUrl}/chat/completions`;
            const response = await globalThis.fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${llmApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Fetch failed with status ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            scriptText = data.choices?.[0]?.message?.content;
            if (scriptText) {
                console.log('Successfully generated script via native fetch');
            } else {
                throw new Error('Empty response from fetch');
            }
        } catch (fetchError) {
            console.warn('Native fetch failed, falling back to SDK:', fetchError);
            // 回退到SDK
        }
    }

    // 如果fetch失败或不可用，则使用带有dangerouslyAllowBrowser的SDK
    if (!scriptText) {
        const fetchOptions = globalThis.fetch ? { fetch: globalThis.fetch } : {};
        const client = new OpenAI({
            apiKey: llmApiKey,
            baseURL: llmBaseUrl,
            dangerouslyAllowBrowser: true,
            ...fetchOptions
        });

        try {
            const response = await client.chat.completions.create(requestBody);
            scriptText = response.choices[0]?.message?.content;
            if (!scriptText) {
                throw new Error('Failed to generate script: empty response from SDK');
            }
            console.log('Successfully generated script via SDK fallback');
        } catch (sdkError) {
            const message = (sdkError as any)?.message ?? String(sdkError);
            console.error('SDK fallback also failed:', sdkError);
            throw new Error(`Failed to generate podcast script: ${message}`);
        }
    }

    if (!scriptText) {
        throw new Error('Failed to generate script: no valid response');
    }

    try {
        // 首先尝试解析纯文本格式 "Speaker: text"
        const lines = scriptText.split('\n').filter(line => line.trim());
        const scripts: PodcastScript[] = [];
        
        for (const line of lines) {
            // 匹配 "Speaker: text" 格式
            const match = line.match(/^(Narrator|Host|Guest|主播|嘉宾|讲述者):\s*(.+)$/);
            if (match) {
                let speaker = match[1];
                // 标准化说话者名称
                if (speaker === '主播') speaker = 'Host';
                if (speaker === '嘉宾') speaker = 'Guest';
                if (speaker === '讲述者') speaker = 'Narrator';
                
                scripts.push({
                    speaker,
                    text: match[2].trim()
                });
            }
        }
        
        // 如果成功解析了纯文本格式，直接返回
        if (scripts.length > 0) {
            console.log(`Successfully parsed ${scripts.length} script lines from plain text format`);
            return scripts;
        }
        
        // 如果纯文本格式解析失败，尝试解析JSON（回退兼容）
        const parsed = JSON.parse(scriptText);
        if (Array.isArray(parsed)) {
            return parsed as PodcastScript[];
        }
        
        // 如果响应不是数组，则尝试从中提取数组
        const arrayMatch = scriptText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            return JSON.parse(arrayMatch[0]) as PodcastScript[];
        }
        
        throw new Error('Invalid response format: expected plain text format "Speaker: text" or JSON array');
    } catch (parseError) {
        // 回退：创建简单脚本，尝试解析任何包含冒号的行
        const lines = scriptText.split('\n').filter(line => line.trim());
        const scripts = lines.map((line, i) => {
            // 尝试提取 "Speaker: text" 格式
            const match = line.match(/^(.+?):\s*(.+)$/);
            if (match) {
                return {
                    speaker: match[1].trim(),
                    text: match[2].trim()
                };
            }
            // 如果没有冒号，使用模式分配说话者
            return {
                speaker: mode === 'monologue' ? 'Narrator' : (i % 2 === 0 ? 'Host' : 'Guest'),
                text: line
            };
        });
        
        if (scripts.length > 0) {
            return scripts;
        }
        
        throw new Error(`Failed to parse script: ${parseError}`);
    }
}

/**
 * 从脚本生成音频
 */
export async function generateAudio(
    script: PodcastScript[],
    settings: Partial<PodcastSettings>,
    mode: 'monologue' | 'dialogue' = 'monologue'
): Promise<string> {
    const ttsApiKey = (settings as any)?.ttsApiKey;
    const ttsBaseUrl = (settings as any)?.ttsBaseUrl || 'https://api.stepfun.com/v1';
    const ttsModel = (settings as any)?.ttsModel || 'step-tts-2';

    if (!ttsApiKey) {
        throw new Error('TTS API Key is not configured. Please set it in settings.');
    }

    // 根据模式构建TTS输入
    let ttsInputText: string;
    let requestBody: any;

    if (mode === 'monologue') {
        // 对于独白：组合文本但不加说话者前缀以获得自然音频
        ttsInputText = script.map(s => s.text).join(' ');
        requestBody = {
            model: ttsModel,
            voice: (settings as any)?.monologueVoice || 'qinhenvsheng',
            input: ttsInputText,
        };
    } else {
        // 对于对话：使用说话者：文本格式以支持多说话者TTS
        ttsInputText = script.map(s => `${s.speaker}: ${s.text}`).join('\n');
        requestBody = {
            model: ttsModel,
            voice: (settings as any)?.hostVoice || 'qinhenvsheng',
            input: ttsInputText,
        };
    }

    let arrayBuffer: ArrayBuffer | null = null;

    // 首先尝试使用原生fetch以避免SDK添加的头部导致CORS问题
    if (globalThis.fetch) {
        try {
            const speechUrl = `${ttsBaseUrl}/audio/speech`;
            const response = await globalThis.fetch(speechUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ttsApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Fetch failed with status ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            arrayBuffer = await response.arrayBuffer();
            console.log('Successfully generated audio via native fetch');
        } catch (fetchError) {
            console.warn('Native fetch failed for audio, falling back to SDK:', fetchError);
            // 回退到SDK
        }
    }

    // 如果fetch失败或不可用，则使用带有dangerouslyAllowBrowser的SDK
    if (!arrayBuffer) {
        const fetchOptions = globalThis.fetch ? { fetch: globalThis.fetch } : {};
        const client = new OpenAI({
            apiKey: ttsApiKey,
            baseURL: ttsBaseUrl,
            dangerouslyAllowBrowser: true,
            ...fetchOptions
        });

        try {
            const response = await client.audio.speech.create(requestBody);
            arrayBuffer = await response.arrayBuffer();
            console.log('Successfully generated audio via SDK fallback');
        } catch (sdkError) {
            const message = (sdkError as any)?.message ?? String(sdkError);
            console.error('SDK fallback also failed for audio:', sdkError);
            throw new Error(`Failed to generate audio: ${message}`);
        }
    }

    if (!arrayBuffer) {
        throw new Error('Failed to generate audio: no valid response');
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
}

/**
 * 生成播客（完整流程）
 */
export async function generatePodcast(
    content: string,
    settings: Partial<PodcastSettings>,
    mode: 'monologue' | 'dialogue' = 'monologue'
): Promise<{ script: PodcastScript[], audioUrl: string }> {
    try {
        const script = await generatePodcastScript(content, settings, mode);
        const audioUrl = await generateAudio(script, settings);
        return { script, audioUrl };
    } catch (error) {
        const message = (error as any)?.message ?? String(error);
        new Notice(`Error: ${message}`);
        throw error;
    }
}
