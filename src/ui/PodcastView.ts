import { ItemView, WorkspaceLeaf } from "obsidian";
import { createApp, App } from "vue";
import PodcastPanel from "./PodcastPanel.vue";
import type { PodcastPlugin } from "../plugin";

export const PODCAST_VIEW_TYPE = "podcast-generator";

export class PodcastView extends ItemView {
    vueApp: App;
    vueInstance: InstanceType<typeof PodcastPanel>;
    plugin: PodcastPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: PodcastPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return PODCAST_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Podcast Generator";
    }

    getIcon(): string {
        return "mic";
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        const mountPoint = container.createEl("div", {
            cls: "podcast-panel",
        });

        const currentFile = this.app.workspace.getActiveFile();
        const content = currentFile ? await this.app.vault.read(currentFile) : '';

        this.vueApp = createApp(PodcastPanel, {
            app: this.app,
            plugin: this.plugin,
            currentFile,
            content,
        });
        
        this.vueApp.provide("plugin", this.plugin);
        this.vueApp.provide("container", mountPoint);
        this.vueInstance = this.vueApp.mount(mountPoint) as InstanceType<typeof PodcastPanel>;
    }

    async onClose() {
        if (this.vueApp) {
            this.vueApp.unmount();
        }
    }
}