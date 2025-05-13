
// Add the created_at field to the Dataset interface
export interface Dataset {
  id: string;
  name?: string;
  region: string;
  year: number;
  created_at?: string;
}
