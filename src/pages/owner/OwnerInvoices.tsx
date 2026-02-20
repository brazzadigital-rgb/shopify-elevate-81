import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerInvoices } from "@/hooks/useOwnerSubscription";
import { Receipt } from "lucide-react";
import { format } from "date-fns";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-amber-500/10 text-amber-400" },
  paid: { label: "Pago", cls: "bg-emerald-500/10 text-emerald-400" },
  expired: { label: "Expirado", cls: "bg-red-500/10 text-red-400" },
  canceled: { label: "Cancelado", cls: "bg-slate-500/10 text-slate-400" },
  refunded: { label: "Estornado", cls: "bg-blue-500/10 text-blue-400" },
};

export default function OwnerInvoices() {
  const { data: invoices, isLoading } = useOwnerInvoices();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Faturas</h1>
        <p className="text-slate-400 text-sm mt-1">Histórico de cobranças do sistema</p>
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Todas as Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 bg-slate-800" />)}
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">Data</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">Vencimento</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">Valor</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">Método</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const st = statusMap[inv.status] || statusMap.pending;
                    return (
                      <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-2 text-sm text-slate-300">{format(new Date(inv.created_at), "dd/MM/yyyy")}</td>
                        <td className="py-3 px-2 text-sm text-slate-300">{format(new Date(inv.due_at), "dd/MM/yyyy")}</td>
                        <td className="py-3 px-2 text-sm font-semibold text-white">{formatBRL(Number(inv.amount))}</td>
                        <td className="py-3 px-2 text-sm text-slate-400 uppercase">{inv.payment_method || "—"}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-12">Nenhuma fatura encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
