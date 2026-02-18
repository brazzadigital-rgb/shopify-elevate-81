import { Link } from "react-router-dom";
import { ShoppingBag, Instagram, Facebook, Twitter } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export function StoreFooter() {
  const { getSetting } = useStoreSettings();
  const storeName = getSetting("store_name", "Premium Store");

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display text-lg font-bold">{storeName}</span>
            </div>
            <p className="text-primary-foreground/50 font-sans text-sm leading-relaxed">
              Produtos premium selecionados com curadoria exclusiva para você.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-200"
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
                { label: "Blog", to: "/blog" },
                { label: "FAQ", to: "/faq" },
              ],
            },
            {
              title: "Políticas",
              links: [
                { label: "Privacidade", to: "/politicas/privacidade" },
                { label: "Trocas e Devoluções", to: "/politicas/trocas" },
                { label: "Frete", to: "/politicas/frete" },
                { label: "Termos de Uso", to: "/politicas/termos" },
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
              <h4 className="font-sans text-sm font-semibold mb-4 text-primary-foreground/80 uppercase tracking-wider">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-sans text-sm text-primary-foreground/50 hover:text-accent transition-colors"
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
      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            {["Visa", "Master", "Pix", "Boleto"].map((m) => (
              <span
                key={m}
                className="px-2 py-1 rounded-md bg-primary-foreground/10 text-primary-foreground/50 text-[10px] font-sans font-medium"
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
