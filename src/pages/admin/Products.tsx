import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Filter, Upload, Download, Loader2, CheckCircle, AlertCircle, MoreVertical, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/exportCsv";
import { motion } from "framer-motion";

interface Supplier { id: string; trade_name: string; }

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  sold_count: number;
  created_at: string;
  supplier_id: string | null;
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [productThumbnails, setProductThumbnails] = useState<Record<string, string>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number; errors: number; details: Array<{ name: string; status: string; error?: string }> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.trade_name]));

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, trade_name").eq("status", "active").order("trade_name");
    setSuppliers((data as Supplier[]) || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    const { data: imgs } = await supabase.from("product_images").select("product_id, url").eq("is_primary", true);
    const thumbs: Record<string, string> = {};
    imgs?.forEach((img: any) => { thumbs[img.product_id] = img.url; });
    setProductThumbnails(thumbs);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); fetchSuppliers(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    else { toast({ title: "Produto removido" }); fetchProducts(); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResults(null);
    try {
      const csvText = await importFile.text();
      const { data, error } = await supabase.functions.invoke("import-products", { body: { csv: csvText } });
      if (error) throw error;
      setImportResults({ imported: data.imported, errors: data.errors, details: data.details || [] });
      toast({ title: "Importação concluída!", description: `${data.imported} produtos importados, ${data.errors} erros.` });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data: allProducts } = await supabase.from("products").select("*").order("name");
      const { data: allImages } = await supabase.from("product_images").select("product_id, url, is_primary, sort_order");
      const { data: allVariants } = await supabase.from("product_variants").select("product_id, name, price, sku, stock, compare_at_price");

      if (!allProducts?.length) {
        toast({ title: "Nenhum produto para exportar", variant: "destructive" });
        return;
      }

      const imagesByProduct: Record<string, any[]> = {};
      allImages?.forEach((img: any) => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });

      const variantsByProduct: Record<string, any[]> = {};
      allVariants?.forEach((v: any) => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      });

      const headers = ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published", "Variant SKU", "Variant Price", "Variant Compare At Price", "Variant Inventory Qty", "Image Src", "Image Position", "Status"];
      const rows: string[][] = [];

      allProducts.forEach((p: any) => {
        const images = (imagesByProduct[p.id] || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
        const variants = variantsByProduct[p.id] || [];
        const maxRows = Math.max(1, images.length, variants.length);

        for (let i = 0; i < maxRows; i++) {
          const row: string[] = [];
          if (i === 0) {
            row.push(p.slug, p.name, p.description || "", p.brand || "", p.product_type || "", (p.tags || []).join(", "), p.is_active ? "true" : "false");
          } else {
            row.push("", "", "", "", "", "", "");
          }
          const v = variants[i];
          row.push(v?.sku || p.sku || "", v?.price?.toString() || (i === 0 ? p.price?.toString() : ""), v?.compare_at_price?.toString() || (i === 0 ? p.compare_at_price?.toString() || "" : ""), v?.stock?.toString() || (i === 0 ? p.stock?.toString() : ""));
          const img = images[i];
          row.push(img?.url || "", img ? (i + 1).toString() : "", i === 0 ? (p.is_active ? "active" : "draft") : "");
          rows.push(row);
        }
      });

      const csvContent = [headers, ...rows].map(r => r.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produtos_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exportação concluída!", description: `${allProducts.length} produtos exportados.` });
    } catch (err: any) {
      toast({ title: "Erro ao exportar", description: err.message, variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSupplier = filterSupplier === "all" || (filterSupplier === "none" ? !p.supplier_id : p.supplier_id === filterSupplier);
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary))` }}>
            {filteredProducts.length} produto(s) no catálogo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="admin-card flex items-center gap-2 px-3 py-2.5 text-sm font-medium cursor-pointer hover:shadow-md transition-shadow">
                <MoreVertical className="w-4 h-4" /> Ações
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setImportOpen(true)} className="gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Importar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => navigate("/admin/produtos/novo")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `hsl(var(--admin-text-secondary))` }} />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-9 h-10 rounded-xl border-0 bg-muted/30 focus:bg-muted/50 text-sm"
            />
          </div>
          {suppliers.length > 0 && (
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border-0 bg-muted/30 text-sm">
                <Filter className="w-3.5 h-3.5 mr-2" style={{ color: `hsl(var(--admin-text-secondary))` }} />
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.trade_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="admin-card overflow-hidden"
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-12 h-12 mb-4" style={{ color: `hsl(var(--admin-text-secondary) / 0.3)` }} />
            <p className="text-base font-medium" style={{ color: `hsl(var(--admin-text-secondary))` }}>Nenhum produto encontrado</p>
            <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary) / 0.6)` }}>Clique em "Novo Produto" para começar</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderBottom: `1px solid hsl(var(--admin-border))` }}>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-14" style={{ color: `hsl(var(--admin-text-secondary))` }}>Foto</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Nome</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Preço</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right" style={{ color: `hsl(var(--admin-text-secondary))` }}>Estoque</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Status</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right" style={{ color: `hsl(var(--admin-text-secondary))` }}>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, i) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: `1px solid hsl(var(--admin-border-subtle))` }}
                      onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}
                    >
                      <TableCell className="py-3">
                        {productThumbnails[product.id] ? (
                          <img src={productThumbnails[product.id]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid hsl(var(--admin-border))` }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>{product.sku || "—"}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm font-semibold">{formatBRL(Number(product.price))}</p>
                        {product.compare_at_price && (
                          <p className="text-[11px] line-through" style={{ color: `hsl(var(--admin-text-secondary))` }}>{formatBRL(Number(product.compare_at_price))}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className={`text-sm font-medium ${product.stock < 5 ? "text-destructive" : ""}`}>{product.stock}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`admin-status-pill text-[10px] ${product.is_active ? "admin-status-success" : "admin-status-danger"}`}>
                            {product.is_active ? "Ativo" : "Inativo"}
                          </span>
                          {product.is_featured && <span className="admin-status-pill admin-status-info text-[10px]">Destaque</span>}
                          {product.is_new && <span className="admin-status-pill admin-status-success text-[10px]">Novo</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y" style={{ borderColor: `hsl(var(--admin-border-subtle))` }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}
                >
                  {productThumbnails[product.id] ? (
                    <img src={productThumbnails[product.id]} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid hsl(var(--admin-border))` }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold">{formatBRL(Number(product.price))}</span>
                      <span className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>· {product.stock} un.</span>
                    </div>
                  </div>
                  <span className={`admin-status-pill text-[10px] flex-shrink-0 ${product.is_active ? "admin-status-success" : "admin-status-danger"}`}>
                    {product.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) { setImportFile(null); setImportResults(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Importar Produtos via CSV
            </DialogTitle>
            <DialogDescription className="text-sm">
              Importe produtos a partir de um CSV exportado do Shopify
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed rounded-xl" style={{ borderColor: `hsl(var(--admin-border))`, background: `hsl(var(--admin-surface-hover))` }}>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="border-0 bg-transparent"
              />
              {importFile && (
                <p className="text-sm mt-2" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                  Arquivo: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="admin-status-danger rounded-xl p-3 text-sm">
              <strong>⚠️ Atenção:</strong> Esta ação irá deletar todos os produtos existentes e substituí-los pelos produtos do CSV.
            </div>

            <Button onClick={handleImport} disabled={!importFile || importing} className="gap-2 rounded-xl w-full">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4" /> Importar Produtos</>}
            </Button>

            {importResults && (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">{importResults.imported}</span> <span className="text-sm">importados</span>
                  </div>
                  {importResults.errors > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold">{importResults.errors}</span> <span className="text-sm">erros</span>
                    </div>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {importResults.details.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm py-1 px-2 rounded ${r.status === "ok" ? "" : "text-destructive bg-destructive/10"}`}>
                      {r.status === "ok" ? <CheckCircle className="w-3 h-3 text-success shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                      <span>{r.name}</span>
                      {r.error && <span className="text-xs ml-auto">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
