import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, configureAxe } from '@axe-core/playwright'

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe into the page
    await injectAxe(page)
    
    // Configure axe with custom rules if needed
    await configureAxe(page, {
      rules: [
        // Disable some rules for specific tests if needed
        // { id: 'color-contrast', enabled: false }
      ]
    })
  })

  test('Homepage accessibility (WCAG 2.1 AA)', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      // Check for WCAG 2.1 AA compliance
      tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    })
  })

  test('Navigation accessibility', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement)
    
    // Check navigation landmarks
    const nav = page.locator('nav[role="navigation"], nav, [role="banner"], [role="main"]')
    await expect(nav.first()).toBeVisible()
    
    // Run axe check on navigation
    await checkA11y(page, 'nav', {
      tags: ['wcag2a', 'wcag2aa']
    })
  })

  test('Form accessibility', async ({ page }) => {
    // Test forms like login, register, etc.
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check form labels
    const emailInput = page.getByRole('textbox', { name: /email/i })
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible()
      
      // Check if form has proper labels
      const emailLabel = page.locator('label[for]').filter({ hasText: /email/i })
      if (await emailLabel.count() > 0) {
        await expect(emailLabel.first()).toBeVisible()
      }
    }
    
    // Run accessibility check on the form
    await checkA11y(page, 'form', {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        // Form-specific accessibility rules
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true }
      }
    })
  })

  test('Color contrast compliance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Run color contrast specific checks
    await checkA11y(page, null, {
      tags: ['wcag2aa'],
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  test('Images and media accessibility', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check images have alt text
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        
        // Images should have alt text (can be empty for decorative images)
        expect(alt).not.toBeNull()
      }
    }
    
    // Run accessibility check for images
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'image-alt': { enabled: true }
      }
    })
  })

  test('Heading structure and landmarks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
    
    // There should only be one h1 on the page
    const h1Count = await h1.count()
    expect(h1Count).toBeLessThanOrEqual(1)
    
    // Check for landmark regions
    const main = page.locator('main, [role="main"]')
    await expect(main.first()).toBeVisible()
    
    // Run accessibility check for heading structure
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'page-has-heading-one': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true }
      }
    })
  })

  test('Interactive elements accessibility', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check buttons and links
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          // Buttons should have accessible names
          const accessibleName = await button.getAttribute('aria-label') || 
                                 await button.textContent() ||
                                 await button.getAttribute('title')
          expect(accessibleName?.trim()).toBeTruthy()
        }
      }
    }
    
    // Run accessibility check for interactive elements
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'button-name': { enabled: true },
        'link-name': { enabled: true }
      }
    })
  })

  test('Mobile accessibility', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check touch targets are large enough (44px minimum)
    const buttons = page.locator('button, a, input[type="button"], input[type="submit"]')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox()
          if (boundingBox) {
            // Touch targets should be at least 44px
            expect(boundingBox.width).toBeGreaterThanOrEqual(44)
            expect(boundingBox.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
    }
    
    // Run accessibility checks on mobile
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
    })
  })

  test('Keyboard navigation flow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test tab order
    const focusableElements = []
    let currentTabIndex = 0
    
    while (currentTabIndex < 10) { // Test first 10 tab stops
      await page.keyboard.press('Tab')
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        
        return {
          tagName: el.tagName,
          type: el.getAttribute('type'),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.textContent?.trim().substring(0, 50)
        }
      })
      
      if (focusedElement) {
        focusableElements.push(focusedElement)
      }
      
      currentTabIndex++
    }
    
    // Should have at least some focusable elements
    expect(focusableElements.length).toBeGreaterThan(0)
    
    // Test that we can navigate back with Shift+Tab
    await page.keyboard.press('Shift+Tab')
    
    // Run accessibility check for keyboard navigation
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'focusable-content': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    })
  })

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for proper ARIA attributes
    const ariaLandmarks = page.locator('[role]')
    const landmarkCount = await ariaLandmarks.count()
    
    if (landmarkCount > 0) {
      // Should have at least main landmark
      const mainLandmark = page.locator('[role="main"], main')
      await expect(mainLandmark.first()).toBeVisible()
    }
    
    // Check for skip links
    const skipLink = page.locator('a[href="#main"], a[href="#content"]').first()
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeInViewport()
    }
    
    // Run accessibility check for screen readers
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true }
      }
    })
  })

  test('Error handling accessibility', async ({ page }) => {
    // Test form validation errors are accessible
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const submitButton = page.getByRole('button', { name: /sign in|login/i })
    if (await submitButton.isVisible()) {
      // Try to submit empty form
      await submitButton.click()
      
      // Wait for error messages
      await page.waitForTimeout(1000)
      
      // Check if error messages are accessible
      const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"]')
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible()
      }
    }
    
    // Run accessibility check including error states
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
      rules: {
        'aria-valid-attr-value': { enabled: true }
      }
    })
  })
})