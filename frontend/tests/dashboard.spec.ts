import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load the dashboard, open modal, and test filters', async ({ page }) => {
    // 1. Load the main page
    await page.goto('/');

    // 2. Wait for the apartments list to populate
    // Click an apartment that we know has transaction data ('동탄역롯데캐슬' or '힐스테이트동탄역')
    const aptTitle = page.locator('h4.text-base.font-bold', { hasText: /동탄역(?:롯데캐슬|힐스테이트)/ }).first()
                         .or(page.locator('h4.text-base.font-bold').first());
    await expect(aptTitle).toBeVisible({ timeout: 15000 });

    const aptName = await aptTitle.textContent();
    console.log('Selected Apartment:', aptName);

    // 3. Click the apartment
    await aptTitle.click();

    // 4. Verify the modal opens and displays '실거래가 내역'
    const txHistoryTitle = page.getByText('실거래가 내역', { exact: false }).first();
    await expect(txHistoryTitle).toBeVisible({ timeout: 10000 });
    
    // Check if the overall count is visible
    const totalCountText = await page.locator('h4').filter({ hasText: '실거래가 내역' }).textContent();
    console.log('Initial Table Header:', totalCountText);

    // 5. Test filtering dropdown (click on m² chevron arrow)
    const m2Header = page.locator('th', { hasText: 'm²' }).or(page.locator('th', { hasText: '평' }));
    
    // Expand the Type filter dropdown
    const typeFilterBtn = m2Header.locator('svg.lucide-chevron-down');
    await typeFilterBtn.click();

    // Wait for the dropdown menu
    const dropdownTitle = page.getByText('타입 필터', { exact: true });
    await expect(dropdownTitle).toBeVisible();

    // Select the first valid filter chip that isn't '전체보기' (e.g. "84A")
    const buttons = page.locator('div.absolute.z-50 button');
    const count = await buttons.count();
    
    let clickedFilter = false;
    for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent();
        if (text && text !== '전체보기') {
            await buttons.nth(i).click();
            clickedFilter = true;
            console.log('Clicked Filter:', text);
            break;
        }
    }

    if (clickedFilter) {
        // Verify dropdown is closed
        await expect(dropdownTitle).not.toBeVisible();
        
        // Wait a bit for the React state to update the DOM
        await page.waitForTimeout(500);

        // Print the new filtered header text
        const filteredCountText = await page.locator('h4').filter({ hasText: '실거래가 내역' }).textContent();
        console.log('Filtered Table Header:', filteredCountText);
        expect(filteredCountText).not.toEqual(totalCountText);
    }
  });
});
