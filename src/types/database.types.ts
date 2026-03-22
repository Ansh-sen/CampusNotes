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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          university: string | null
          major: string | null
          year: string | null
          avatar_url: string | null
          bio: string | null
          rating_avg: number | null
          earnings_total: number | null
          notes_sold: number | null
          is_topper: boolean
          created_at: string
          branch: string | null
          semester: number | null
          programme: string | null
          is_student_verified: boolean
          college_id_url: string | null
          referral_code: string | null
          notification_prefs: Json | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          university?: string | null
          major?: string | null
          year?: string | null
          avatar_url?: string | null
          bio?: string | null
          rating_avg?: number | null
          is_topper?: boolean
          created_at?: string
          branch?: string | null
          semester?: number | null
          programme?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          university?: string | null
          major?: string | null
          year?: string | null
          avatar_url?: string | null
          bio?: string | null
          rating_avg?: number | null
          is_topper?: boolean
          created_at?: string
          branch?: string | null
          semester?: number | null
          programme?: string | null
        }
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          course_code: string | null
          subject: string | null
          description: string | null
          price: number
          condition: string | null
          type: string | null
          images: string[] | null
          status: string | null
          ai_score: number | null
          created_at: string
          branch: string | null
          semester: string | null
          programme: string | null
          view_count: number
          file_url: string | null
          is_draft: boolean
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          course_code?: string | null
          subject?: string | null
          description?: string | null
          price: number
          condition?: string | null
          type?: string | null
          images?: string[] | null
          status?: string | null
          ai_score?: number | null
          created_at?: string
          branch?: string | null
          semester?: string | null
          programme?: string | null
          view_count?: number
          file_url?: string | null
          is_draft?: boolean
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          course_code?: string | null
          subject?: string | null
          description?: string | null
          price?: number
          condition?: string | null
          type?: string | null
          images?: string[] | null
          status?: string | null
          ai_score?: number | null
          created_at?: string
          branch?: string | null
          semester?: string | null
          programme?: string | null
          view_count?: number
          file_url?: string | null
          is_draft?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read_status: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read_status?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read_status?: boolean | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          listing_id: string | null
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
  }
}
