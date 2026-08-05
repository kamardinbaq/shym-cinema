import { test, expect } from '@playwright/test';

test.describe('Quest Trailers Admin to Frontend', () => {
  const username = process.env.ROOT_ADMIN_USERNAME || '';
  const password = process.env.ROOT_ADMIN_PASSWORD || '';

  const trailer1 = 'https://youtu.be/h9dHH7LQImA?si=IRtHLiwV2WS0H4OY';
  const trailer2 = 'https://youtu.be/C5vye8oAkS0?si=TNcwW0eYKseqM4gn';
  const trailer3 = 'https://youtube.com/shorts/PHZwtpGp2qM?si=fucOShtu7ztVU698';

  const id1 = 'h9dHH7LQImA';
  const id2 = 'C5vye8oAkS0';
  const id3 = 'PHZwtpGp2qM';

  test('should save quest trailers in admin and render them on quest page', async ({ page }) => {
    // 1. Log in to Admin Panel
    await page.goto('/admin');
    await page.fill('input[placeholder="Логин"]', username);
    await page.fill('input[placeholder="Пароль"]', password);
    await page.click('button:has-text("ВОЙТИ")');

    // Wait for successful login and redirect to settings or slots
    await expect(page.locator('text=Настройки')).toBeVisible();

    // 2. Go to Settings tab
    await page.click('button:has-text("Настройки")');

    // 3. Switch to Quest settings
    await page.click('button:has-text("Квест")');

    // 4. Set the trailers
    // We target the inputs using the label text
    const t1Input = page.locator('div').filter({ hasText: 'ССЫЛКА НА ТРЕЙЛЕР 1' }).locator('input');
    await t1Input.fill(trailer1);

    const t2Input = page.locator('div').filter({ hasText: 'ССЫЛКА НА ТРЕЙЛЕР 2' }).locator('input');
    await t2Input.fill(trailer2);

    const t3Input = page.locator('div').filter({ hasText: 'ССЫЛКА НА ТРЕЙЛЕР 3' }).locator('input');
    await t3Input.fill(trailer3);

    // 5. Save and wait for toast
    await page.click('button:has-text("Сохранить изменения")');
    await expect(page.locator('text=Настройки сохранены')).toBeVisible();

    // 6. Go to Quest public page
    await page.goto('/quest');

    // 7. Verify the main trailer iframe (Trailer 1)
    const iframe1 = page.locator(`iframe[src*="${id1}"]`);
    await expect(iframe1).toBeVisible();

    // 8. Verify the vertical shorts iframe (Trailer 3)
    const iframe3 = page.locator(`iframe[src*="${id3}"]`);
    await expect(iframe3).toBeVisible();

    // 9. Verify the secondary trailer iframe (Trailer 2)
    const iframe2 = page.locator(`iframe[src*="${id2}"]`);
    await expect(iframe2).toBeVisible();
  });
});
