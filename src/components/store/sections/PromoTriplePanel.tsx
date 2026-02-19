import { Link } from "react-router-dom";
import promoRastreio from "@/assets/promo-rastreio.png";
import promoCartao from "@/assets/promo-cartao.png";
import promoRedes from "@/assets/promo-redes.png";

const panels = [
  { src: promoRastreio, alt: "Rastreie seu pedido", link: "/rastreamento" },
  { src: promoCartao, alt: "Pague pelo cartão com segurança", link: null },
  { src: promoRedes, alt: "Siga nossas redes sociais", link: null },
];

export default function PromoTriplePanel() {
  return (
    <section className="container px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((p, i) => {
          const content = (
            <div className="rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <img
                src={p.src}
                alt={p.alt}
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          );

          return p.link ? (
            <Link key={i} to={p.link}>{content}</Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
