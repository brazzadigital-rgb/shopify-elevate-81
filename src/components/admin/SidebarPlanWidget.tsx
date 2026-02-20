import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { useNavigate } from "react-router-dom";
import { Crown, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-600", icon: null },
  trialing: { label: "Teste", color: "bg-amber-500/15 text-amber-600", icon: Clock },
  past_due: { label: "Atraso", color: "bg-red-500/15 text-red-600", icon: AlertCircle },
  canceled: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: null },
};

const cycleLabel: Record<string, string> = { monthly: "mês", semiannual: "semestre", annual: "ano" };

function daysLeft(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export function SidebarPlanWidget() {
  const { data: sub, isLoading } = useOwnerSubscription();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (isLoading) {
    return collapsed ? null : (
      <div className="px-3 pb-2">
        <Skeleton className="h-[72px] rounded-xl" />
      </div>
    );
  }

  const plan = sub?.plan;
  const status = sub?.status || "active";
  const cfg = statusConfig[status] || statusConfig.active;

  // Collapsed: show icon only
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/admin/planos")}
              className="flex items-center justify-center w-full py-2 text-primary hover:bg-muted/40 rounded-xl transition-colors"
            >
              <Crown className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{plan ? `${plan.name} — ${cfg.label}` : "Ver planos"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const price = plan
    ? sub.billing_cycle === "semiannual"
      ? plan.semiannual_price
      : sub.billing_cycle === "annual"
        ? plan.annual_price
        : plan.monthly_price
    : null;

  return (
    <button
      onClick={() => navigate("/admin/planos")}
      className="mx-3 mb-2 p-3.5 rounded-xl transition-all duration-200 hover:shadow-md group text-left w-[calc(100%-1.5rem)]"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))",
        border: "1px solid hsl(var(--primary) / 0.12)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Seu plano</span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
      </div>

      {plan ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">{plan.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            R$ {price?.toFixed(2).replace(".", ",")} / {cycleLabel[sub.billing_cycle] || "mês"}
          </div>
          {status === "trialing" && (
            <div className="text-[10px] text-amber-600 mt-1 font-medium">{daysLeft(sub.current_period_end)} dias restantes</div>
          )}
          {status === "past_due" && (
            <div className="text-[10px] text-red-500 mt-1 font-medium">Regularize seu plano →</div>
          )}
          {status === "active" && sub.current_period_end && (
            <div className="text-[10px] text-muted-foreground mt-1">Renova em {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Escolher um plano</span>
        </div>
      )}
    </button>
  );
}
