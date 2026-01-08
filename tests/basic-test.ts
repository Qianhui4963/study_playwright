const { chromium, firefox, webkit } = require('playwright');
// 使用示例：cd playwright_/tests, node basic-test.js
(async () => {
// 测试数据：浏览器类型和对应实例
const browsers = [
    { name: 'Chrome', instance: chromium },
    { name: 'Firefox', instance: firefox },
    { name: 'Safari', instance: webkit }
  ];

for (const browserInfo of browsers) {
    console.log(`\n开始测试 ${browserInfo.name}...`);
    
    // 启动浏览器
    const browser = await browserInfo.instance.launch({
      headless: false, // 设为true可在无头模式下运行
      slowMo: 500,     // 操作间延迟，便于观察
    });
    
    // 创建上下文和页面
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 导航到测试页面
      await page.goto('https://www.baidu.com');
      
      // 获取页面标题
      const title = await page.title();
      console.log(`  ${browserInfo.name} 页面标题: "${title}"`);
      
      // 验证标题包含预期文本
      if (title.includes('百度一下')) {
        console.log(`  ✅ ${browserInfo.name} 标题验证通过`);
      } else {
        console.log(`  ❌ ${browserInfo.name} 标题验证失败`);
      }
      
      // 截屏保存（可选）
      await page.screenshot({ 
        path: `screenshots/${browserInfo.name.toLowerCase()}-homepage.png`
      });
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  🚨 ${browserInfo.name} 测试出错:`, message);
    } finally {
      // 无论测试成功与否，都关闭浏览器
      await browser.close();
    }
  }

console.log('\n所有浏览器测试完成！');
})();