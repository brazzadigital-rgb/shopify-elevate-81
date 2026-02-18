import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NewsletterSectionProps {
  config: {
    title?: string;
    subtitle?: string;
  };
}

export function NewsletterSection({ config }: NewsletterSectionProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({ title: "Cadastro realizado!", description: "Você receberá nossas novidades." });
      setEmail("");
    }
  };

  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            {config.title || "Receba nossas novidades"}
          </h2>
          <p className="text-primary-foreground/50 font-sans text-sm mb-8">
            {config.subtitle || "Cadastre-se e ganhe 10% de desconto na primeira compra"}
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 font-sans flex-1"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shine h-12 px-6 font-sans shrink-0"
            >
              <Send className="w-4 h-4 mr-2" /> Cadastrar
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
