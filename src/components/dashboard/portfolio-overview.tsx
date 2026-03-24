import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus } from 'lucide-react'
import Link from 'next/link'

export default function PortfolioOverview() {
  const portfolios = [
    {
      id: 1,
      name: 'Technology Growth',
      description: 'High-growth tech stocks with AI exposure',
      positionCount: 6,
      alertCount: 2,
      performance: '+15.2%',
    },
    {
      id: 2,
      name: 'Defensive Income',
      description: 'Dividend stocks and defensive sectors',
      positionCount: 5,
      alertCount: 0,
      performance: '+8.7%',
    },
    {
      id: 3,
      name: 'China Recovery',
      description: 'Chinese stocks with recovery potential',
      positionCount: 4,
      alertCount: 1,
      performance: '+5.3%',
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Portfolio Overview</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portfolios">
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <PortfolioIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{portfolio.name}</div>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <Badge variant="secondary" className="text-xs">
                      {portfolio.positionCount} 个持仓
                    </Badge>
                    {portfolio.alertCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {portfolio.alertCount} 个提醒
                      </Badge>
                    )}
                    <span className={`text-sm font-medium ${
                      portfolio.performance.startsWith('+') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {portfolio.performance}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
          
          <Button variant="outline" className="w-full" asChild>
            <Link href="/portfolios/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Portfolio
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}