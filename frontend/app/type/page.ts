export interface IPage {
  id: String;
  title: String;
  slug: String;
  content: JSON;
  published: Boolean;
  entityId: String;
  createdAt: Date;
  updatedAt: Date;
}
