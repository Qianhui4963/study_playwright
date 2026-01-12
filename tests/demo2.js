// search_test.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
(async () => {
  console.log('\n🎯 在 Chrome 上运行bing搜索测试');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://baidu.com/');
  // 更稳健的定位：尝试多个常见的搜索输入选择器，填写后按 Enter 提交
  const searchInput = page.locator('#chat-textarea');
  await searchInput.fill('Playwright');
  await searchInput.press('Enter');
  // 等待 URL 变化（查询参数出现）作为第一个信号，若未发生则继续靠结果选择器判断
  try {
    await page.waitForURL(/q=Playwright|q=Playwright/i, { timeout: 15000 });
  } catch (e) {
    // 忽略，继续尝试通过 DOM 判断结果
  }

  // 多选择器回退：逐个短等待，找到第一个可见的结果区域
  const resultSelectors = ['#wrapper_wrapper', 'li.b_algo', '.b_algo', '#b_results', '#b_content', '.sb_tlst', '.b_vList'];
  let found = false;
  for (const sel of resultSelectors) {
    try {
      await page.waitForSelector(sel, { state: 'visible', timeout: 5000 });
      found = true;
      break;
    } catch (e) {
      // not found, try next
    }
  }
  if (!found) {
    const dbgPath = path.join(screenshotDir, `bing-debug-${Date.now()}.png`);
    await page.screenshot({ path: dbgPath, fullPage: true });
    throw new Error(`未找到搜索结果元素，已保存调试截图：${dbgPath}`);
  }
  console.log(await page.title());

  await page.screenshot({ path: path.join(screenshotDir, `bing-search-${Date.now()}.png`) });
  await browser.close();
})();