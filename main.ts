import { moment, Notice, Plugin, TFile, normalizePath } from "obsidian";
import {
  DailyCanvasSettings,
  DailyCanvasSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";

export default class DailyCanvasPlugin extends Plugin {
  settings: DailyCanvasSettings;
  private statusBarItem: HTMLElement | null = null;
  private statusBarInterval: number | null = null;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("blocks", "Open daily canvas", () =>
      this.openOrCreateDailyCanvas()
    );

    this.addCommand({
      id: "open-today",
      name: "Open today's canvas",
      callback: () => this.openOrCreateDailyCanvas(),
    });

    this.addSettingTab(new DailyCanvasSettingTab(this.app, this));
    this.refreshStatusBar();

    if (this.settings.autoOpenOnStartup) {
      this.app.workspace.onLayoutReady(() => this.openOrCreateDailyCanvas());
    }
  }

  onunload() {
    this.refreshStatusBar();
  }

  todayFilePath(): string {
    const { dateFormat, folder } = this.settings;
    const filename = moment().format(dateFormat) + ".canvas";
    return normalizePath(folder ? `${folder}/${filename}` : filename);
  }

  refreshStatusBar() {
    if (this.statusBarInterval !== null) {
      window.clearInterval(this.statusBarInterval);
      this.statusBarInterval = null;
    }
    if (this.statusBarItem) {
      this.statusBarItem.remove();
      this.statusBarItem = null;
    }

    if (!this.settings.showStatusBar) return;

    this.statusBarItem = this.addStatusBarItem();
    const update = () => {
      this.statusBarItem?.setText(moment().format(this.settings.dateFormat));
    };
    update();
    this.statusBarInterval = window.setInterval(update, 60_000);
  }

  async openOrCreateDailyCanvas() {
    const { vault, workspace } = this.app;
    const { folder, templatePath } = this.settings;
    const filePath = this.todayFilePath();

    let file = vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
      if (folder && !vault.getAbstractFileByPath(normalizePath(folder))) {
        await vault.createFolder(normalizePath(folder));
      }

      let content = `{"nodes":[],"edges":[]}`;
      if (templatePath) {
        const templateFile = vault.getAbstractFileByPath(normalizePath(templatePath));
        if (templateFile instanceof TFile) {
          content = await vault.read(templateFile);
        } else {
          new Notice(`Daily Canvas: template file not found at "${templatePath}"`);
        }
      }

      file = await vault.create(filePath, content);
    }

    if (file instanceof TFile) {
      const leaf = workspace.getLeaf(this.settings.openInNewTab);
      await leaf.openFile(file);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
