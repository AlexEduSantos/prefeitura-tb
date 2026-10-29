export interface ISiteSettings {
  id: string;
  siteName: string;
  siteDescription?: string;

  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  primaryForegroundColor?: string;
  secondaryColor: string;
  secondaryForegroundColor?: string;
  themeColors?: JSON | null;

  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  visits?: number;

  updatedAt: string;
}
