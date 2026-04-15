"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Brain,
  BarChart3,
  Newspaper,
  LineChart,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface AgentAnalysis {
  agentId: string;
  displayName: string;
  signal: {
    agentId: string;
    signal: "bullish" | "bearish" | "neutral";
    confidence: number;
    reasoning: string;
    timestamp: string;
    durationMs?: number;
  };
}

interface AnalyzeResult {
  symbol: string;
  assetName: string;
  decision: {
    action: "buy" | "sell" | "hold";
    confidence: number;
    reasoning: string;
    signalSummary: {
      bullish: number;
      bearish: number;
      neutral: number;
      avgConfidence: number;
      weightedScore: number;
    };
    analyzedAt: string;
  };
  agentAnalyses: AgentAnalysis[];
}

// ============================================================
// Agent 元数据（图标 + 颜色）
// ============================================================

const AGENT_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  "value-investor": {
    icon: Brain,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  "growth-investor": {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  "technical-analyst": {
    icon: LineChart,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  "sentiment-analyst": {
    icon: Newspaper,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
};

const SIGNAL_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  bullish: {
    label: "看多",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    icon: TrendingUp,
  },
  bearish: {
    label: "看空",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/50",
    icon: TrendingDown,
  },
  neutral: {
    label: "中性",
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    icon: Minus,
  },
};

const DECISION_STYLE: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  buy: {
    label: "建议买入",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: TrendingUp,
  },
  sell: {
    label: "建议卖出",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: TrendingDown,
  },
  hold: {
    label: "建议持有",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: Minus,
  },
};

// ============================================================
// Confidence Bar
// ============================================================

function ConfidenceBar({ confidence, signal }: { confidence: number; signal: string }) {
  const barColor =
    signal === "bullish"
      ? "bg-emerald-500"
      : signal === "bearish"
        ? "bg-red-500"
        : "bg-slate-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
        {confidence}%
      </span>
    </div>
  );
}

// ============================================================
// Agent Card
// ============================================================

function AgentCard({ analysis, index }: { analysis: AgentAnalysis; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[analysis.agentId] || AGENT_META["technical-analyst"];
  const sig = SIGNAL_STYLE[analysis.signal.signal] || SIGNAL_STYLE.neutral;
  const SignalIcon = sig.icon;
  const AgentIcon = meta.icon;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${meta.bg} border-border/50 animate-in fade-in slide-in-from-bottom-2`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-start gap-3">
        {/* Agent icon */}
        <div className={`rounded-lg p-2 ${meta.bg}`}>
          <AgentIcon className={`h-5 w-5 ${meta.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{analysis.displayName}</h3>
              {analysis.signal.durationMs && (
                <span className="text-xs text-muted-foreground">
                  {analysis.signal.durationMs}ms
                </span>
              )}
            </div>
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sig.bg} ${sig.color}`}>
              <SignalIcon className="h-3.5 w-3.5" />
              {sig.label}
            </div>
          </div>

          {/* Confidence bar */}
          <ConfidenceBar confidence={analysis.signal.confidence} signal={analysis.signal.signal} />

          {/* Reasoning (expandable) */}
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {expanded ? "收起分析" : "查看分析"}
            </button>
            {expanded && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                {analysis.signal.reasoning}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Decision Banner
// ============================================================

function DecisionBanner({ decision, assetName }: { decision: AnalyzeResult["decision"]; assetName: string }) {
  const style = DECISION_STYLE[decision.action] || DECISION_STYLE.hold;
  const DecisionIcon = style.icon;

  return (
    <div
      className={`rounded-2xl border-2 p-6 ${style.bg} ${style.border} transition-all duration-500`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Big decision icon */}
        <div className="rounded-xl p-3 bg-background/80 shadow-sm">
          <DecisionIcon className={`h-8 w-8 ${style.color}`} />
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
            <h2 className={`text-2xl font-bold ${style.color}`}>{style.label}</h2>
            <Badge variant="secondary" className="w-fit text-xs">
              置信度 {decision.confidence}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{assetName} · {decision.reasoning}</p>
        </div>

        {/* Signal summary */}
        <div className="flex items-center gap-3 text-sm shrink-0">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{decision.signalSummary.bullish}</div>
            <div className="text-xs text-muted-foreground">看多</div>
          </div>
          <div className="text-muted-foreground">/</div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{decision.signalSummary.bearish}</div>
            <div className="text-xs text-muted-foreground">看空</div>
          </div>
          <div className="text-muted-foreground">/</div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-500">{decision.signalSummary.neutral}</div>
            <div className="text-xs text-muted-foreground">中性</div>
          </div>
        </div>
      </div>

      {/* Weighted score bar */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>加权信号得分</span>
          <span className="font-mono">
            {decision.signalSummary.weightedScore > 0 ? "+" : ""}
            {decision.signalSummary.weightedScore.toFixed(2)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
          {/* Score bar */}
          <div
            className={`absolute top-0 h-full rounded-full transition-all duration-1000 ease-out ${
              decision.signalSummary.weightedScore >= 0 ? "bg-emerald-500" : "bg-red-500"
            }`}
            style={{
              left: "50%",
              width: `${Math.abs(decision.signalSummary.weightedScore) * 100}%`,
              right: decision.signalSummary.weightedScore >= 0 ? "auto" : undefined,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>强烈看空</span>
          <span>中性</span>
          <span>强烈看多</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function HedgeFundPage() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ symbol: string; assetName: string }[]>([]);

  const analyze = useCallback(async (querySymbol?: string) => {
    const target = (querySymbol || symbol).trim();
    if (!target) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hedge-fund/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: target }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "分析失败");
      }

      setResult(json.data);
      setHistory((prev) => {
        const exists = prev.find((h) => h.symbol === target);
        if (exists) return prev;
        return [{ symbol: target, assetName: json.data.assetName }, ...prev].slice(0, 5);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") analyze();
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl p-2 bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Hedge Fund</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              多 Agent 投资决策引擎 — 价值·成长·技术·情绪 四维分析
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="输入港股代码，如 00700、9988、09888"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          />
        </div>
        <Button onClick={() => analyze()} disabled={loading || !symbol.trim()} size="default">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-1.5" />
              分析
            </>
          )}
        </Button>
      </div>

      {/* Quick history chips */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {history.map((h) => (
            <button
              key={h.symbol}
              onClick={() => {
                setSymbol(h.symbol);
                analyze(h.symbol);
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {h.symbol}
              <span className="text-muted-foreground">{h.assetName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium text-sm">分析失败</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Decision banner */}
          <DecisionBanner decision={result.decision} assetName={result.assetName} />

          {/* Agent analyses */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Agent 分析详情
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.agentAnalyses.map((a, i) => (
                <AgentCard key={a.agentId} analysis={a} index={i} />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-xs text-muted-foreground py-4 border-t">
            <p>
              以上分析由 AI Agent 自动生成，仅供学习参考，不构成投资建议。
            </p>
            <p className="mt-1">
              分析时间: {new Date(result.decision.analyzedAt).toLocaleString("zh-CN")} ·
              平均置信度: {result.decision.signalSummary.avgConfidence}%
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">输入股票代码开始分析</p>
          <p className="text-sm">
            支持港股（00700）、A股（000001）、美股（AAPL）代码
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["00700", "9988", "09888", "00005", "AAPL", "NVDA"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSymbol(s);
                  analyze(s);
                }}
                className="px-3 py-1.5 rounded-full text-xs border border-border hover:bg-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
