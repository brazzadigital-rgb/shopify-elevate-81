import { Crown, AlertTriangle, Gem, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Full-page premium suspension screen shown when the system is suspended.
 * Displayed by AdminLayout when isSuspended && user is NOT on /admin/planos or /admin/assinatura.
 */
export function SystemSuspendedFullPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Decorative gem icon */}
        <div className="relative mx-auto w-24 h-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-300/40"
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center shadow-lg shadow-amber-100/40">
            <Gem className="w-10 h-10 text-amber-600" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-amber-800 to-slate-800 bg-clip-text text-transparent">
            Assinatura Pendente
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            Sua assinatura expirou e o acesso às funcionalidades do painel está temporariamente
            desabilitado. Regularize para voltar a gerenciar sua joalheria com todo o brilho. ✨
          </p>
        </div>

        {/* Status card */}
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-200/60 rounded-2xl p-5 mx-auto max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-amber-800">O que está desabilitado:</p>
          </div>
          <ul className="text-xs text-amber-700/80 space-y-1.5 text-left pl-11">
            <li>• Gestão de produtos e estoque</li>
            <li>• Processamento de pedidos</li>
            <li>• Configurações da loja</li>
            <li>• Relatórios e financeiro</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => navigate("/admin/planos")}
            className="h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-amber-200/50 transition-all"
          >
            <Crown className="w-4 h-4 mr-2" />
            Regularizar Assinatura
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/assinatura")}
            className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Ver detalhes
          </Button>
        </div>

        <p className="text-[11px] text-slate-400">
          Após o pagamento, o sistema será reativado automaticamente.
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Compact top banner shown inside AdminLayout when suspended
 */
export function SystemSuspendedTopBanner() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/60 px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <p className="text-xs font-medium text-amber-800 truncate">
          <span className="font-bold">Assinatura suspensa</span>
          <span className="hidden sm:inline"> — regularize para desbloquear todas as funcionalidades</span>
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/admin/planos")}
        className="h-7 px-3 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white flex-shrink-0"
      >
        <Crown className="w-3 h-3 mr-1" />
        Regularizar
      </Button>
    </motion.div>
  );
}

/**
 * @deprecated Use SystemSuspendedFullPage or SystemSuspendedTopBanner instead
 */
export function SystemSuspendedBanner() {
  return <SystemSuspendedFullPage />;
}
