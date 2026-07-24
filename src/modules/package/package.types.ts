import { Package } from "@prisma/client";

export interface PackageCompanyDetail {
  id: string;
  name: string;
  sector: string;
  description: string;
  logo: string | null;
  initialPrice: number;
  shares: number;
}

export interface PackageDetail extends Package {
  companies: PackageCompanyDetail[];
}
