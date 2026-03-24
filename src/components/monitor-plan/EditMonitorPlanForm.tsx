'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UpdateMonitorPlanRequest } from '@/lib/schemas/monitorPlanSchema'

interface EditMonitorPlanFormProps {
  monitorPlan: any
  onSave: (data: UpdateMonitorPlanRequest) => void
  onCancel: () => void
}

export default function EditMonitorPlanForm({ monitorPlan, onSave, onCancel }: EditMonitorPlanFormProps) {
  const [notes, setNotes] = useState<string | null>(monitorPlan.notes ?? null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    
    // 保存时只更新 notes，保持其他字段不变
    onSave({ notes })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            编辑监控计划
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div>
            <Label className="text-lg font-semibold">备注 (Notes)</Label>
            <Textarea
              placeholder="添加备注信息..."
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value || null)}
              rows={6}
            />
            <p className="text-sm text-muted-foreground mt-1">清空此字段将删除备注（notes 将设为 null）</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="button" onClick={handleSave}>
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
