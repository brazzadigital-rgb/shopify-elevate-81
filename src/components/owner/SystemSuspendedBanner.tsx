import { Ban, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SystemSuspendedBanner() {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Ban className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Sistema Suspenso</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            O acesso ao sistema foi suspenso por inadimplência. Entre em contato com o proprietário
            para regularizar a situação.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => window.location.href = "/owner/login"}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Acesso Owner
        </Button>
      </div>
    </div>
  );
}
