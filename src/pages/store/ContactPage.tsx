import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export default function ContactPage() {
  const { getSetting } = useStoreSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "Mensagem enviada! ✉️", description: "Responderemos em breve." });
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <div className="container py-10 min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold mb-2">Contato</h1>
      <p className="text-muted-foreground font-sans mb-10">Estamos aqui para ajudar</p>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label className="font-sans text-sm font-medium">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" placeholder="Seu nome" />
            </div>
            <div className="grid gap-2">
              <Label className="font-sans text-sm font-medium">E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" placeholder="seu@email.com" />
            </div>
            <div className="grid gap-2">
              <Label className="font-sans text-sm font-medium">Mensagem</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="rounded-xl" placeholder="Como podemos ajudar?" />
            </div>
            <Button type="submit" disabled={sending} className="h-11 rounded-xl shine font-sans gap-2 w-full">
              <Send className="w-4 h-4" /> {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <Card className="shadow-premium border-0">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-sans font-medium text-sm">E-mail</p>
                  <p className="font-sans text-sm text-muted-foreground">contato@minhalojaonline.com.br</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-sans font-medium text-sm">WhatsApp</p>
                  <p className="font-sans text-sm text-muted-foreground">
                    {getSetting("whatsapp_number", "(11) 99999-9999")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-sans font-medium text-sm">Endereço</p>
                  <p className="font-sans text-sm text-muted-foreground">São Paulo, SP - Brasil</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium border-0">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-base mb-2">Horário de Atendimento</h3>
              <div className="space-y-1 text-sm font-sans text-muted-foreground">
                <p>Segunda a Sexta: 9h às 18h</p>
                <p>Sábado: 9h às 13h</p>
                <p>Domingo e Feriados: Fechado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
