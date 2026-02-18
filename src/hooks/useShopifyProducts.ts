import { useState, useEffect } from 'react';
import { storefrontApiRequest, PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';

export function useShopifyProducts(limit = 20, query?: string) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: limit, query: query || null });
        setProducts(data?.data?.products?.edges || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [limit, query]);

  return { products, loading, error };
}
