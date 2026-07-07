// Hand-authored types matching the shared Supabase project schema:
// cutout-library/supabase/migrations/0001_init.sql + 0002_web_public_and_billing.sql.
// Regenerate with `supabase gen types typescript --linked` once the CLI is linked.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          pro_until: string | null;
          rc_app_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          pro_until?: string | null;
          rc_app_user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          category: string;
          tags: string[];
          storage_path: string;
          source_url: string | null;
          width: number | null;
          height: number | null;
          bytes: number | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          category: string;
          tags?: string[];
          storage_path: string;
          source_url?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          added_at?: string;
        };
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
        Relationships: [];
      };
      public_items: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: string;
          tags: string[];
          storage_path: string;
          source_url: string | null;
          width: number | null;
          height: number | null;
          bytes: number | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: string;
          tags?: string[];
          storage_path: string;
          source_url?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          added_at?: string;
        };
        Update: Partial<Database['public']['Tables']['public_items']['Insert']>;
        Relationships: [];
      };
      stripe_subscriptions: {
        Row: {
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          price_id: string | null;
          status: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          price_id?: string | null;
          status?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stripe_subscriptions']['Insert']>;
        Relationships: [];
      };
      bg_removals: {
        Row: {
          user_id: string;
          month: string;
          count: number;
          web_count: number;
        };
        Insert: {
          user_id: string;
          month: string;
          count?: number;
          web_count?: number;
        };
        Update: Partial<Database['public']['Tables']['bg_removals']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_web_bg_quota: {
        Args: { p_user: string; p_month: string; p_limit: number };
        Returns: { allowed: boolean; used: number }[];
      };
      refund_web_bg_quota: {
        Args: { p_user: string; p_month: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Item = Database['public']['Tables']['items']['Row'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type PublicItem = Database['public']['Tables']['public_items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type StripeSubscription = Database['public']['Tables']['stripe_subscriptions']['Row'];
