import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/server/services/eventService';
import { CreateEventSchema, QueryEventSchema } from '@/lib/schemas/eventSchema';
import { ZodError } from 'zod';

/**
 * GET /api/events
 * 获取事件列表（支持分页和筛选）
 * 
 * Query参数:
 * - symbol?: string - 股票代码
 * - eventType?: string - 事件类型
 * - startDate?: string - 开始时间 (ISO格式)
 * - endDate?: string - 结束时间 (ISO格式)
 * - source?: string - 事件来源
 * - page?: number - 页码 (默认1)
 * - pageSize?: number - 每页数量 (默认10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 构建查询参数
    const queryData = {
      symbol: searchParams.get('symbol') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      source: searchParams.get('source') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10'
    };

    // 验证查询参数
    const validatedQuery = QueryEventSchema.parse(queryData);
    
    // 获取事件列表
    const { events, pagination } = await eventService.getEvents(validatedQuery);

    return NextResponse.json({
      success: true,
      data: events,
      pagination
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching events:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch events'
    }, { status: 500 });
  }
}

/**
 * POST /api/events
 * 创建新事件
 * 
 * Body参数:
 * {
 *   symbol: string - 股票代码
 *   eventType: string - 事件类型
 *   title: string - 事件标题
 *   content: string - 事件内容
 *   eventTime?: string - 事件时间 (ISO格式)
 *   source?: string - 事件来源
 *   metadataJson?: object - 元数据
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求体
    const validatedData = CreateEventSchema.parse(body);
    
    // 创建事件
    const event = await eventService.createEvent(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create event'
    }, { status: 500 });
  }
}