export interface TruckData {
  id: number;
  title: string;
  preview?: string | null;
  imgURL?: string | null;
  description?: string | null;
  weight?: number | null;
  price?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  year?: number | null;
  status?: string | null;
}

export interface TrucksResult {
  resultCount: number;
  results: TruckData[];
}