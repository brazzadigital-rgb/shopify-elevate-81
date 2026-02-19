import { motion } from "framer-motion";
import { Truck, Shield, CreditCard, Percent, RotateCcw, Headphones, Zap } from "lucide-react";

const iconMap: Record<string, any> = {
  truck: Truck, shield: Shield, "credit-card": CreditCard,
  percent: Percent, "rotate-ccw": RotateCcw, headphones: Headphones, zap: Zap,
};

interface BenefitsSectionProps {
  config: {
    items?: { icon: string; title: string; text: string }[];
  };
}

export function BenefitsSection({ config }: BenefitsSectionProps) {
  const items = config.items || [
    { icon: "truck", title: "Entrega Rápida", text: "Em todo o Brasil" },
    { icon: "shield", title: "Compra Segura", text: "Ambiente protegido" },
    { icon: "headphones", title: "Suporte Premium", text: "Atendimento 24h" },
    { icon: "percent", title: "5% OFF no Pix", text: "Desconto à vista" },
  ];

  return (
    <section className="py-10 md:py-14 bg-[hsl(30,12%,96%)] relative overflow-hidden">
      {/* Subtle decorative line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[hsl(30,30%,80%)] to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[hsl(30,30%,80%)] to-transparent" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((b, i) => {
            const Icon = iconMap[b.icon] || Shield;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center text-center group py-5 px-3 md:py-6 md:px-4 rounded-2xl bg-white/60 border border-foreground/[0.05] hover:border-[hsl(30,30%,80%)] hover:shadow-[0_4px_20px_rgba(180,150,120,0.1)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[hsl(30,20%,92%)] border border-[hsl(30,25%,86%)] flex items-center justify-center mb-3 group-hover:bg-[hsl(30,25%,88%)] group-hover:border-[hsl(30,30%,78%)] group-hover:shadow-[0_0_16px_rgba(180,150,120,0.2)] transition-all duration-300">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-[hsl(30,25%,40%)]" />
                </div>
                <p className="font-sans text-xs md:text-sm font-bold uppercase tracking-wider text-foreground/80">
                  {b.title}
                </p>
                <p className="font-sans text-[11px] md:text-xs text-foreground/45 mt-1">
                  {b.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
