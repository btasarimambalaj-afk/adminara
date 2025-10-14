const { test, expect } = require('@playwright/test');

test.describe('Chat System E2E', () => {
  test('should send and receive chat messages', async ({ page, context }) => {
    // Open customer page
    await page.goto('http://localhost:3000');
    await page.fill('#welcomeNameInput', 'Customer');
    await page.click('#startCallBtn');
    
    // Open admin page in new tab
    const adminPage = await context.newPage();
    await adminPage.goto('http://localhost:3000/admin');
    
    // Wait for connection
    await page.waitForSelector('#chatToggle', { timeout: 5000 });
    await adminPage.waitForSelector('#chatToggle', { timeout: 5000 });
    
    // Customer opens chat
    await page.click('#chatToggle');
    await page.waitForSelector('#chatContainer:not(.hidden)');
    
    // Customer sends message
    await page.fill('#chatInput', 'Hello from customer');
    await page.click('#chatSend');
    
    // Admin should receive message
    await adminPage.click('#chatToggle');
    const adminMessage = await adminPage.waitForSelector('.chat-message-other', { timeout: 3000 });
    const adminMessageText = await adminMessage.textContent();
    expect(adminMessageText).toContain('Hello from customer');
    
    // Admin sends reply
    await adminPage.fill('#chatInput', 'Hello from admin');
    await adminPage.click('#chatSend');
    
    // Customer should receive reply
    const customerMessage = await page.waitForSelector('.chat-message-other', { timeout: 3000 });
    const customerMessageText = await customerMessage.textContent();
    expect(customerMessageText).toContain('Hello from admin');
  });
  
  test('should show unread badge', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#welcomeNameInput', 'Customer');
    await page.click('#startCallBtn');
    
    // Wait for chat toggle
    await page.waitForSelector('#chatToggle');
    
    // Simulate receiving message (via socket)
    await page.evaluate(() => {
      window.chatManager.addMessage('Test message', 'other', Date.now());
    });
    
    // Badge should be visible
    const badge = await page.waitForSelector('#chatBadge:not(.hidden)');
    const badgeText = await badge.textContent();
    expect(badgeText).toBe('1');
  });
  
  test('should clear messages on call end', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#welcomeNameInput', 'Customer');
    await page.click('#startCallBtn');
    
    // Open chat and send message
    await page.click('#chatToggle');
    await page.fill('#chatInput', 'Test message');
    await page.click('#chatSend');
    
    // Verify message exists
    await page.waitForSelector('.chat-message');
    
    // End call
    await page.click('#endButton');
    
    // Messages should be cleared
    const messages = await page.$$('.chat-message');
    expect(messages.length).toBe(0);
  });
});
