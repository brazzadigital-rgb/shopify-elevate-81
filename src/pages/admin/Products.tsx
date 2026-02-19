import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Filter, Upload, Download, Loader2, CheckCircle, AlertCircle, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
      const { data, error } = await supabase.functions.invoke("import-products", {
        body: { csv: csvText },
      });
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

  const filteredProducts = filterSupplier === "all"
    ? products
    : filterSupplier === "none"
      ? products.filter(p => !p.supplier_id)
      : products.filter(p => p.supplier_id === filterSupplier);

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Produtos</h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">Gerencie o catálogo da loja</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl h-11 font-sans">
                <MoreVertical className="w-4 h-4" /> Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setImportOpen(true)} className="gap-2 font-sans cursor-pointer">
                <Upload className="w-4 h-4" /> Importar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport} className="gap-2 font-sans cursor-pointer">
                <Download className="w-4 h-4" /> Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => navigate("/admin/produtos/novo")} className="gap-2 rounded-xl shine h-11 font-sans">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {suppliers.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="h-9 w-48 rounded-lg text-sm font-sans">
              <SelectValue placeholder="Filtrar por fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-sans text-sm">Todos os fornecedores</SelectItem>
              <SelectItem value="none" className="font-sans text-sm">Sem fornecedor</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id} className="font-sans text-sm">{s.trade_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card className="shadow-premium border-0 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhum produto encontrado</p>
              <p className="font-sans text-sm mt-1">Clique em "Novo Produto" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans w-16">Foto</TableHead>
                  <TableHead className="font-sans">Nome</TableHead>
                  <TableHead className="font-sans">Fornecedor</TableHead>
                  <TableHead className="font-sans">Preço</TableHead>
                  <TableHead className="font-sans">Estoque</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}>
                    <TableCell>
                      {productThumbnails[product.id] ? (
                        <img src={productThumbnails[product.id]} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-sans">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {product.supplier_id ? (
                        <Badge variant="outline" className="text-xs font-sans">{supplierMap[product.supplier_id] || "—"}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">
                      <p className="font-semibold">R$ {Number(product.price).toFixed(2)}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-muted-foreground line-through">R$ {Number(product.compare_at_price).toFixed(2)}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs font-sans">
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {product.is_featured && <Badge variant="outline" className="text-xs font-sans border-accent text-accent">Destaque</Badge>}
                        {product.is_new && <Badge variant="outline" className="text-xs font-sans border-green-500 text-green-600">Novo</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) { setImportFile(null); setImportResults(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent" /> Importar Produtos via CSV
            </DialogTitle>
            <DialogDescription className="font-sans text-sm">
              Importe produtos a partir de um CSV exportado do Shopify
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-border rounded-xl bg-muted/30">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="border-0 bg-transparent"
              />
              {importFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Arquivo: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm font-sans">
              <strong>⚠️ Atenção:</strong> Esta ação irá deletar todos os produtos existentes e substituí-los pelos produtos do CSV.
            </div>

            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="gap-2 rounded-xl shine w-full"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Importar Produtos</>
              )}
            </Button>

            {importResults && (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold font-sans">{importResults.imported}</span> <span className="font-sans text-sm">importados</span>
                  </div>
                  {importResults.errors > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold font-sans">{importResults.errors}</span> <span className="font-sans text-sm">erros</span>
                    </div>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {importResults.details.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm py-1 px-2 rounded font-sans ${
                        r.status === "ok" ? "text-foreground" : "text-destructive bg-destructive/10"
                      }`}
                    >
                      {r.status === "ok" ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 shrink-0" />
                      )}
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
