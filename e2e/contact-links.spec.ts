import { expect, test } from '@playwright/test'

test('contact mail button opens the configured mailto link', async ({ page }) => {
  let requestedUrl = ''

  page.on('request', (request) => {
    if (request.url().startsWith('mailto:')) {
      requestedUrl = request.url()
    }
  })

  await page.goto('/#contact')
  const mailLink = page.getByRole('link', { name: '发送邮件' })

  await expect(mailLink).toBeVisible()
  await expect(mailLink).toHaveAttribute('href', 'mailto:kailiu2013@gmail.com')
  await mailLink.click()

  await expect.poll(() => requestedUrl).toBe('mailto:kailiu2013@gmail.com')
})
