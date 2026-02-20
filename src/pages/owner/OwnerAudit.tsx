import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerAuditLogs } from "@/hooks/useOwnerSubscription";
import { Shield } from "lucide-react";
import { format } from "date-fns";

export default function OwnerAudit() {
  const { data: logs, isLoading } = useOwnerAuditLogs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Auditoria</h1>
        <p className="text-slate-400 text-sm mt-1">Registro de ações do sistema</p>
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-slate-800" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{log.action}</p>
                    <p className="text-xs text-slate-500">
                      {log.actor_type} • {log.ip || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
                    {format(new Date(log.created_at), "dd/MM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-12">Nenhum registro de auditoria</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
