export interface IPageViews {
  pageviews: { x: string; y: number }[];
  sessions: { x: string; y: number }[];
}

export type TopNewsRange = "day" | "week" | "month" | "year" | "all";

export interface ITopNewsItem {
  id: string | null;
  title: string;
  slug: string;
  views: number;
  visitors?: number;
  publicationDate: string | null;
  coverUrl: string | null;
}

export interface ITopPageItem {
  id: string | null;
  title: string;
  path: string;
  slug: string;
  views: number;
  visitors?: number;
  updatedAt?: string | null;
}
