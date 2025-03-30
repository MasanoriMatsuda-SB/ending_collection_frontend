export interface Message {
    message_id: number;
    user_id: number;
    content: string;
    created_at: string;
    username: string;
    photoURL?: string;
    parent_message_id?: number | null;
  }
  
  export interface Attachment {
    attachment_id: number;
    attachment_url: string;
    attachment_type: "image" | "video" | "voice" | "file";
    uploaded_at: string;
  }
  