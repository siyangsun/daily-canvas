import { App, moment, PluginSettingTab, Setting } from "obsidian";
import type DailyCanvasPlugin from "./main";

export interface PeriodSettings {
  dateFormat: string;
  folder: string;
  templatePath: string;
}

export interface DailyCanvasSettings {
  daily: PeriodSettings;
  weekly: PeriodSettings;
  openInNewTab: boolean;
  showStatusBar: boolean;
  autoOpenOnStartup: boolean;
}

export const DEFAULT_SETTINGS: DailyCanvasSettings = {
  daily: { dateFormat: "YYYY-MM-DD", folder: "", templatePath: "" },
  weekly: { dateFormat: "YYYY-[W]WW", folder: "", templatePath: "" },
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

    this.addPeriodSettings(containerEl, "daily", "Daily canvas");
    this.addPeriodSettings(containerEl, "weekly", "Weekly canvas");

    new Setting(containerEl).setName("General").setHeading();

    new Setting(containerEl)
      .setName("Open in new tab")
      .setDesc("Always open canvases in a new tab instead of the current one.")
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

  private addPeriodSettings(
    containerEl: HTMLElement,
    period: "daily" | "weekly",
    label: string
  ) {
    new Setting(containerEl).setName(label).setHeading();

    const periodSettings = this.plugin.settings[period];
    const defaultFormat = period === "daily" ? "YYYY-MM-DD" : "YYYY-[W]WW";
    const folderPlaceholder = period === "daily" ? "e.g. Canvases/Daily" : "e.g. Canvases/Weekly";
    const templatePlaceholder =
      period === "daily" ? "e.g. Templates/daily.canvas" : "e.g. Templates/weekly.canvas";

    const dateFormatSetting = new Setting(containerEl)
      .setName("Date format")
      .setDesc(`Moment.js format for the ${label.toLowerCase()} canvas filename.`)
      .addText((text) =>
        text
          .setPlaceholder(defaultFormat)
          .setValue(periodSettings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings[period].dateFormat = value || defaultFormat;
            await this.plugin.saveSettings();
            if (period === "daily") this.plugin.refreshStatusBar();
            updatePreview(value || defaultFormat);
          })
      );

    const previewEl = dateFormatSetting.descEl.createDiv({ cls: "daily-canvas-format-preview" });
    const updatePreview = (format: string) => {
      previewEl.setText(`Preview: ${moment().format(format)}.canvas`);
    };
    updatePreview(periodSettings.dateFormat);

    new Setting(containerEl)
      .setName("Folder")
      .setDesc("Vault folder to store canvases. Leave blank for vault root.")
      .addText((text) =>
        text
          .setPlaceholder(folderPlaceholder)
          .setValue(periodSettings.folder)
          .onChange(async (value) => {
            this.plugin.settings[period].folder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Template file")
      .setDesc("Path to a .canvas file to use as a template for new canvases.")
      .addText((text) =>
        text
          .setPlaceholder(templatePlaceholder)
          .setValue(periodSettings.templatePath)
          .onChange(async (value) => {
            this.plugin.settings[period].templatePath = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
