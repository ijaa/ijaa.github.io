import { expect, test } from '@playwright/test'

test('sound button toggles background music state', async ({ page }) => {
  await page.addInitScript(() => {
    let playCount = 0
    let pauseCount = 0

    Object.defineProperties(window, {
      __audioStats: {
        value: {
          get playCount() {
            return playCount
          },
          get pauseCount() {
            return pauseCount
          },
        },
      },
    })

    HTMLMediaElement.prototype.play = function () {
      playCount += 1
      return Promise.resolve()
    }

    HTMLMediaElement.prototype.pause = function () {
      pauseCount += 1
    }
  })

  await page.goto('/')

  const soundButton = page.getByRole('button', { name: '关闭声音' })
  await expect(soundButton).toBeVisible()
  await expect(soundButton).toHaveAttribute('aria-pressed', 'true')

  await soundButton.click()
  await expect(page.getByRole('button', { name: '开启声音' })).toHaveAttribute('aria-pressed', 'false')

  await page.getByRole('button', { name: '开启声音' }).click()
  await expect(page.getByRole('button', { name: '关闭声音' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.evaluate(() => window.__audioStats.playCount)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => window.__audioStats.pauseCount)).toBeGreaterThan(0)
})
