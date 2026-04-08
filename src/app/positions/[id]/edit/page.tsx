// 服务端包装器 - params.id 在服务端解析后传递给客户端组件
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { EditPositionClient } from './EditPositionForm'

interface PageProps {
  params: { id: string }
}

export default async function EditPositionPage({ params }: PageProps) {
  // 验证持仓是否存在
  const position = await db.position.findUnique({
    where: { id: params.id },
    select: { id: true }
  })

  if (!position) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>编辑持仓</span>
        </div>
        <h1 className="text-xl font-bold">编辑持仓</h1>
        <div style={{ width: 120 }} />
      </div>

      <EditPositionClient positionId={params.id} />
    </div>
  )
}
