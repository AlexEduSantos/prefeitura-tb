export interface IOfficialGazetteUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface IOfficialGazette {
  id: string;
  title: string;
  edition?: string | null;
  description?: string | null;
  publicationDate: string;
  fileUrl: string;
  fileSize?: number | null;
  pageCount?: number | null;
  createdById: string;
  createdBy?: IOfficialGazetteUser | null;
  updatedById?: string | null;
  updatedBy?: IOfficialGazetteUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface IOfficialGazetteResponse {
  data: IOfficialGazette[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IOfficialGazetteFilterParams {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  edition?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

