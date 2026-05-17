export interface IUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  role?: "admin" | "journalist" | "secretary";
}
