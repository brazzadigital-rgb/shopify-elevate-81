import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Zap } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export function StoreFooter() {
  const { getSetting } = useStoreSettings();
  const storeName = getSetting("store_name", "SPORT STORE");

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-20" />
      
      <div className="container py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-orange">
                <span className="text-lg">🐆</span>
              </div>
              <span className="font-display text-xl font-bold uppercase">{storeName}</span>
            </div>
            <p className="text-primary-foreground/40 font-sans text-sm leading-relaxed">
              Performance, estilo e confiança. A melhor experiência de compra esportiva.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="w-10 h-10 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:glow-orange transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Institucional",
              links: [
                { label: "Sobre nós", to: "/sobre" },
                { label: "Contato", to: "/contato" },
                { label: "FAQ", to: "/faq" },
              ],
            },
            {
              title: "Políticas",
              links: [
                { label: "Privacidade", to: "/politicas" },
                { label: "Trocas e Devoluções", to: "/politicas" },
                { label: "Termos de Uso", to: "/politicas" },
              ],
            },
            {
              title: "Minha Conta",
              links: [
                { label: "Meus Pedidos", to: "/conta/pedidos" },
                { label: "Favoritos", to: "/conta/favoritos" },
                { label: "Endereços", to: "/conta/enderecos" },
                { label: "Entrar", to: "/auth" },
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-display text-sm font-bold mb-4 text-primary-foreground/70 uppercase tracking-wider">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="font-sans text-sm text-primary-foreground/40 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10 relative z-10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            {["Visa", "Master", "Pix", "Boleto"].map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/40 text-[10px] font-sans font-bold uppercase"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
