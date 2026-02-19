import { Link } from "react-router-dom";
import promoRastreio from "@/assets/promo-rastreio.png";
import promoCartao from "@/assets/promo-cartao.png";
import promoRedes from "@/assets/promo-redes.png";

const panels = [
  { src: promoRastreio, alt: "Rastreie seu pedido", link: "/rastreamento" },
  { src: promoCartao, alt: "Pague pelo cartão com segurança", link: null },
  { src: promoRedes, alt: "Siga nossas redes sociais", link: null },
] as const;

function PromoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative group rounded-2xl p-[2px] overflow-hidden hover:-translate-y-1 transition-transform duration-300">
      <div
        className="absolute inset-0 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "conic-gradient(from var(--border-angle, 0deg), hsl(var(--accent)), hsl(var(--primary)), hsl(var(--accent)), hsl(var(--muted)), hsl(var(--accent)))",
          animation: "spin-border 4s linear infinite",
        }}
      />
      <div className="relative rounded-[14px] overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function PromoTriplePanel() {
  return (
    <section className="container px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((p, i) => {
          const card = <PromoCard src={p.src} alt={p.alt} />;
          return p.link ? (
            <Link key={i} to={p.link}>{card}</Link>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}

export default PromoTriplePanel;
