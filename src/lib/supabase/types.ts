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
                blueprint_id: string | null;
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
                blueprint_id?: string | null;
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
                blueprint_id?: string | null;
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
      app_users: {
        Row: {
          auth_user_id: string | null;
          company_id: string | null;
          created_at: string;
          email: string;
          full_name: string;
          hashed_password: string | null;
          id: string;
          last_login_at: string | null;
          metadata: Json;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          hashed_password?: string | null;
          id?: string;
          last_login_at?: string | null;
          metadata?: Json;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          hashed_password?: string | null;
          id?: string;
          last_login_at?: string | null;
          metadata?: Json;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "app_users_auth_user_id_fkey";
            columns: ["auth_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "app_users_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      company_onboarding_profiles: {
        Row: {
          acquisition_channel: string | null;
          advisor_support: boolean;
          automation: boolean;
          company_id: string;
          company_name: string | null;
          completed_at: string | null;
          created_at: string;
          employee_size: string | null;
          extra_answers: Json;
          id: string;
          main_challenge: string | null;
          main_goal: string | null;
          regime: string | null;
          revenue_range: string | null;
          sector: string | null;
          updated_at: string;
        };
        Insert: {
          acquisition_channel?: string | null;
          advisor_support?: boolean;
          automation?: boolean;
          company_id: string;
          company_name?: string | null;
          completed_at?: string | null;
          created_at?: string;
          employee_size?: string | null;
          extra_answers?: Json;
          id?: string;
          main_challenge?: string | null;
          main_goal?: string | null;
          regime?: string | null;
          revenue_range?: string | null;
          sector?: string | null;
          updated_at?: string;
        };
        Update: {
          acquisition_channel?: string | null;
          advisor_support?: boolean;
          automation?: boolean;
          company_id?: string;
          company_name?: string | null;
          completed_at?: string | null;
          created_at?: string;
          employee_size?: string | null;
          extra_answers?: Json;
          id?: string;
          main_challenge?: string | null;
          main_goal?: string | null;
          regime?: string | null;
          revenue_range?: string | null;
          sector?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_onboarding_profiles_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      company_maturity_assessments: {
        Row: {
          id: string;
          company_id: string;
          assessed_by: string | null;
          assessed_at: string;
          overall_level: Database["public"]["Enums"]["maturity_level"];
          overall_score: string | null;
          dimension_scores: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          assessed_by?: string | null;
          assessed_at?: string;
          overall_level: Database["public"]["Enums"]["maturity_level"];
          overall_score?: string | null;
          dimension_scores?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          assessed_by?: string | null;
          assessed_at?: string;
          overall_level?: Database["public"]["Enums"]["maturity_level"];
          overall_score?: string | null;
          dimension_scores?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_maturity_assessments_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_maturity_assessments_assessed_by_fkey";
            columns: ["assessed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          cnpj: string | null;
          regime: string | null;
          sector: string | null;
          origin: string | null;
          maturity: Database["public"]["Enums"]["maturity_level"];
          risk_level: Database["public"]["Enums"]["notification_severity"];
          checklist_progress: string;
          employees: string[];
          accountant_ids: string[];
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj?: string | null;
          regime?: string | null;
          sector?: string | null;
          origin?: string | null;
          maturity?: Database["public"]["Enums"]["maturity_level"];
          risk_level?: Database["public"]["Enums"]["notification_severity"];
          checklist_progress?: string;
          employees?: string[];
          accountant_ids?: string[];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cnpj?: string | null;
          regime?: string | null;
          sector?: string | null;
          origin?: string | null;
          maturity?: Database["public"]["Enums"]["maturity_level"];
          risk_level?: Database["public"]["Enums"]["notification_severity"];
          checklist_progress?: string;
          employees?: string[];
          accountant_ids?: string[];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      checklists: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          legacy_id: string | null;
          reference_date: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          legacy_id?: string | null;
          reference_date?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          legacy_id?: string | null;
          reference_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "checklists_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_notifications: {
        Row: {
          id: string;
          company_id: string;
          checklist_id: string | null;
          task_id: string | null;
          kind: string;
          severity: string;
          title: string;
          message: string;
          read: boolean;
          due_date: string | null;
          phase: string | null;
          pillar: string | null;
          priority: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          checklist_id?: string | null;
          task_id?: string | null;
          kind: string;
          severity: string;
          title: string;
          message: string;
          read?: boolean;
          due_date?: string | null;
          phase?: string | null;
          pillar?: string | null;
          priority?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          checklist_id?: string | null;
          task_id?: string | null;
          kind?: string;
          severity?: string;
          title?: string;
          message?: string;
          read?: boolean;
          due_date?: string | null;
          phase?: string | null;
          pillar?: string | null;
          priority?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_notifications_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_notifications_checklist_id_fkey";
            columns: ["checklist_id"];
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_notifications_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "checklist_tasks";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_task_audits: {
        Row: {
          id: string;
          company_id: string;
          checklist_id: string;
          task_id: string;
          actor_id: string | null;
          actor_name: string | null;
          actor_role: string | null;
          event: string;
          summary: string;
          changes: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          checklist_id: string;
          task_id: string;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_role?: string | null;
          event: string;
          summary: string;
          changes?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          checklist_id?: string;
          task_id?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_role?: string | null;
          event?: string;
          summary?: string;
          changes?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_task_audits_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_task_audits_checklist_id_fkey";
            columns: ["checklist_id"];
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_task_audits_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_task_audits_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "checklist_tasks";
            referencedColumns: ["id"];
          }
        ];
      };
      checklist_tasks: {
        Row: {
          id: string;
          board_id: string;
          blueprint_id: string | null;
          title: string;
          description: string;
          severity: string;
          status: string;
          owner: string;
          category: string;
          due_date: string | null;
          phase: string | null;
          pillar: string | null;
          priority: string | null;
          reference_items: Json | null;
          evidence_items: Json | null;
          note_items: Json | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          blueprint_id?: string | null;
          title: string;
          description?: string;
          severity?: string;
          status?: string;
          owner: string;
          category: string;
          due_date?: string | null;
          phase?: string | null;
          pillar?: string | null;
          priority?: string | null;
          reference_items?: Json | null;
          evidence_items?: Json | null;
          note_items?: Json | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          blueprint_id?: string | null;
          title?: string;
          description?: string;
          severity?: string;
          status?: string;
          owner?: string;
          category?: string;
          due_date?: string | null;
          phase?: string | null;
          pillar?: string | null;
          priority?: string | null;
          reference_items?: Json;
          evidence_items?: Json;
          note_items?: Json;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_tasks_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "checklists";
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
  Functions: {
    cleanup_orphan_checklist_notifications: {
      Args: {
        limit_count?: number | null;
      };
      Returns: {
        deleted_id: string;
      }[];
    };
    company_actor_can_access: {
      Args: {
        company_uuid: string;
      };
      Returns: boolean;
    };
    mark_company_notifications_read: {
      Args: {
        company_uuid: string;
        notification_ids?: string[] | null;
        mark_read?: boolean | null;
      };
      Returns: number;
    };
    delete_company_notifications: {
      Args: {
        company_uuid: string;
        notification_ids: string[];
      };
      Returns: number;
    };
    sync_company_notifications: {
      Args: {
        company_uuid: string;
        notifications?: Json;
        remove_missing?: boolean | null;
      };
      Returns: number;
    };
  };
    Enums: {
      alert_status: "active" | "resolved";
      checklist_item_status: "pending" | "in_progress" | "completed" | "blocked";
      checklist_pillar: "planejamento" | "operacoes" | "compliance";
      checklist_status: "draft" | "in_progress" | "completed";
      content_type: "artigo" | "video" | "curso" | "ebook" | "mapa_mental" | "webinar";
      maturity_level: "inicial" | "em_adaptacao" | "avancado";
      membership_status: "active" | "invited" | "inactive";
      risk_level: "verde" | "laranja" | "vermelho";
      notification_severity: "verde" | "laranja" | "vermelho";
      user_role: "empresa" | "colaborador" | "contador";
    };
  };
};
