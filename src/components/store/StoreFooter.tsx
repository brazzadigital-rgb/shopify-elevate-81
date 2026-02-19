import { useState, useRef } from "react";
import footerBg from "@/assets/footer-jewelry-bg.jpg";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Instagram, Facebook, Twitter, Mail, Phone, MapPin,
  ChevronDown, Shield, Truck, RefreshCw, Send, Clock,
  MessageCircle,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

/* ─── Trust cards data ─── */
const trustCards = [
  { icon: Shield, title: "Compra Segura", text: "Pagamento 100% protegido" },
  { icon: Truck, title: "Envio Rastreado", text: "Acompanhe cada etapa" },
  { icon: RefreshCw, title: "Troca & Garantia", text: "30 dias para devolução" },
];

/* ─── Link groups ─── */
const institutionalLinks = [
  { label: "Sobre nós", to: "/sobre" },
  { label: "Contato", to: "/contato" },
  { label: "Trocas e Devoluções", to: "/politicas" },
  { label: "Política de Privacidade", to: "/politicas" },
  { label: "Termos de Uso", to: "/politicas" },
];

const serviceLinks = [
  { label: "WhatsApp", to: "#", icon: MessageCircle, external: true },
  { label: "contato@joalheria.com", to: "mailto:contato@joalheria.com", icon: Mail, external: true },
  { label: "Seg–Sex, 9h–18h", to: "#", icon: Clock, isText: true },
  { label: "Rastrear Pedido", to: "/rastreamento", icon: Truck },
];

const socials = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Twitter, label: "Twitter" },
];

const payments = ["Visa", "Master", "Elo", "Pix", "Boleto"];

/* ─── Accordion for mobile ─── */
function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-foreground/[0.08]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-foreground/70">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-foreground/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Newsletter inline ─── */
function FooterNewsletter({ isMobile }: { isMobile: boolean }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({ title: "Cadastro realizado!", description: "Você receberá nossas novidades em breve." });
      setEmail("");
    }
  };

  return (
    <div>
      <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-foreground/70 mb-4">
        Receba Novidades
      </h4>
      <p className="font-sans text-[13px] text-foreground/55 mb-4 leading-relaxed">
        Cadastre-se e ganhe 10% de desconto na primeira compra.
      </p>
      <form onSubmit={handleSubmit} className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor email"
          required
          className="flex-1 h-11 px-4 rounded-lg bg-white border border-foreground/[0.12] text-foreground text-sm font-sans placeholder:text-foreground/35 focus:outline-none focus:border-[hsl(30,30%,60%)] focus:ring-1 focus:ring-[hsl(30,30%,60%)]/30 shadow-sm transition-all"
        />
        <button
          type="submit"
          className="h-11 px-6 rounded-lg bg-foreground/[0.08] border border-foreground/[0.12] text-foreground/70 text-xs font-sans font-bold uppercase tracking-wider hover:bg-foreground/14 active:scale-[0.98] shadow-sm transition-all"
        >
          <Send className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Assinar
        </button>
      </form>
      <p className="font-sans text-[10px] text-foreground/35 mt-2.5">Sem spam. Cancele quando quiser.</p>
    </div>
  );
}

