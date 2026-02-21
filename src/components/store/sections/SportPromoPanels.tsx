import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Instagram, MapPin } from "lucide-react";
import mascotImg from "@/assets/mascot-sport.png";

const panels = [
  {
    title: "ACESSÓRIOS CERTOS",
    subtitle: "TREINO SEM LIMITES",
    cta: "APROVEITE!",
    link: "/produtos",
    gradient: "from-black via-gray-900 to-black",
    icon: ArrowRight,
  },
  {
    title: "SIGA-NOS NAS",
    subtitle: "REDES SOCIAIS",
    cta: "SEGUIR!",
    link: "#",
    gradient: "from-sport-orange/90 via-sport-orange to-red-600",
    icon: Instagram,
  },
  {
    title: "RASTREIE SEU",
    subtitle: "PEDIDO",
    cta: "RASTREAR!",
    link: "/rastreamento",
    gradient: "from-sport-charcoal via-gray-800 to-black",
    icon: MapPin,
  },
];

export function SportPromoPanels() {
  return (
    <section className="container px-4 py-10 md:py-14">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((panel, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link to={panel.link} className="block group">
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${panel.gradient} p-6 min-h-[200px] flex flex-col justify-between border border-white/10 sport-card-glow`}
              >
                {/* Mascot bg */}
                <img
                  src={mascotImg}
                  alt=""
                  className="absolute right-0 bottom-0 h-[160px] opacity-20 group-hover:opacity-30 transition-opacity"
                />

                <div className="relative z-10">
                  <h3 className="font-display text-lg font-black text-white leading-tight">
                    {panel.title}
                  </h3>
                  <p className="font-display text-xl font-black text-accent italic">
                    {panel.subtitle}
                  </p>
                </div>

                <div className="relative z-10 mt-4">
                  <span className="inline-flex items-center gap-2 btn-neon px-5 py-2.5 rounded-lg text-white text-xs">
                    {panel.cta}
                    <panel.icon className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
