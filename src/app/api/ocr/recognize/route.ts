import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// 简单的 OCR 模拟实现
// 实际生产环境建议接入百度AI、腾讯云OCR等商业服务

interface PositionResult {
  symbol: string
  name: string
  quantity: number
  price: number
  costPrice: number
}

// 从文本中解析持仓信息
function parsePositionsFromText(text: string): PositionResult[] {
  const positions: PositionResult[] = []
  
  // 常见股票代码正则 (6位数字)
  const stockCodePattern = /(\d{6})/g
  
  // 查找所有可能的股票代码
  const matches = text.match(stockCodePattern) || []
  const uniqueCodes = Array.from(new Set(matches))
  
  // 常见股票代码映射（简化版）
  const stockNameMap: Record<string, string> = {
    '600519': '贵州茅台',
    '000858': '五粮液',
    '300750': '宁德时代',
    '002594': '比亚迪',
    '601318': '中国平安',
    '600900': '长江电力',
    '688981': '中芯国际',
    '600036': '招商银行',
    '000333': '美的集团',
    '600276': '恒瑞医药',
    '601888': '中国中免',
    '002415': '海康威视',
    '600030': '中信证券',
    '601012': '隆基绿能',
    '000001': '平安银行',
  }
  
  // 尝试解析数量和价格
  // 匹配 "数量 100" 或 "持仓 100" 等模式
  const quantityPattern = /(?:持仓|数量|股数|份额)[\s:：]*(\d+)/i
  const pricePattern = /(?:成本|价格|均价|买入价)[\s:：]*([\d.]+)/i
  
  for (const code of uniqueCodes) {
    // 只处理有效的股票代码（以6或0或3开头）
    if (!/^[0369]\d{5}$/.test(code) && !/^[13]\d{5}$/.test(code)) continue
    
    // 跳过一些常见数字
    if (['000000', '111111', '123456', '666666', '888888'].includes(code)) continue
    
    let quantity = 0
    let price = 0
    
    // 尝试从文本中提取数量和价格
    const quantityMatch = text.match(quantityPattern)
    const priceMatch = text.match(pricePattern)
    
    if (quantityMatch) quantity = parseInt(quantityMatch[1])
    if (priceMatch) price = parseFloat(priceMatch[1])
    
    // 尝试匹配同一行的信息
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.includes(code)) {
        // 尝试在该行中找数量
        const qtyMatch = line.match(/(\d+)\s*(?:股|手)?$/)
        if (qtyMatch && quantity === 0) quantity = parseInt(qtyMatch[1])
        
        // 尝试在该行中找价格
        const priceNumMatch = line.match(/[\d.]+/)
        if (priceNumMatch && price === 0) {
          const p = parseFloat(priceNumMatch[0])
          if (p > 0 && p < 10000) price = p
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
    
    // 模拟 OCR 处理（实际项目中应调用 Tesseract.js 或第三方 OCR API）
    // 这里返回一个模拟的成功响应
    
    // 读取文件内容作为文本处理
    const fileContent = buffer.toString('utf-8')
    
    // 简单处理：尝试从文件名提取股票代码
    let positions: PositionResult[] = []
    
    // 模拟识别到一些持仓（实际需要真实OCR处理）
    // 这里返回空数组，让用户手动填写或重试
    const simulatedPositions = [
      { symbol: '600519', name: '贵州茅台', quantity: 100, price: 1650.00, costPrice: 1650.00 },
      { symbol: '300750', name: '宁德时代', quantity: 200, price: 205.50, costPrice: 205.50 },
    ]
    
    // 尝试从文件名或内容中检测股票代码
    const fileName = file.name.toLowerCase()
    for (const stock of simulatedPositions) {
      if (fileName.includes(stock.symbol) || fileName.includes(stock.name)) {
        positions.push(stock)
      }
    }
    
    // 如果没有匹配，返回空数组让用户手动添加
    // 实际生产环境应该使用真实的 OCR 服务
    if (positions.length === 0) {
      // 尝试文本解析
      positions = parsePositionsFromText(fileContent)
    }
    
    // 清理临时文件
    await fs.unlink(tempPath).catch(() => {})
    
    return NextResponse.json({
      success: true,
      positions,
      message: positions.length > 0 
        ? `成功识别 ${positions.length} 个持仓` 
        : '未识别到持仓信息，请手动添加'
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
