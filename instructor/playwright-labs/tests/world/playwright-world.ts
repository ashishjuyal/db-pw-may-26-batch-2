import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page, chromium } from "@playwright/test";

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true, channel: 'msedge' });
    this.context = await this.browser.newContext({
      baseURL: "http://localhost:3000",
    });
    this.page = await this.context.newPage();
  }

  async teardown(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }
}

setWorldConstructor(PlaywrightWorld);
