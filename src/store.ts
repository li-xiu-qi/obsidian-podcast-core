import { reactive } from "vue";

export const podcastStore = reactive({
    isGenerating: false,
    logs: [] as string[],
    currentScript: [] as any[],
    currentAudioUrl: "" as string | null,
    error: "" as string | null,

    addLog(message: string) {
        this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    },

    clearLogs() {
        this.logs = [];
    },

    setGenerating(status: boolean) {
        this.isGenerating = status;
    },

    setScript(script: any[]) {
        this.currentScript = script;
    },

    setAudioUrl(url: string | null) {
        this.currentAudioUrl = url;
    },

    setError(error: string | null) {
        this.error = error;
    },
});