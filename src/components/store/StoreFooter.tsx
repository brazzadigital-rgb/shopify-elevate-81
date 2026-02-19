import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone, ChevronRight } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const linkGroups = [
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
];

const socials = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Twitter, label: "Twitter" },
];

const payments = ["Visa", "Master", "Elo", "Pix", "Boleto"];

export function StoreFooter() {
  const { getSetting } = useStoreSettings();
  const storeName = getSetting("store_name", "SPORT STORE");
  const logoUrl = getSetting("logo_url", "");

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="container px-4 md:px-6 pt-10 pb-8 md:pt-16 md:pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          {/* Brand block */}
          <div className="md:col-span-4 lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-8 object-contain brightness-0 invert" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-orange">
                    <span className="text-lg">🐆</span>
                  </div>
                  <span className="font-display text-xl font-bold uppercase">{storeName}</span>
                </>
              )}
            </div>
            <p className="text-primary-foreground/50 font-sans text-sm leading-relaxed max-w-xs">
              Performance, estilo e confiança. A melhor experiência de compra esportiva do Brasil.
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5 mt-6">
              {socials.map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Contact info — only desktop */}
            <div className="hidden md:flex flex-col gap-2 mt-6 text-primary-foreground/40 text-xs font-sans">
              <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contato@sportstore.com</span>
              <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> (11) 99999-9999</span>
              <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> São Paulo, SP</span>
            </div>
          </div>

          {/* Link groups — mobile: accordion style, desktop: columns */}
          <div className="md:col-span-8 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8">
            {linkGroups.map((group) => (
              <div key={group.title} className="border-b border-primary-foreground/8 sm:border-b-0 py-3 sm:py-0">
                <h4 className="font-display text-xs font-bold mb-0 sm:mb-4 text-primary-foreground/60 uppercase tracking-widest">
                  {group.title}
                </h4>
                <ul className="mt-2 sm:mt-0 space-y-0 sm:space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group flex items-center justify-between sm:justify-start py-2 sm:py-0 font-sans text-sm text-primary-foreground/45 hover:text-accent transition-colors"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-primary-foreground/20 sm:hidden group-hover:text-accent transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/8 relative z-10">
        <div className="container px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[11px] text-primary-foreground/30 text-center sm:text-left">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {payments.map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 rounded-md bg-primary-foreground/5 border border-primary-foreground/8 text-primary-foreground/40 text-[10px] font-sans font-bold uppercase tracking-wide"
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
