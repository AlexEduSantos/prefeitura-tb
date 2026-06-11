export interface IPage {
  id: string;
  title: string;
  slug: string;
  content: any;
  published: boolean;
  entityId: string;
  createdAt: Date;
  updatedAt: Date;
}
