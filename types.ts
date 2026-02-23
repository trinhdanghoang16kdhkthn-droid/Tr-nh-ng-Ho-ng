
export type BookStatus = 'Draft' | 'Published';
export type PageSize = 'A4' | 'A5' | 'Letter';
export type Theme = 'light' | 'dark' | 'sepia';

export interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  color: string;
  anchor?: string;
}

export interface BookSection {
  id: string;
  title: string;
  content: string;
  notes: Note[]; // Ghi chú riêng cho từng chương
}

export interface BookSettings {
  pageSize: PageSize;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverColor: string;
  status: BookStatus;
  sections: BookSection[];
  activeSectionId: string;
  createdAt: number;
  lastModified: number;
  settings: BookSettings;
  notes: Note[]; // Ghi chú chung của cả cuốn sách
}

export type ViewState = 'home' | 'library' | 'editor';
