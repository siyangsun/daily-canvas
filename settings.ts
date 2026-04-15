import { App, moment, PluginSettingTab, Setting } from "obsidian";
import type DailyCanvasPlugin from "./main";

export interface DailyCanvasSettings {
  dateFormat: string;
  folder: string;
  templatePath: string;
  openInNewTab: boolean;
  showStatusBar: boolean;
  autoOpenOnStartup: boolean;
}

export const DEFAULT_SETTINGS: DailyCanvasSettings = {
  dateFormat: "YYYY-MM-DD",
  folder: "",
  templatePath: "",
  openInNewTab: false,
  showStatusBar: true,
  autoOpenOnStartup: false,
};

export class DailyCanvasSettingTab extends PluginSettingTab {
  plugin: DailyCanvasPlugin;

  constructor(app: App, plugin: DailyCanvasPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const dateFormatSetting = new Setting(containerEl)
      .setName("Date format")
      .setDesc("Moment.js format for the canvas filename (e.g. YYYY-MM-DD).")
      .addText((text) =>
        text
          .setPlaceholder("YYYY-MM-DD")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value || "YYYY-MM-DD";
            await this.plugin.saveSettings();
            updatePreview(value || "YYYY-MM-DD");
          })
      );

    const previewEl = dateFormatSetting.descEl.createDiv({ cls: "daily-canvas-format-preview" });
    const updatePreview = (format: string) => {
      previewEl.setText(`Preview: ${moment().format(format)}.canvas`);
    };
    updatePreview(this.plugin.settings.dateFormat);

    new Setting(containerEl)
      .setName("Folder")
      .setDesc("Vault folder to store daily canvas files. Leave blank for vault root.")
      .addText((text) =>
        text
          .setPlaceholder("e.g. Canvases/Daily")
          .setValue(this.plugin.settings.folder)
          .onChange(async (value) => {
            this.plugin.settings.folder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Template file")
      .setDesc("Path to a .canvas file to use as a template when creating a new daily canvas.")
      .addText((text) =>
        text
          .setPlaceholder("e.g. Templates/daily-canvas.canvas")
          .setValue(this.plugin.settings.templatePath)
          .onChange(async (value) => {
            this.plugin.settings.templatePath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Open in new tab")
      .setDesc("Always open the daily canvas in a new tab instead of the current one.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openInNewTab)
          .onChange(async (value) => {
            this.plugin.settings.openInNewTab = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show status bar")
      .setDesc("Show today's date in the status bar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStatusBar)
          .onChange(async (value) => {
            this.plugin.settings.showStatusBar = value;
            await this.plugin.saveSettings();
            this.plugin.refreshStatusBar();
          })
      );

    new Setting(containerEl)
      .setName("Auto-open on startup")
      .setDesc("Automatically open today's daily canvas when Obsidian starts.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoOpenOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.autoOpenOnStartup = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
