import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ContactPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly subject: Locator;
  readonly message: Locator;
  readonly attachment: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.email = page.getByTestId('email');
    this.subject = page.getByTestId('subject');
    this.message = page.getByTestId('message');
    this.attachment = page.getByTestId('attachment');
    this.submit = page.getByTestId('contact-submit');
  }

  protected get anchor(): Locator {
    return this.submit;
  }

  async openContact(): Promise<void> {
    await this.open('/contact');
  }

  async fieldErrors(): Promise<string[]> {
    return (await this.page.locator('.invalid-feedback, .alert-danger').allInnerTexts())
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
