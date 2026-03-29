'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function EmailSettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; checking: boolean }>({ configured: false, checking: true })

  // 检查配置状态
  useState(() => {
    fetch('/api/email')
      .then(res => res.json())
      .then(data => {
        setConfigStatus({ configured: data.configured || false, checking: false })
      })
      .catch(() => {
        setConfigStatus({ configured: false, checking: false })
      })
  })

  const handleSendTest = async () => {
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email })
      })
      const data = await res.json()

      setResult({
        success: data.success || false,
        message: data.success ? '测试邮件发送成功！' : (data.error || '发送失败')
      })
    } catch (error) {
      setResult({
        success: false,
        message: '网络错误，请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">邮件通知设置</h1>
        <p className="text-muted-foreground mt-2">
          配置邮件通知，接收投资提醒和每日摘要
        </p>
      </div>

      {/* 配置状态 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            邮件服务状态
          </CardTitle>
          <CardDescription>
            检查邮件发送功能是否可用
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configStatus.checking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在检查...
            </div>
          ) : configStatus.configured ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                邮件服务已配置完成，可以发送邮件
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-500 bg-yellow-50">
              <XCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700">
                邮件服务未配置或配置无效。请在服务器环境变量中设置 EMAIL_USER、EMAIL_PASS、EMAIL_HOST
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 发送测试邮件 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">发送测试邮件</CardTitle>
          <CardDescription>
            输入邮箱地址，发送一封测试邮件验证配置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSendTest}
            disabled={!email || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                发送测试邮件
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 配置说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">环境变量配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">EMAIL_HOST</span>
              <span>smtp.qq.com</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">EMAIL_PORT</span>
              <span>587</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">EMAIL_USER</span>
              <span>your@qq.com</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">EMAIL_PASS</span>
              <span>授权码</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">EMAIL_FROM</span>
              <span>显示名称</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            注意：QQ邮箱需要使用授权码而不是登录密码。
            在QQ邮箱设置 → 账户 → POP3/SMTP服务 中获取授权码。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
