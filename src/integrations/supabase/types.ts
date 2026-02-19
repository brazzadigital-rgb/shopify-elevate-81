export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          border_radius: string | null
          content_position: string
          created_at: string
          cta_text: string | null
          desktop_image_url: string | null
          full_width: boolean
          height: string | null
          id: string
          is_active: boolean
          link: string | null
          location: string
          mobile_image_url: string | null
          overlay_opacity: number
          show_text: boolean
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          border_radius?: string | null
          content_position?: string
          created_at?: string
          cta_text?: string | null
          desktop_image_url?: string | null
          full_width?: boolean
          height?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          location?: string
          mobile_image_url?: string | null
          overlay_opacity?: number
          show_text?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          border_radius?: string | null
          content_position?: string
          created_at?: string
          cta_text?: string | null
          desktop_image_url?: string | null
          full_width?: boolean
          height?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          location?: string
          mobile_image_url?: string | null
          overlay_opacity?: number
          show_text?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string | null
          paid_at: string | null
          payment_status: string
          sale_amount: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_status?: string
          sale_amount?: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_status?: string
          sale_amount?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string
          number: string
          phone: string | null
          recipient_name: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood: string
          number: string
          phone?: string | null
          recipient_name: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string
          number?: string
          phone?: string | null
          recipient_name?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          section_type: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          invoice_number: string | null
          label_url: string | null
          melhor_envio_order_id: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string
          referral_code: string | null
          seller_id: string | null
          shipment_status: string | null
          shipping_address: Json | null
          shipping_cost: number
          shipping_days: number | null
          shipping_method_name: string | null
          shipping_price: number | null
          shipping_provider: string | null
          shipping_service_code: string | null
          status: string
          subtotal: number
          total: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          label_url?: string | null
          melhor_envio_order_id?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string
          referral_code?: string | null
          seller_id?: string | null
          shipment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_days?: number | null
          shipping_method_name?: string | null
          shipping_price?: number | null
          shipping_provider?: string | null
          shipping_service_code?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          label_url?: string | null
          melhor_envio_order_id?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          referral_code?: string | null
          seller_id?: string | null
          shipment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_days?: number | null
          shipping_method_name?: string | null
          shipping_price?: number | null
          shipping_provider?: string | null
          shipping_service_code?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_badges: {
        Row: {
          badge_type: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          product_id: string
          sort_order: number
          style: string
          text: string | null
          title: string | null
        }
        Insert: {
          badge_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          product_id: string
          sort_order?: number
          style?: string
          text?: string | null
          title?: string | null
        }
        Update: {
          badge_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          product_id?: string
          sort_order?: number
          style?: string
          text?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_badges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          collection_id: string
          id: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          collection_id: string
          id?: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          collection_id?: string
          id?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_custom_fields: {
        Row: {
          created_at: string
          field_label: string
          field_type: string
          id: string
          is_required: boolean
          max_length: number | null
          options: string[] | null
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_label: string
          field_type?: string
          id?: string
          is_required?: boolean
          max_length?: number | null
          options?: string[] | null
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_label?: string
          field_type?: string
          id?: string
          is_required?: boolean
          max_length?: number | null
          options?: string[] | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_custom_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          name: string
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean
          barcode: string | null
          brand: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          crosssell_product_ids: string[] | null
          description: string | null
          extra_prep_days: number | null
          free_shipping: boolean
          height: number | null
          hide_price: boolean
          id: string
          installments_interest: boolean
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          is_new: boolean
          is_subscription: boolean
          length: number | null
          max_installments: number | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string
          og_image_url: string | null
          pix_discount: number | null
          price: number
          product_type: string
          promo_end_date: string | null
          promo_start_date: string | null
          quote_only: boolean
          related_product_ids: string[] | null
          reseller_price: number | null
          shipping_height: number | null
          shipping_length: number | null
          shipping_weight: number | null
          shipping_width: number | null
          short_description: string | null
          show_on_home: boolean
          sku: string | null
          slug: string
          sold_count: number
          status: string
          stock: number
          stock_location: string | null
          supplier_id: string | null
          tags: string[] | null
          track_stock: boolean
          updated_at: string
          upsell_product_ids: string[] | null
          weight: number | null
          wholesale_price: number | null
          width: number | null
        }
        Insert: {
          allow_backorder?: boolean
          barcode?: string | null
          brand?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          crosssell_product_ids?: string[] | null
          description?: string | null
          extra_prep_days?: number | null
          free_shipping?: boolean
          height?: number | null
          hide_price?: boolean
          id?: string
          installments_interest?: boolean
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_subscription?: boolean
          length?: number | null
          max_installments?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name: string
          og_image_url?: string | null
          pix_discount?: number | null
          price?: number
          product_type?: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          quote_only?: boolean
          related_product_ids?: string[] | null
          reseller_price?: number | null
          shipping_height?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          short_description?: string | null
          show_on_home?: boolean
          sku?: string | null
          slug: string
          sold_count?: number
          status?: string
          stock?: number
          stock_location?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          track_stock?: boolean
          updated_at?: string
          upsell_product_ids?: string[] | null
          weight?: number | null
          wholesale_price?: number | null
          width?: number | null
        }
        Update: {
          allow_backorder?: boolean
          barcode?: string | null
          brand?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          crosssell_product_ids?: string[] | null
          description?: string | null
          extra_prep_days?: number | null
          free_shipping?: boolean
          height?: number | null
          hide_price?: boolean
          id?: string
          installments_interest?: boolean
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_subscription?: boolean
          length?: number | null
          max_installments?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string
          og_image_url?: string | null
          pix_discount?: number | null
          price?: number
          product_type?: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          quote_only?: boolean
          related_product_ids?: string[] | null
          reseller_price?: number | null
          shipping_height?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          short_description?: string | null
          show_on_home?: boolean
          sku?: string | null
          slug?: string
          sold_count?: number
          status?: string
          stock?: number
          stock_location?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          track_stock?: boolean
          updated_at?: string
          upsell_product_ids?: string[] | null
          weight?: number | null
          wholesale_price?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_panels: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          role_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          role_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          avatar_url: string | null
          commission_rate: number | null
          created_at: string
          document: string | null
          email: string
          id: string
          monthly_goal: number | null
          name: string
          phone: string | null
          referral_code: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          document?: string | null
          email: string
          id?: string
          monthly_goal?: number | null
          name: string
          phone?: string | null
          referral_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          document?: string | null
          email?: string
          id?: string
          monthly_goal?: number | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shipping_quotes: {
        Row: {
          created_at: string
          customer_cep: string
          expires_at: string
          id: string
          items_hash: string
          quotes_json: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_cep: string
          expires_at?: string
          id?: string
          items_hash: string
          quotes_json?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_cep?: string
          expires_at?: string
          id?: string
          items_hash?: string
          quotes_json?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: Json | null
          contact_person: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          notes: string | null
          phone: string | null
          shipping_days: number | null
          status: string
          trade_name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          contact_person?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          notes?: string | null
          phone?: string | null
          shipping_days?: number | null
          status?: string
          trade_name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          contact_person?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          notes?: string | null
          phone?: string | null
          shipping_days?: number | null
          status?: string
          trade_name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          assigned_at: string
          custom_role_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          custom_role_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          custom_role_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "seller"],
    },
  },
} as const
