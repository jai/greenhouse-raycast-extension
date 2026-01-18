export interface HarvestJob {
  id: number;
  name: string;
  status: "open" | "closed" | "draft" | string;
  requisition_id?: string | null;
}
