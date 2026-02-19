import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Button onClick={() => navigate("/admin/produtos/novo")} className="gap-2 rounded-xl shine h-11 font-sans">
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
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
    </div>
  );
}
