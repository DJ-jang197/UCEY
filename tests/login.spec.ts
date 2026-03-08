import { test, expect } from '@playwright/test';

test.describe('Login & Authentication Flow', () => {
  test('Redirects to login automatically from the root URL if not authenticated', async ({ page }) => {
    // Go to the main homepage
    await page.goto('/');
    
    // It should bounce us back to the login page immediately
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('Has all required fields on the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Check for Sign in button
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    
    // Check for Social Auth Google button
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('Has a working forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password
    await page.click('text=Forgot password?');
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/.*\/forgot-password/);
    await expect(page.locator('h1')).toContainText('Reset Password');
  });

  test('Has a working signup link', async ({ page }) => {
    await page.goto('/login');
    
    // Click sign up
    await page.click('text=Sign up today');
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.locator('h1')).toContainText('Create an account');
  });
  
  test('Prevents submission with empty fields', async ({ page }) => {
    await page.goto('/login');
    // Click sign in without entering data
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    
    // Should show error message
    const errorMessage = page.locator('text=Please fill out both email and password');
    await expect(errorMessage).toBeVisible();
    
    // Verify we didn't redirect
    await expect(page).toHaveURL(/.*\/login/);
  });
});
