import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Shield, Pencil, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MODULES = [
  "Produtos", "Pedidos", "Clientes", "Financeiro", "Relatórios",
  "Cupons", "Configurações", "Fornecedores", "Comissões",
];

const PERMS = ["can_view", "can_create", "can_edit", "can_delete", "can_export"] as const;
const PERM_LABELS: Record<string, string> = { can_view: "Ver", can_create: "Criar", can_edit: "Editar", can_delete: "Excluir", can_export: "Exportar" };

interface Role { id: string; name: string; description: string | null; is_system: boolean; }
interface RolePerm { id: string; role_id: string; module: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean; can_export: boolean; }

export default function AdminRoles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_roles").select("*").order("created_at");
      if (error) throw error;
      return data as Role[];
    },
  });

  const { data: rolePerms = [] } = useQuery({
    queryKey: ["admin-role-perms", selectedRole?.id],
    enabled: !!selectedRole,
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("*").eq("role_id", selectedRole!.id);
      if (error) throw error;
      // Build perms map
      const map: Record<string, Record<string, boolean>> = {};
      MODULES.forEach(m => { map[m] = { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false }; });
      (data as RolePerm[]).forEach(p => { if (map[p.module]) { PERMS.forEach(k => { map[p.module][k] = p[k]; }); } });
      setPerms(map);
      return data as RolePerm[];
    },
  });

  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("custom_roles").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_roles").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      setDialogOpen(false);
      toast({ title: "Função salva" });
    },
  });

  const savePermsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRole) return;
      // Delete existing and re-insert
      await supabase.from("role_permissions").delete().eq("role_id", selectedRole.id);
      const rows = MODULES.map(m => ({ role_id: selectedRole.id, module: m, ...perms[m] }));
      const { error } = await supabase.from("role_permissions").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-role-perms"] });
      toast({ title: "Permissões salvas" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      if (selectedRole) setSelectedRole(null);
      toast({ title: "Função removida" });
    },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "" }); setDialogOpen(true); };
  const openEdit = (r: Role) => { setEditing(r); setForm({ name: r.name, description: r.description || "" }); setDialogOpen(true); };

  const togglePerm = (mod: string, perm: string) => {
    setPerms(prev => ({ ...prev, [mod]: { ...prev[mod], [perm]: !prev[mod]?.[perm] } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Funções e Permissões</h1>
          <p className="text-sm text-muted-foreground font-sans">Configure perfis de acesso ao sistema</p>
        </div>
        <Button onClick={openNew} className="bg-accent text-accent-foreground font-sans font-bold rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Nova Função
        </Button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Roles list */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <p className="text-xs font-sans font-bold text-muted-foreground uppercase tracking-wider mb-3">Funções</p>
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-sans transition-colors ${
                selectedRole?.id === r.id ? "bg-accent/10 text-accent font-bold border border-accent/20" : "text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{r.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {r.is_system && <Badge variant="secondary" className="text-[10px]">Sistema</Badge>}
                {!r.is_system && (
                  <>
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={e => { e.stopPropagation(); openEdit(r); }}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={e => { e.stopPropagation(); deleteRoleMutation.mutate(r.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Permissions grid */}
        <div className="bg-card rounded-2xl border border-border p-4">
          {!selectedRole ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Selecione uma função para configurar permissões</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-display font-bold text-lg">Permissões: {selectedRole.name}</p>
                <Button onClick={() => savePermsMutation.mutate()} disabled={savePermsMutation.isPending} className="bg-accent text-accent-foreground font-bold rounded-xl gap-2" size="sm">
                  <Save className="w-4 h-4" /> Salvar
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Módulo</th>
                      {PERMS.map(p => (
                        <th key={p} className="text-center px-3 py-2 font-semibold text-muted-foreground">{PERM_LABELS[p]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => (
                      <tr key={mod} className="border-b border-border/50">
                        <td className="px-3 py-2.5 font-medium">{mod}</td>
                        {PERMS.map(p => (
                          <td key={p} className="text-center px-3 py-2.5">
                            <Checkbox checked={perms[mod]?.[p] || false} onCheckedChange={() => togglePerm(mod, p)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Função" : "Nova Função"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <Button onClick={() => saveRoleMutation.mutate()} disabled={!form.name || saveRoleMutation.isPending} className="bg-accent text-accent-foreground font-bold rounded-xl">
              {saveRoleMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
