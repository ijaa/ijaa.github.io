import { expect, test } from '@playwright/test';

const projects = [
  {
    title: 'Baby Future',
    href: 'https://ijaa.github.io/baby-future/',
  },
  {
    title: 'Image Story',
    href: 'https://ijaa.github.io/image-story/',
  },
  {
    title: 'GPT Image Gen',
    href: 'https://ijaa.github.io/gpt-image-gen/',
  },
];

test.describe('project image links', () => {
  for (const project of projects) {
    test(`clicking ${project.title} image navigates directly to the project`, async ({ page }) => {
      let requestedUrl: string | null = null;

      await page.route(project.href, async (route) => {
        requestedUrl = route.request().url();
        await route.fulfill({
          contentType: 'text/html',
          body: `<title>${project.title}</title><h1>${project.title}</h1>`,
        });
      });

      await page.goto('/#projects');
      const card = page.locator('.project-card').filter({ hasText: project.title });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('href', project.href);
      await expect(page.locator('.project-transition')).toHaveCount(0);

      await card.locator('.project-card-media img').click();

      await expect(page).toHaveURL(project.href);
      expect(requestedUrl).toBe(project.href);
      await expect(page.getByRole('heading', { name: project.title })).toBeVisible();
    });
  }
});
