export interface Station {
  id: string;
  title: string;
  longitude: number;
  latitude: number;
  created_at: string;
  updated_at: string;
  status: string;
  filereadtemplateid: number | null;
  ftp_status: string;
}
