import { motion } from "framer-motion";
import { Truck, Shield, CreditCard, Percent, RotateCcw, Headphones } from "lucide-react";

const iconMap: Record<string, any> = {
  truck: Truck, shield: Shield, "credit-card": CreditCard,
  percent: Percent, "rotate-ccw": RotateCcw, headphones: Headphones,
};

interface BenefitsSectionProps {
  config: {
    items?: { icon: string; title: string; text: string }[];
  };
}

export function BenefitsSection({ config }: BenefitsSectionProps) {
  const items = config.items || [
    { icon: "truck", title: "Frete Grátis", text: "Acima de R$ 199" },
    { icon: "shield", title: "Compra Segura", text: "Ambiente protegido" },
    { icon: "credit-card", title: "Parcele em 12x", text: "Sem juros" },
    { icon: "percent", title: "5% OFF no Pix", text: "Desconto à vista" },
  ];

  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((b, i) => {
            const Icon = iconMap[b.icon] || Shield;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-background shadow-premium flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <p className="font-sans font-semibold text-sm">{b.title}</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">{b.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
