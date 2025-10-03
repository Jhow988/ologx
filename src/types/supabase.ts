export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          zip_code: string | null
          city: string | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          zip_code?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          zip_code?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          cnh_due_date: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          cnh_due_date?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          cnh_due_date?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          brand: string
          company_id: string
          created_at: string
          id: string
          licensing_due_date: string | null
          model: string
          plate: string
          status: string
          year: number
        }
        Insert: {
          brand: string
          company_id: string
          created_at?: string
          id?: string
          licensing_due_date?: string | null
          model: string
          plate: string
          status?: string
          year: number
        }
        Update: {
          brand?: string
          company_id?: string
          created_at?: string
          id?: string
          licensing_due_date?: string | null
          model?: string
          plate?: string
          status?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenances: {
        Row: {
          company_id: string
          cost: number
          created_at: string
          description: string
          end_date: string | null
          id: string
          next_maintenance_reminder: string | null
          start_date: string
          status: string
          title: string
          type: string
          vehicle_id: string
        }
        Insert: {
          company_id: string
          cost: number
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          next_maintenance_reminder?: string | null
          start_date: string
          status?: string
          title: string
          type?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string
          cost?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          next_maintenance_reminder?: string | null
          start_date?: string
          status?: string
          title?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      trips: {
        Row: {
          attachments: Json | null
          client_id: string
          company_id: string
          created_at: string
          cte: string | null
          description: string | null
          destination: string
          distance: number | null
          driver_id: string
          end_date: string | null
          freight_type: string | null
          id: string
          insurance_info: string | null
          nf: string | null
          origin: string
          requester: string | null
          start_date: string
          status: string
          value: number
          vehicle_id: string
          vehicle_type: string | null
        }
        Insert: {
          attachments?: Json | null
          client_id: string
          company_id: string
          created_at?: string
          cte?: string | null
          description?: string | null
          destination: string
          distance?: number | null
          driver_id: string
          end_date?: string | null
          freight_type?: string | null
          id?: string
          insurance_info?: string | null
          nf?: string | null
          origin: string
          requester?: string | null
          start_date: string
          status?: string
          value: number
          vehicle_id: string
          vehicle_type?: string | null
        }
        Update: {
          attachments?: Json | null
          client_id?: string
          company_id?: string
          created_at?: string
          cte?: string | null
          description?: string | null
          destination?: string
          distance?: number | null
          driver_id?: string
          end_date?: string | null
          freight_type?: string | null
          id?: string
          insurance_info?: string | null
          nf?: string | null
          origin?: string
          requester?: string | null
          start_date?: string
          status?: string
          value?: number
          vehicle_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_subcategories: {
        Row: {
          id: string
          company_id: string
          category_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          category_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_subcategories_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_subcategories_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_records: {
        Row: {
          id: string
          company_id: string
          type: string
          description: string
          amount: number
          due_date: string
          status: string
          category_id: string
          subcategory_id: string | null
          recurrence: string
          related_trip_id: string | null
          recurrence_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          description: string
          amount: number
          due_date: string
          status?: string
          category_id: string
          subcategory_id?: string | null
          recurrence?: string
          related_trip_id?: string | null
          recurrence_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          description?: string
          amount?: number
          due_date?: string
          status?: string
          category_id?: string
          subcategory_id?: string | null
          recurrence?: string
          related_trip_id?: string | null
          recurrence_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_subcategory_id_fkey"
            columns: ["subcategory_id"]
            referencedRelation: "financial_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_related_trip_id_fkey"
            columns: ["related_trip_id"]
            referencedRelation: "trips"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
