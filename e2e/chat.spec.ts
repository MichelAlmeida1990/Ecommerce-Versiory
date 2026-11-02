import { test, expect } from '@playwright/test';

test('chat widget mobile - dump', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3002/');
  await page.waitForTimeout(2000);
  const chatBtn = page.locator('button.group').first();
  await chatBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:\\temp\\after.png' });
  const html = await page.content();
  console.log('HTML contains Abrir WhatsApp:', html.includes('Abrir WhatsApp'));
  console.log('HTML contains Suporte Versiory:', html.includes('Suporte Versiory'));
  const bodyText = await page.locator('body').innerText();
  console.log('BODY TEXT:', bodyText.slice(0, 800));
});
