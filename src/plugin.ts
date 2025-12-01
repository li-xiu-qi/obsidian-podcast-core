import {
    Plugin,
    WorkspaceLeaf,
} from "obsidian";

import { PodcastView, PODCAST_VIEW_TYPE } from "./ui/PodcastView";
import { PodcastSettings, DEFAULT_SETTINGS, PodcastSettingTab } from "./settings";
import "./ui/podcast.css";

export type PodcastPlugin = PodcastPluginClass;

export class PodcastPluginClass extends Plugin {
    settings: PodcastSettings;

    async onload() {
        await this.loadSettings();

        // 注册播客视图
        this.registerView(PODCAST_VIEW_TYPE, (leaf) => new PodcastView(leaf, this));

        // 添加功能区图标用于打开播客生成器
        this.addRibbonIcon('mic', 'Open Podcast Generator', () => {
            this.activatePodcastView();
        });

        // 添加设置选项卡
        this.addSettingTab(new PodcastSettingTab(this.app, this));

        // 首次安装时激活播客视图
        if (await this.firstTimeInstall()) {
            this.activatePodcastView();
            await this.saveSettings();
        }
    }

    async onunload() {
        // 卸载时清理
        this.app.workspace.detachLeavesOfType(PODCAST_VIEW_TYPE);
    }

    async firstTimeInstall() {
        const existSettingFile = await this.app.vault.adapter.exists(
            this.manifest.dir + "/data.json",
        );
        return !existSettingFile;
    }

    async activatePodcastView() {
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(PODCAST_VIEW_TYPE);

        if (leaves.length > 0) {
            // 如果视图已经存在，则显示它
            leaf = leaves[0];
        } else {
            // 否则在右侧边栏创建新的页面
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({
                type: PODCAST_VIEW_TYPE,
                active: true,
            });
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}