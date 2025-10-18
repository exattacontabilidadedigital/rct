export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      company_alerts: {
        Row: {
          actionable_until: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          metadata: Json;
          resolved_at: string | null;
          severity: Database["public"]["Enums"]["risk_level"];
          source: string;
          status: Database["public"]["Enums"]["alert_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          actionable_until?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["risk_level"];
          source: string;
          status?: Database["public"]["Enums"]["alert_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          actionable_until?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["risk_level"];
          source?: string;
          status?: Database["public"]["Enums"]["alert_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_alerts_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_alerts_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      company_checklist_items: {
        Row: {
          assigned_to: string | null;
          checklist_item_id: string;
          company_checklist_id: string;
          completed_at: string | null;
          created_at: string;
          evidence_url: string | null;
          id: string;
          notes: string | null;
          score: string | null;
          status: Database["public"]["Enums"]["checklist_item_status"];
          updated_at: string;
          due_date: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          checklist_item_id: string;
          company_checklist_id: string;
          completed_at?: string | null;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          notes?: string | null;
          score?: string | null;
          status?: Database["public"]["Enums"]["checklist_item_status"];
          updated_at?: string;
          due_date?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          checklist_item_id?: string;
          company_checklist_id?: string;
          completed_at?: string | null;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          notes?: string | null;
          score?: string | null;
          status?: Database["public"]["Enums"]["checklist_item_status"];
          updated_at?: string;
          due_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_checklist_items_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_checklist_items_checklist_item_id_fkey";
            columns: ["checklist_item_id"];
            referencedRelation: "checklist_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_checklist_items_company_checklist_id_fkey";
            columns: ["company_checklist_id"];
            referencedRelation: "company_checklists";
            referencedColumns: ["id"];
          }
        ];
      };
      company_checklists: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          progress: string;
          started_at: string;
          status: Database["public"]["Enums"]["checklist_status"];
          template_id: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          progress?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["checklist_status"];
          template_id: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          progress?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["checklist_status"];
          template_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_checklists_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_checklists_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_checklists_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "checklist_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      company_members: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          profile_id: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          profile_id: string;
          role: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          profile_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_members_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_members_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      companies: {
        Row: {
          checklist_progress: string;
          created_at: string;
          id: string;
          maturity: Database["public"]["Enums"]["maturity_level"];
          metadata: Json;
          name: string;
          origin: string | null;
          owner_profile_id: string;
          regime: string;
          risk_level: Database["public"]["Enums"]["risk_level"];
          sector: string | null;
          updated_at: string;
          cnpj: string | null;
        };
        Insert: {
          checklist_progress?: string;
          created_at?: string;
          id?: string;
          maturity?: Database["public"]["Enums"]["maturity_level"];
          metadata?: Json;
          name: string;
          origin?: string | null;
          owner_profile_id: string;
          regime: string;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          sector?: string | null;
          updated_at?: string;
          cnpj?: string | null;
        };
        Update: {
          checklist_progress?: string;
          created_at?: string;
          id?: string;
          maturity?: Database["public"]["Enums"]["maturity_level"];
          metadata?: Json;
          name?: string;
          origin?: string | null;
          owner_profile_id?: string;
          regime?: string;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          sector?: string | null;
          updated_at?: string;
          cnpj?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "companies_owner_profile_id_fkey";
            columns: ["owner_profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      content_items: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_premium: boolean;
          metadata: Json;
          published_at: string | null;
          summary: string | null;
          tags: string[];
          title: string;
          updated_at: string;
          url: string | null;
          content_type: Database["public"]["Enums"]["content_type"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_premium?: boolean;
          metadata?: Json;
          published_at?: string | null;
          summary?: string | null;
          tags?: string[];
          title: string;
          updated_at?: string;
          url?: string | null;
          content_type: Database["public"]["Enums"]["content_type"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_premium?: boolean;
          metadata?: Json;
          published_at?: string | null;
          summary?: string | null;
          tags?: string[];
          title?: string;
          updated_at?: string;
          url?: string | null;
          content_type?: Database["public"]["Enums"]["content_type"];
        };
        Relationships: [
          {
            foreignKeyName: "content_items_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_items: {
        Row: {
          created_at: string;
          description: string | null;
          effort_hours: string | null;
          id: string;
          position: number;
          required: boolean;
          resources: Json;
          section_id: string;
          severity: Database["public"]["Enums"]["risk_level"];
          template_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          effort_hours?: string | null;
          id?: string;
          position?: number;
          required?: boolean;
          resources?: Json;
          section_id: string;
          severity?: Database["public"]["Enums"]["risk_level"];
          template_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          effort_hours?: string | null;
          id?: string;
          position?: number;
          required?: boolean;
          resources?: Json;
          section_id?: string;
          severity?: Database["public"]["Enums"]["risk_level"];
          template_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_section_id_fkey";
            columns: ["section_id"];
            referencedRelation: "checklist_sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_items_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "checklist_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_sections: {
        Row: {
          created_at: string;
          id: string;
          pillar: Database["public"]["Enums"]["checklist_pillar"];
          position: number;
          template_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          pillar: Database["public"]["Enums"]["checklist_pillar"];
          position?: number;
          template_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          pillar?: Database["public"]["Enums"]["checklist_pillar"];
          position?: number;
          template_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_sections_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "checklist_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_templates: {
        Row: {
          applicability: Json;
          created_at: string;
          default_maturity: Database["public"]["Enums"]["maturity_level"];
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          applicability?: Json;
          created_at?: string;
          default_maturity?: Database["public"]["Enums"]["maturity_level"];
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          applicability?: Json;
          created_at?: string;
          default_maturity?: Database["public"]["Enums"]["maturity_level"];
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          last_seen_at: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          last_seen_at?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          last_seen_at?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  Views: Record<string, never>;
  Functions: Record<string, never>;
    Enums: {
      alert_status: "active" | "resolved";
      checklist_item_status: "pending" | "in_progress" | "completed" | "blocked";
      checklist_pillar: "planejamento" | "operacoes" | "compliance";
      checklist_status: "draft" | "in_progress" | "completed";
      content_type: "artigo" | "video" | "curso" | "ebook" | "mapa_mental" | "webinar";
      maturity_level: "inicial" | "em_adaptacao" | "avancado";
      membership_status: "active" | "invited" | "inactive";
      risk_level: "verde" | "laranja" | "vermelho";
      user_role: "empresa" | "colaborador" | "contador";
    };
  };
};
