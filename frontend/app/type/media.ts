export interface IMedia {
  id: string;
  title: string;
  alt_text: string;
  description?: string;
  type: string;
  url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}
