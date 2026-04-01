import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/server/services/eventService';
import { UpdateEventSchema } from '@/lib/schemas/eventSchema';
import { ZodError } from 'zod';

/**
 * GET /api/events/:id
 * 获取单个事件详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 });
    }

    const event = await eventService.getEventById(id);

    return NextResponse.json({
      success: true,
      data: event
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching event:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch event'
    }, { status: 500 });
  }
}

/**
 * PUT /api/events/:id
 * 更新事件
 * 
 * Body参数:
 * {
 *   symbol?: string
 *   eventType?: string
 *   title?: string
 *   content?: string
 *   eventTime?: string
 *   source?: string
 *   metadataJson?: object
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    
    // 验证请求体
    const validatedData = UpdateEventSchema.parse(body);
    
    // 更新事件
    const event = await eventService.updateEvent(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update event'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/events/:id
 * 删除事件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 });
    }

    const event = await eventService.deleteEvent(id);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      data: { event }
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting event:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete event'
    }, { status: 500 });
  }
}