export type MachineType = "truck" | "industrial";
export type ReadingUnit = "km" | "hours";
export type ServiceType = "repair" | "maintenance" | "parts";
export type ScheduleCategory =
  | "greasing"
  | "engine"
  | "transmission"
  | "hydraulics"
  | "chassis"
  | "brakes"
  | "tires"
  | "other";

export interface Machine {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  registration_number: string | null;
  inventory_number: string | null;
  machine_type: MachineType;
  reading_unit: ReadingUnit;
  current_reading: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceRecord {
  id: string;
  machine_id: string;
  service_date: string;
  service_type: ServiceType;
  title: string;
  description: string | null;
  reading_at_service: number;
  cost: number | null;
  performed_by: string | null;
  next_service_reading: number | null;
  next_service_date: string | null;
  notes: string | null;
  invoice_photo_paths: string[];
  created_at: string;
  deleted_at: string | null;
}

export interface MaintenanceSchedule {
  id: string;
  machine_id: string;
  name: string;
  interval_value: number;
  category: ScheduleCategory;
  last_done_reading: number | null;
  last_done_date: string | null;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export type GreaseScope = "full" | "partial";
export type DefectSeverity = "low" | "medium" | "high";
export type DefectStatus = "open" | "resolved";

export interface GreasePoint {
  id: string;
  machine_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
}

export interface GreaseEvent {
  id: string;
  machine_id: string;
  event_date: string;
  reading: number;
  scope: GreaseScope;
  point_ids: string[];
  point_names: string[];
  performed_by: string | null;
  notes: string | null;
  invoice_photo_paths: string[];
  created_at: string;
  deleted_at: string | null;
}

export interface GreaseDefect {
  id: string;
  machine_id: string;
  point_id: string | null;
  point_name: string | null;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  reported_date: string;
  reading: number | null;
  resolved_date: string | null;
  resolution_note: string | null;
  created_at: string;
  deleted_at: string | null;
}
