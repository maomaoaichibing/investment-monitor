export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 投资逻辑监控系统. 为专业投资者打造.
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            服务条款
          </a>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            隐私政策
          </a>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            联系我们
          </a>
        </div>
      </div>
    </footer>
  )
}