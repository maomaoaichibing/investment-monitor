import { NextRequest, NextResponse } from 'next/server'
import { llmMultiProviderService } from '@/server/services/llmMultiProviderService'

/**
 * GET /api/llm/providers
 * 获取所有LLM提供商的配置和状态
 */
export async function GET() {
  try {
    const providers = llmMultiProviderService.listProviders()
    
    // 测试每个提供商的连接状态
    const providersWithStatus = await Promise.all(
      providers.map(async (provider) => {
        const isConnected = await llmMultiProviderService.testProvider(provider.provider as any)
        return {
          ...provider,
          isConnected
        }
      })
    )

    return NextResponse.json({
      success: true,
      providers: providersWithStatus
    })
  } catch (error) {
    console.error('获取LLM提供商列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取LLM提供商列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}