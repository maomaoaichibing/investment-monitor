import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, AlertTriangle, TrendingUp } from 'lucide-react'

export default function PortfoliosPage() {
  const portfolios = [
    {
      id: '1',
      name: 'Technology Growth',
      description: 'High-growth tech stocks with AI exposure',
      createdAt: '2025-12-01',
      positionCount: 6,
      alertCount: 2,
      performance: '+15.2%',
      tags: ['AI', 'Growth', 'Tech'],
    },
    {
      id: '2',
      name: 'Defensive Income',
      description: 'Dividend stocks and defensive sectors',
      createdAt: '2025-11-15',
      positionCount: 5,
      alertCount: 0,
      performance: '+8.7%',
      tags: ['Dividend', 'Defensive', 'Income'],
    },
    {
      id: '3',
      name: 'China Recovery',
      description: 'Chinese stocks with recovery potential',
      createdAt: '2025-10-20',
      positionCount: 4,
      alertCount: 1,
      performance: '+5.3%',
      tags: ['China', 'Recovery', 'Value'],
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">
            Manage your investment portfolios and monitor their performance
          </p>
        </div>
        <Button asChild>
          <Link href="/portfolios/new">
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PortfolioIcon className="h-5 w-5 text-primary" />
                    {portfolio.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {portfolio.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    portfolio.performance.startsWith('+') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {portfolio.performance}
                  </div>
                  <div className="text-sm text-muted-foreground">Since creation</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {portfolio.positionCount} positions
                    </span>
                  </div>
                  
                  {portfolio.alertCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {portfolio.alertCount} alerts
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      No active alerts
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {portfolio.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portfolios/${portfolio.id}`}>
                        查看
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      添加持仓
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {portfolios.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <PortfolioIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No portfolios yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first portfolio to start monitoring your investment thesis
              </p>
              <Button asChild>
                <Link href="/portfolios/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Portfolio
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}