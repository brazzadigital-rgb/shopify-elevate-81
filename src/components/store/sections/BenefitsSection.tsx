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
    <section className="py-10 md:py-14 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-mesh opacity-30" />
      
      <div className="container relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((b, i) => {
            const Icon = iconMap[b.icon] || Shield;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 group-hover:glow-orange transition-all duration-300 group-hover:bg-accent/20">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <p className="font-display text-sm font-bold uppercase tracking-wide">{b.title}</p>
                <p className="font-sans text-xs text-primary-foreground/50 mt-0.5">{b.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
