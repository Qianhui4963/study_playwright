const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

class LoginPageTest {
  constructor() {
    this.browsers = [
      { name: 'Chrome', instance: chromium },
      { name: 'Firefox', instance: firefox },
      { name: 'Safari', instance: webkit }
    ];
    this.testResults = [];
  }

  async runAllTests() {
    for (const browserInfo of this.browsers) {
      console.log(`\n🎯 在 ${browserInfo.name} 上运行登录测试`);

      const browser = await browserInfo.instance.launch({
        headless: true, // 测试时可设为true加快速度
      });

      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // 这里替换为你的实际登录页面URL
        await page.goto('https://saucedemo.com');

        // 执行测试用例
        await this.testValidLogin(page, browserInfo.name);
        await this.testInvalidLogin(page, browserInfo.name);

        this.testResults.push({
          browser: browserInfo.name,
          status: 'passed'
        });

      } catch (error) {
        console.error(`  ${browserInfo.name} 测试失败:`, error);
        this.testResults.push({
          browser: browserInfo.name,
          status: 'failed',
          error: error.message
        });

        // 出错时截图
        await page.screenshot({
          path: path.join(screenshotDir, `error-${browserInfo.name.toLowerCase()}-${Date.now()}.png`)
        });
      } finally {
        await browser.close();
      }
    }

    this.generateReport();
  }

  async testValidLogin(page, browserName) {
    console.log(`  👤 测试有效登录 (${browserName})`);

    // 先语义，后 locator. getBy* 系列方法更适合静态页面，locator 更适合动态交互场景

    // 填写正确的登录信息，匹配id选择器
    // await page.fill('#username', 'testuser');
    // await page.fill('#password', 'correctpassword');

    await page.getByRole('textbox', { name: 'Username' }).fill('standard_user');
    await page.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');

    // 匹配data-test属性选择器
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');

    // 点击登录按钮
    // await page.click('#login-btn');
    await page.locator('[data-test="login-button"]').click();

    // 等待跳转到库存页（登录成功页）
    await page.waitForURL('**/inventory.html', { timeout: 5000 });
    const currentUrl = page.url();
    if (currentUrl.includes('/inventory.html')) {
      console.log(`    ✅ ${browserName} 有效登录测试通过`);
    } else {
      throw new Error(`${browserName} 登录后未跳转到库存页，当前URL: ${currentUrl}`);
    }
  }

  async testInvalidLogin(page, browserName) {
    console.log(`  🚫 测试无效登录 (${browserName})`);

    // 返回登录页面
    await page.goto('https://saucedemo.com');

    // 填写错误的登录信息
    // await page.fill('#username', 'wronguser');
    // await page.fill('#password', 'wrongpassword');
    // 匹配data-test属性选择器
    await page.locator('[data-test="username"]').fill('locked_out_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    // await page.click('#login-btn');
    await page.locator('[data-test="login-button"]').click();

    // 等待错误消息
    await page.waitForSelector('[data-test="error"]', { timeout: 5000 });

    const errorText = await page.textContent('[data-test="error"]');
    if (errorText && errorText.toLowerCase().includes('epic sadface')) {
      console.log(`    ✅ ${browserName} 无效登录测试通过`);
    } else {
      throw new Error(`${browserName} 未显示预期的错误消息，实际: ${errorText || '空'}`);
    }
  }

  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(40));

    this.testResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.browser}: ${result.status}`);

      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });

    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const total = this.testResults.length;

    console.log(`\n总计: ${passed}/${total} 个浏览器通过测试`);
  }
}

// 运行测试
(async () => {
  const tester = new LoginPageTest();
  await tester.runAllTests();
})();