/* ─── Main Footer ─── */
export function StoreFooter() {
  const { getSetting } = useStoreSettings();
  const storeName = getSetting("store_name", "Joalheria");
  const logoUrl = getSetting("logo_url", "");
  const isMobile = useIsMobile();

  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-60px" });

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer ref={footerRef} className="relative">
      {/* ═══════ LEVEL 1 — Trust Bar ═══════ */}
      <div className="bg-[hsl(30,12%,95%)] border-y border-foreground/[0.07]">
        <div className="container px-4 md:px-6">
          {/* Desktop: 3 cards inline */}
          <div className="hidden md:grid md:grid-cols-3 divide-x divide-foreground/[0.07]">
            {trustCards.map((card, i) => (
              <motion.div
                key={card.title}
                variants={fadeUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4 py-6 px-8 group cursor-default hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className="w-11 h-11 rounded-full bg-[hsl(30,20%,88%)] flex items-center justify-center shrink-0 group-hover:bg-[hsl(30,25%,83%)] transition-colors shadow-sm">
                  <card.icon className="w-5 h-5 text-[hsl(30,25%,35%)]" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-foreground/80">{card.title}</p>
                  <p className="font-sans text-xs text-foreground/50">{card.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory py-4 -mx-4 px-4 no-scrollbar">
            {trustCards.map((card) => (
              <div
                key={card.title}
                className="flex items-center gap-3 bg-white rounded-xl border border-foreground/[0.08] px-4 py-3.5 snap-center shrink-0 min-w-[210px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div className="w-9 h-9 rounded-full bg-[hsl(30,20%,89%)] flex items-center justify-center shrink-0">
                  <card.icon className="w-4 h-4 text-[hsl(30,25%,35%)]" />
                </div>
                <div>
                  <p className="font-sans text-xs font-bold text-foreground/80">{card.title}</p>
                  <p className="font-sans text-[10px] text-foreground/50">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ LEVEL 2 — Main Footer ═══════ */}
      <div className="bg-[hsl(30,8%,96%)] relative overflow-hidden">
        {/* Decorative jewelry background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${footerBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.06,
          }}
        />
        <div className="container px-4 md:px-6 pt-10 pb-8 md:pt-14 md:pb-10">
          {/* ── DESKTOP: 4 columns ── */}
          <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12">
            {/* Col 1 — Brand */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="col-span-3"
            >
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-14 object-contain" />
                ) : (
                  <span className="font-display text-lg font-bold uppercase tracking-wide text-foreground/85">
                    {storeName}
                  </span>
                )}
              </div>
              <p className="font-sans text-[13px] text-foreground/55 leading-relaxed mb-6 max-w-[220px]">
                Joias que contam histórias. Elegância e sofisticação em cada detalhe.
              </p>
              <div className="flex gap-2.5">
                {socials.map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-full border border-foreground/[0.12] flex items-center justify-center text-foreground/50 hover:text-[hsl(30,30%,40%)] hover:border-[hsl(30,30%,70%)] hover:bg-[hsl(30,25%,93%)] hover:scale-105 shadow-sm transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-1.5 flex-wrap">
                {payments.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded border border-foreground/[0.1] bg-white/60 text-foreground/45 text-[9px] font-sans font-bold uppercase tracking-wide shadow-sm"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Col 2 — Institucional */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="col-span-3"
            >
              <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-foreground/70 mb-5">
                Institucional
              </h4>
              <ul className="space-y-3">
                {institutionalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="font-sans text-[13px] text-foreground/55 hover:text-foreground/85 relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-px after:bottom-0 after:left-0 after:bg-[hsl(30,30%,60%)] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Col 3 — Atendimento */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="col-span-3"
            >
              <h4 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-foreground/70 mb-5">
                Atendimento
              </h4>
              <ul className="space-y-3">
                {serviceLinks.map((link) => {
                  const content = (
                    <span className="flex items-center gap-2.5 font-sans text-[13px] text-foreground/55 hover:text-foreground/85 transition-colors">
                      {link.icon && <link.icon className="w-4 h-4 shrink-0 text-foreground/40" />}
                      {link.label}
                    </span>
                  );
                  if (link.isText) return <li key={link.label}><span className="flex items-center gap-2.5 font-sans text-[13px] text-foreground/55"><link.icon className="w-4 h-4 shrink-0 text-foreground/40" />{link.label}</span></li>;
                  if (link.external) return <li key={link.label}><a href={link.to} target="_blank" rel="noopener noreferrer">{content}</a></li>;
                  return <li key={link.label}><Link to={link.to}>{content}</Link></li>;
                })}
              </ul>
            </motion.div>

            {/* Col 4 — Newsletter */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="col-span-3"
            >
              <FooterNewsletter isMobile={false} />
            </motion.div>
          </div>

          {/* ── MOBILE: logo + socials + accordions ── */}
          <div className="md:hidden">
            {/* Brand */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-12 object-contain" />
                ) : (
                  <span className="font-display text-lg font-bold uppercase tracking-wide text-foreground/85">
                    {storeName}
                  </span>
                )}
              </div>
              <p className="font-sans text-sm text-foreground/55 max-w-[260px] mx-auto leading-relaxed">
                Joias que contam histórias. Elegância e sofisticação em cada detalhe.
              </p>
              <div className="flex gap-2.5 justify-center mt-4">
                {socials.map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-10 h-10 rounded-full border border-foreground/[0.12] flex items-center justify-center text-foreground/50 hover:text-[hsl(30,30%,40%)] hover:border-[hsl(30,30%,70%)] shadow-sm transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Accordions */}
            <FooterAccordion title="Institucional">
              <ul className="space-y-1">
                {institutionalLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="block py-2 font-sans text-sm text-foreground/60 hover:text-foreground/85 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterAccordion>

            <FooterAccordion title="Atendimento">
              <ul className="space-y-1">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    {link.isText ? (
                      <span className="flex items-center gap-2 py-2 font-sans text-sm text-foreground/60">
                        {link.icon && <link.icon className="w-4 h-4 text-foreground/40" />}
                        {link.label}
                      </span>
                    ) : link.external ? (
                      <a href={link.to} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 font-sans text-sm text-foreground/60 hover:text-foreground/85 transition-colors">
                        {link.icon && <link.icon className="w-4 h-4 text-foreground/40" />}
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="flex items-center gap-2 py-2 font-sans text-sm text-foreground/60 hover:text-foreground/85 transition-colors">
                        {link.icon && <link.icon className="w-4 h-4 text-foreground/40" />}
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </FooterAccordion>

            <FooterAccordion title="Newsletter">
              <FooterNewsletter isMobile={true} />
            </FooterAccordion>

            {/* Mobile payment badges */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center mt-6">
              {payments.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded border border-foreground/[0.1] bg-white/60 text-foreground/50 text-[10px] font-sans font-bold uppercase tracking-wide shadow-sm"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ BOTTOM BAR ═══════ */}
      <div className="bg-[hsl(30,6%,92%)] border-t border-foreground/[0.07]">
        <div className="container px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-[11px] text-foreground/40 text-center sm:text-left">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-sans text-foreground/40">
            <Link to="/politicas" className="hover:text-foreground/65 transition-colors">Privacidade</Link>
            <span className="text-foreground/15">|</span>
            <Link to="/politicas" className="hover:text-foreground/65 transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
