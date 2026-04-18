import { moment, Notice, Plugin, TFile, normalizePath } from "obsidian";
import {
  DailyCanvasSettings,
  DailyCanvasSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";

type Period = "daily" | "weekly";

export default class DailyCanvasPlugin extends Plugin {
  settings: DailyCanvasSettings;
  private statusBarItem: HTMLElement | null = null;
  private statusBarInterval: number | null = null;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("blocks", "Open daily canvas", () =>
      this.openOrCreate("daily")
    );

    this.addRibbonIcon("calendar-range", "Open weekly canvas", () =>
      this.openOrCreate("weekly")
    );

    this.addCommand({
      id: "open-today",
      name: "Open today's canvas",
      callback: () => this.openOrCreate("daily"),
    });

    this.addCommand({
      id: "open-this-week",
      name: "Open this week's canvas",
      callback: () => this.openOrCreate("weekly"),
    });

    this.addSettingTab(new DailyCanvasSettingTab(this.app, this));
    this.refreshStatusBar();

    if (this.settings.autoOpenOnStartup) {
      this.app.workspace.onLayoutReady(() => this.openOrCreate("daily"));
    }
  }

  onunload() {
    this.refreshStatusBar();
  }

  filePath(period: Period): string {
    const { dateFormat, folder } = this.settings[period];
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
      this.statusBarItem?.setText(moment().format(this.settings.daily.dateFormat));
    };
    update();
    this.statusBarInterval = window.setInterval(update, 60_000);
  }

  async openOrCreate(period: Period) {
    const { vault, workspace } = this.app;
    const { folder, templatePath } = this.settings[period];
    const filePath = this.filePath(period);

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
    const saved = await this.loadData();

    // Migrate from v1 flat settings
    if (saved && !saved.daily && "dateFormat" in saved) {
      this.settings = {
        ...DEFAULT_SETTINGS,
        daily: {
          dateFormat: saved.dateFormat ?? DEFAULT_SETTINGS.daily.dateFormat,
          folder: saved.folder ?? DEFAULT_SETTINGS.daily.folder,
          templatePath: saved.templatePath ?? DEFAULT_SETTINGS.daily.templatePath,
        },
        openInNewTab: saved.openInNewTab ?? DEFAULT_SETTINGS.openInNewTab,
        showStatusBar: saved.showStatusBar ?? DEFAULT_SETTINGS.showStatusBar,
        autoOpenOnStartup: saved.autoOpenOnStartup ?? DEFAULT_SETTINGS.autoOpenOnStartup,
      };
      await this.saveSettings();
      return;
    }

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      daily: { ...DEFAULT_SETTINGS.daily, ...(saved?.daily ?? {}) },
      weekly: { ...DEFAULT_SETTINGS.weekly, ...(saved?.weekly ?? {}) },
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
