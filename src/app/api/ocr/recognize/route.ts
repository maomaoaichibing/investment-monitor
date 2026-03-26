import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// 增强版 OCR 模拟实现
// 实际生产环境建议接入百度AI、腾讯云OCR等商业服务

interface PositionResult {
  symbol: string
  name: string
  quantity: number
  price: number
  costPrice: number
}

// 常见股票代码映射（扩展版）
const stockNameMap: Record<string, string> = {
  // A股 - 白酒
  '600519': '贵州茅台',
  '000858': '五粮液',
  '000568': '泸州老窖',
  '002304': '洋河股份',
  '600809': '山西汾酒',
  // A股 - 新能源
  '300750': '宁德时代',
  '002594': '比亚迪',
  '601012': '隆基绿能',
  '600438': '通威股份',
  '601857': '中国石油',
  // A股 - 金融
  '601318': '中国平安',
  '600036': '招商银行',
  '000001': '平安银行',
  '601398': '工商银行',
  '601288': '农业银行',
  '600030': '中信证券',
  '600999': '招商证券',
  // A股 - 科技
  '688981': '中芯国际',
  '002415': '海康威视',
  '000333': '美的集团',
  '600276': '恒瑞医药',
  '601888': '中国中免',
  '600900': '长江电力',
  '002475': '立讯精密',
  '000725': '京东方A',
  '600703': '三安光电',
  '002230': '科大讯飞',
  '300059': '东方财富',
  '688012': '中微公司',
  // 港股
  '0700.HK': '腾讯控股',
  '9988.HK': '阿里巴巴',
  '3690.HK': '美团',
  '1810.HK': '小米集团',
  '9618.HK': '京东集团',
  '9868.HK': '小鹏汽车',
  // 美股
  'AAPL': '苹果',
  'GOOGL': '谷歌',
  'MSFT': '微软',
  'AMZN': '亚马逊',
  'TSLA': '特斯拉',
  'NVDA': '英伟达',
  'META': 'Meta',
}

// 从文本中解析持仓信息
function parsePositionsFromText(text: string): PositionResult[] {
  const positions: PositionResult[] = []

  // 常见股票代码正则 (6位数字A股, 5位数字港股, 字母数字美股)
  const stockCodePattern = /\b(\d{6})\b|\b([A-Z]{1,5})\b/g

  // 合并所有可能的股票代码
  const foundCodes = new Set<string>()

  // 匹配6位数字 (A股)
  const aSharePattern = /\b([036]\d{5})\b/g
  let match
  while ((match = aSharePattern.exec(text)) !== null) {
    foundCodes.add(match[1])
  }

  // 匹配美股代码 (1-5个大写字母)
  const usStockPattern = /\b([A-Z]{2,5})\b/g
  while ((match = usStockPattern.exec(text)) !== null) {
    const code = match[1].toUpperCase()
    if (stockNameMap[code]) {
      foundCodes.add(code)
    }
  }

  // 匹配带后缀的代码如 0700.HK
  const hkPattern = /(\d{4})\.HK/g
  while ((match = hkPattern.exec(text)) !== null) {
    foundCodes.add(`${match[1]}.HK`)
  }

  // 尝试解析数量和价格
  // 匹配 "持仓 100" "数量 100" "100股" 等模式
  const lines = text.split('\n')

  for (const code of Array.from(foundCodes)) {
    // 跳过一些常见数字
    if (['000000', '111111', '123456', '666666', '888888', '999999'].includes(code)) continue

    let quantity = 0
    let price = 0

    // 在包含该代码的行中查找数量和价格
    for (const line of lines) {
      if (!line.includes(code)) continue

      // 查找数量模式: 100股, 持仓100, 数量100
      const qtyPatterns = [
        /(\d{1,6})\s*股/,
        /持仓[^\d]*(\d+)/,
        /数量[^\d]*(\d+)/,
        /委托[^\d]*(\d+)/,
        /可用[^\d]*(\d+)/,
      ]
      for (const pattern of qtyPatterns) {
        const qMatch = line.match(pattern)
        if (qMatch) {
          quantity = parseInt(qMatch[1])
          if (quantity > 0) break
        }
      }

      // 查找价格模式: 价格15.5, 均价16, 成本20.3
      const pricePatterns = [
        /([\d.]+)\s*元/,
        /均价[^\d]*([\d.]+)/,
        /成本[^\d]*([\d.]+)/,
        /当前价[^\d]*([\d.]+)/,
      ]
      for (const pattern of pricePatterns) {
        const pMatch = line.match(pattern)
        if (pMatch) {
          const p = parseFloat(pMatch[1])
          if (p > 0 && p < 100000) {
            price = p
            break
          }
        }
      }
    }

    positions.push({
      symbol: code,
      name: stockNameMap[code] || `股票${code}`,
      quantity,
      price,
      costPrice: price
    })
  }

  return positions
}

// 从文件名解析股票代码
function parseFromFileName(fileName: string): PositionResult[] {
  const positions: PositionResult[] = []
  const lowerName = fileName.toLowerCase()

  // 查找文件名中的股票代码或名称
  for (const [code, name] of Object.entries(stockNameMap)) {
    if (lowerName.includes(code.toLowerCase()) || lowerName.includes(name.toLowerCase())) {
      positions.push({
        symbol: code,
        name: name,
        quantity: 0,
        price: 0,
        costPrice: 0
      })
    }
  }

  return positions
}

export async function POST(request: NextRequest) {
  try {
    // 检查是否有文件上传
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: '请上传图片文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式' },
        { status: 400 }
      )
    }

    // 检查文件大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片太大，请上传小于 10MB 的图片' },
        { status: 400 }
      )
    }

    // 保存临时文件用于调试
    const tempDir = path.join(process.cwd(), 'tmp')
    await fs.mkdir(tempDir, { recursive: true })
    const tempPath = path.join(tempDir, `ocr_${Date.now()}.${file.name.split('.').pop()}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(tempPath, buffer)

    let positions: PositionResult[] = []

    // 1. 首先尝试从文件名解析
    positions = parseFromFileName(file.name)

    // 2. 如果文件名没有匹配，尝试从文件内容解析
    if (positions.length === 0) {
      // 尝试读取文件内容（对于文本文件或包含文本的图片元数据）
      const fileContent = buffer.toString('utf-8')
      positions = parsePositionsFromText(fileContent)
    }

    // 3. 如果仍然没有结果，返回空数组让用户手动添加
    // 实际生产环境应该使用真实的 OCR 服务（如百度AI、腾讯云OCR）

    // 清理临时文件
    await fs.unlink(tempPath).catch(() => {})

    return NextResponse.json({
      success: true,
      positions,
      message: positions.length > 0
        ? `成功识别 ${positions.length} 个标的`
        : '未识别到标的，请手动输入'
    })

  } catch (error: any) {
    console.error('OCR 处理错误:', error)
    return NextResponse.json(
      { error: error.message || 'OCR处理失败，请重试' },
      { status: 500 }
    )
  }
}

// 禁用默认的 body parsing
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
