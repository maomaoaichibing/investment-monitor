import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://62.234.79.188:4000'

/**
 * 页面对象模型 - 导航组件
 */
class Navigation {
  constructor(private page: Page) {}

  async goto(path: string) {
    await this.page.goto(BASE_URL + path)
  }

  async clickLink(href: string) {
    await this.page.click(`a[href="${href}"]`)
  }
}

/**
 * 测试投资监控系统页面链接可访问性
 */
test.describe('投资监控系统 - 页面链接验证', () => {

  let nav: Navigation

  test.beforeEach(async ({ page }) => {
    nav = new Navigation(page)
    // 忽略网络错误，只关注功能
    page.on('pageerror', () => {}) 
  })

  test('首页 Dashboard 正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/')
    expect(response?.status()).toBe(200)
    
    // 验证标题
    await expect(page).toHaveTitle(/投资逻辑监控系统/)
  })

  test('投资组合列表页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/portfolios')
    expect(response?.status()).toBe(200)
    
    // 验证关键元素存在
    const link = page.locator('a[href="/portfolios/cmn89mcmv0000yxwftq9bnzzc"]')
    await expect(link).toBeVisible()
  })

  test('组合详情页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/portfolios/cmn89mcmv0000yxwftq9bnzzc')
    expect(response?.status()).toBe(200)
  })

  test('论题列表页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/theses')
    expect(response?.status()).toBe(200)
  })

  test('提醒列表页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/alerts')
    expect(response?.status()).toBe(200)
  })

  test('持仓详情页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/positions/cmn89n0n1000kyxwfkxfrc8j4')
    expect(response?.status()).toBe(200)
  })

  test('Theses详情页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/theses/cmn9v1tns0003pilmb9xu3q5q')
    expect(response?.status()).toBe(200)
  })

  test('Alert详情页正常加载', async ({ page }) => {
    const response = await page.goto(BASE_URL + '/alerts/cmna1yskg000913t89x7r29mh')
    expect(response?.status()).toBe(200)
  })
})

/**
 * 测试关键用户流程
 */
test.describe('关键用户流程', () => {

  test('从首页导航到组合详情', async ({ page }) => {
    await page.goto(BASE_URL + '/')
    
    // 点击组合链接
    await page.click('text=投资组合')
    await expect(page).toHaveURL(/portfolios/)
    
    // 点击第一个组合
    await page.click('a[href="/portfolios/cmn89mcmv0000yxwftq9bnzzc"]')
    await expect(page).toHaveURL(/cmn89mcmv0000yxwftq9bnzzc/)
  })

  test('从组合详情导航到持仓详情', async ({ page }) => {
    await page.goto(BASE_URL + '/portfolios/cmn89mcmv0000yxwftq9bnzzc')
    
    // 点击持仓链接
    const positionLink = page.locator('a[href^="/positions/"]').first()
    if (await positionLink.isVisible()) {
      await positionLink.click()
      await expect(page).toHaveURL(/positions/)
    }
  })

  test('从首页导航到提醒列表', async ({ page }) => {
    await page.goto(BASE_URL + '/')
    
    // 点击提醒链接
    await page.click('a[href="/alerts"]')
    await expect(page).toHaveURL(/alerts/)
  })

  test('从提醒列表导航到提醒详情', async ({ page }) => {
    await page.goto(BASE_URL + '/alerts')
    
    // 点击提醒详情
    const alertLink = page.locator('a[href^="/alerts/cmn"]').first()
    if (await alertLink.isVisible()) {
      await alertLink.click()
      await expect(page).toHaveURL(/cmna1yskg/)
    }
  })
})

/**
 * 测试响应状态码
 */
test.describe('API 端点验证', () => {
  
  test('组合列表 API', async ({ request }) => {
    const response = await request.get(BASE_URL + '/api/portfolios')
    expect(response.status()).toBe(200)
  })

  test('持仓列表 API', async ({ request }) => {
    const response = await request.get(BASE_URL + '/api/positions')
    expect(response.status()).toBe(200)
  })

  test('Theses API', async ({ request }) => {
    const response = await request.get(BASE_URL + '/api/theses')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.data.theses.length).toBeGreaterThan(0)
  })

  test('Alerts API', async ({ request }) => {
    const response = await request.get(BASE_URL + '/api/alerts')
    expect(response.status()).toBe(200)
  })
})