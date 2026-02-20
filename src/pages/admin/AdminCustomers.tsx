import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Mail, Phone, ShoppingBag, Eye, Edit3, MessageCircle,
  Crown, UserX, Download, Bell, ChevronDown, Filter, X, ShieldCheck, ShieldOff
} from "lucide-react";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  cpf: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface OrderSummary {
  user_id: string;
  count: number;
  total: number;
  last_date: string | null;
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editDrawer, setEditDrawer] = useState<CustomerProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", cpf: "", is_vip: false });
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Fetch profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomerProfile[];
    },
  });

  // Fetch user roles
  const { data: userRoles = {} } = useQuery({
    queryKey: ["admin-customer-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      const map: Record<string, string[]> = {};
      data?.forEach((r: any) => {
        if (!map[r.user_id]) map[r.user_id] = [];
        map[r.user_id].push(r.role);
      });
      return map;
    },
  });

  // Fetch order summaries
  const { data: orderSummaries = {} } = useQuery({
    queryKey: ["admin-customer-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("user_id, total, created_at");
      const map: Record<string, OrderSummary> = {};
      data?.forEach((o: any) => {
        if (!o.user_id) return;
        if (!map[o.user_id]) map[o.user_id] = { user_id: o.user_id, count: 0, total: 0, last_date: null };
        map[o.user_id].count++;
        map[o.user_id].total += Number(o.total) || 0;
        if (!map[o.user_id].last_date || o.created_at > map[o.user_id].last_date!) {
          map[o.user_id].last_date = o.created_at;
        }
      });
      return map;
    },
  });

  // Fetch emails from auth (via user_roles relation)
  const { data: userEmails = {} } = useQuery({
    queryKey: ["admin-customer-emails"],
    queryFn: async () => {
      // We can't read auth.users directly, so we'll use order emails as fallback
      const { data } = await supabase.from("orders").select("user_id, customer_email").not("customer_email", "is", null);
      const map: Record<string, string> = {};
      data?.forEach((o: any) => {
        if (o.user_id && o.customer_email) map[o.user_id] = o.customer_email;
      });
      return map;
    },
  });

  const isAdmin = (userId: string) => userRoles[userId]?.includes("admin");
  const isVip = (userId: string) => {
    const os = orderSummaries[userId];
    return os && (os.count >= 5 || os.total >= 1000);
  };

  const getStatus = (userId: string) => {
    if (isAdmin(userId)) return "admin";
    if (isVip(userId)) return "vip";
    const os = orderSummaries[userId];
    if (os && os.count > 0) return "ativo";
    return "novo";
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatPhone = (p: string | null) => {
    if (!p) return "—";
    const clean = p.replace(/\D/g, "");
    if (clean.length === 11) return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
    if (clean.length === 10) return `(${clean.slice(0,2)}) ${clean.slice(2,6)}-${clean.slice(6)}`;
    return p;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  // Filter & sort
  const filtered = useMemo(() => {
    let result = profiles.filter(p => {
      const q = search.toLowerCase();
      if (q && !(p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q) || userEmails[p.user_id]?.toLowerCase().includes(q))) return false;
      if (statusFilter === "vip" && !isVip(p.user_id)) return false;
      if (statusFilter === "ativo" && !(orderSummaries[p.user_id]?.count > 0)) return false;
      if (statusFilter === "novo" && orderSummaries[p.user_id]?.count > 0) return false;
      if (statusFilter === "admin" && !isAdmin(p.user_id)) return false;
      return true;
    });
    result.sort((a, b) => {
      const osA = orderSummaries[a.user_id];
      const osB = orderSummaries[b.user_id];
      if (sortBy === "spent") return (osB?.total || 0) - (osA?.total || 0);
      if (sortBy === "orders") return (osB?.count || 0) - (osA?.count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [profiles, search, statusFilter, sortBy, orderSummaries, userEmails, userRoles]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.user_id)));
  };

  // Edit drawer
  const openEdit = (p: CustomerProfile) => {
    setEditForm({ full_name: p.full_name || "", phone: p.phone || "", cpf: p.cpf || "", is_vip: isVip(p.user_id) });
    setEditDrawer(p);
  };

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editDrawer) return;
      const { error } = await supabase.from("profiles").update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        cpf: editForm.cpf,
      }).eq("user_id", editDrawer.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      toast({ title: "Cliente atualizado com sucesso" });
      setEditDrawer(null);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Toggle admin
  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (isAdmin(userId)) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customer-roles"] });
      toast({ title: "Papel atualizado" });
    },
  });

  // Bulk export CSV
  const exportCSV = () => {
    const rows = filtered.filter(p => selected.has(p.user_id));
    if (rows.length === 0) return;
    const header = "Nome,Email,Telefone,Pedidos,Total Gasto,Cadastro\n";
    const csv = header + rows.map(p => {
      const os = orderSummaries[p.user_id];
      return `"${p.full_name || ""}","${userEmails[p.user_id] || ""}","${p.phone || ""}",${os?.count || 0},${os?.total?.toFixed(2) || "0"},${new Date(p.created_at).toLocaleDateString("pt-BR")}`;
    }).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} clientes exportados` });
  };

  const whatsappUrl = (phone: string | null, name: string | null) => {
    if (!phone) return "#";
    const clean = phone.replace(/\D/g, "");
    const number = clean.startsWith("55") ? clean : `55${clean}`;
    const msg = encodeURIComponent(`Olá ${name || ""}! 😊 Posso te ajudar com algo?`);
    return `https://wa.me/${number}?text=${msg}`;
  };

  const StatusPill = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      vip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      novo: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = { vip: "VIP", admin: "Admin", ativo: "Ativo", novo: "Novo" };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${styles[status] || styles.novo}`}>
        {status === "vip" && <Crown className="w-3 h-3" />}
        {labels[status] || status}
      </span>
    );
  };

  // KPIs
  const totalCustomers = profiles.length;
  const totalWithOrders = Object.keys(orderSummaries).length;
  const totalRevenue = Object.values(orderSummaries).reduce((s, o) => s + o.total, 0);
  const avgTicket = totalWithOrders > 0 ? totalRevenue / Object.values(orderSummaries).reduce((s, o) => s + o.count, 0) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{totalCustomers} clientes cadastrados</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clientes", value: totalCustomers, icon: Users },
          { label: "Com Pedidos", value: totalWithOrders, icon: ShoppingBag },
          { label: "Receita Total", value: formatCurrency(totalRevenue), icon: Crown },
          { label: "Ticket Médio", value: formatCurrency(avgTicket), icon: ShoppingBag },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="admin-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <kpi.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">{kpi.label}</p>
              <p className="text-lg font-bold truncate">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, email, telefone..." className="pl-10 rounded-xl border-0 bg-muted/30 h-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 rounded-xl border-0 bg-muted/30 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="novo">Novos</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 rounded-xl border-0 bg-muted/30 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recente</SelectItem>
              <SelectItem value="spent">Maior gasto</SelectItem>
              <SelectItem value="orders">Mais pedidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="admin-card p-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg text-xs ml-auto" onClick={() => setSelected(new Set())}>
              <X className="w-3.5 h-3.5" /> Limpar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table / Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 w-10">
                      <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} className="min-h-0 min-w-0" />
                    </th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hidden xl:table-cell">Email</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Telefone</th>
                    <th className="text-right px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Pedidos</th>
                    <th className="text-right px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Gasto</th>
                    <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-3 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const os = orderSummaries[p.user_id];
                    const status = getStatus(p.user_id);
                    const email = userEmails[p.user_id] || "";
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3">
                          <Checkbox checked={selected.has(p.user_id)} onCheckedChange={() => toggleSelect(p.user_id)} className="min-h-0 min-w-0" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                              {p.avatar_url ? <img src={p.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" /> : getInitials(p.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{p.full_name || "Sem nome"}</p>
                              <p className="text-[11px] text-muted-foreground truncate xl:hidden">{email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-sm hidden xl:table-cell truncate max-w-[200px]">{email || "—"}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground">{formatPhone(p.phone)}</td>
                        <td className="px-3 py-3 text-right font-medium">{os?.count || 0}</td>
                        <td className="px-3 py-3 text-right font-semibold">{formatCurrency(os?.total || 0)}</td>
                        <td className="px-3 py-3 text-center"><StatusPill status={status} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {p.phone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={whatsappUrl(p.phone, p.full_name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors min-h-0 min-w-0">
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>WhatsApp</TooltipContent>
                              </Tooltip>
                            )}
                            {email && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={`mailto:${email}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors min-h-0 min-w-0">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>Email</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => navigate(`/admin/pedidos?cliente=${p.user_id}`)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/50 transition-colors min-h-0 min-w-0">
                                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Pedidos</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => openEdit(p)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/50 transition-colors min-h-0 min-w-0">
                                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => navigate(`/admin/clientes/${p.user_id}`)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 transition-colors min-h-0 min-w-0">
                                  <Eye className="w-4 h-4 text-primary" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Ver perfil</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-border/50">
              {filtered.map((p) => {
                const os = orderSummaries[p.user_id];
                const status = getStatus(p.user_id);
                const email = userEmails[p.user_id] || "";
                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {p.avatar_url ? <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" /> : getInitials(p.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{p.full_name || "Sem nome"}</p>
                          <StatusPill status={status} />
                        </div>
                        {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
                        <p className="text-xs text-muted-foreground">{formatPhone(p.phone)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Pedidos: <strong className="text-foreground">{os?.count || 0}</strong></span>
                      <span>Total: <strong className="text-foreground">{formatCurrency(os?.total || 0)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.phone && (
                        <a href={whatsappUrl(p.phone, p.full_name)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium min-h-0">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {email && (
                        <a href={`mailto:${email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium min-h-0">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium min-h-0">
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => navigate(`/admin/clientes/${p.user_id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium min-h-0 ml-auto">
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Edit Drawer */}
      <Sheet open={!!editDrawer} onOpenChange={open => !open && setEditDrawer(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">Editar Cliente</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {getInitials(editDrawer?.full_name || null)}
              </div>
              <div>
                <p className="font-medium">{editDrawer?.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">Desde {editDrawer ? new Date(editDrawer.created_at).toLocaleDateString("pt-BR") : ""}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome completo</Label>
                <Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1.5 rounded-xl border-0 bg-muted/30" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="mt-1.5 rounded-xl border-0 bg-muted/30" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPF</Label>
                <Input value={editForm.cpf} onChange={e => setEditForm(p => ({ ...p, cpf: e.target.value }))} className="mt-1.5 rounded-xl border-0 bg-muted/30" placeholder="000.000.000-00" />
              </div>
              {editDrawer && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Administrador</span>
                  </div>
                  <PremiumToggle3D checked={isAdmin(editDrawer.user_id)} onCheckedChange={() => toggleAdminMutation.mutate(editDrawer.user_id)} size="sm" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditDrawer(null)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl" onClick={() => saveEditMutation.mutate()} disabled={saveEditMutation.isPending}>
                {saveEditMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
