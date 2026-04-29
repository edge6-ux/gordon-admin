export type JobStatus =
  | "submitted"
  | "reviewed"
  | "quoted"
  | "assigned"
  | "in_progress"
  | "complete"
  | "cancelled";

export type Job = {
  id: string;
  created_at: string;
  updated_at: string;
  submission_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  property_address: string;
  status: JobStatus;
  reference_code: string;
  assigned_to: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  crew_notes: string;
  internal_notes: string;
  completed_at: string | null;
  deleted_at: string | null;
  report_data: Record<string, unknown> | null;
  submission?: Submission;
};

export type Submission = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  property_address: string;
  service_type: string;
  tree_count: string;
  urgency: string;
  best_time_to_call: string;
  additional_notes: string;
  photo_urls: string[];
  ai_result: AIResult | null;
  reference_code: string;
  source: "customer" | "operator" | "manual";
  status: string;
  internal_notes: string;
};

export type AIResult = {
  species_name: string;
  species_confidence: string;
  species_description: string;
  flags: Flag[];
  crew_tips: string[];
  key_characteristics: string[];
  site_considerations: string[];
  no_tree_detected: boolean;
};

export type Flag = {
  severity: "stop" | "caution" | "info";
  message: string;
};

export type SitePinType = "Service" | "Hazard";

export type SitePin = {
  id: string;
  type: SitePinType;
  lat: number;
  lng: number;
  label: string;
  note: string;
  radius?: number;
};

export type Quote = {
  id: string;
  created_at: string;
  updated_at: string;
  job_id: string | null;
  submission_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  property_address: string;
  date: string;
  hours_estimate: string;
  wet_dry: "wet" | "dry" | "";
  lead_source: string;
  sales_rep: string;
  description_of_work: string;
  pending_hoa: boolean;
  city_permit: boolean;
  locate_811: boolean;
  main_lines: boolean;
  power_drop: boolean;
  arborist_onsite: boolean;
  equipment: string[];
  tree_services_cost: number;
  stump_removal_cost: number;
  discount: number;
  total_cost: number;
  card_fee_applied: boolean;
  customer_signature: string | null;
  signed_at: string | null;
  status: "draft" | "presented" | "accepted" | "declined";
  site_notes: string;
  site_photo_urls: string[];
  site_map_pins: SitePin[];
};

export type Message = {
  id: string;
  created_at: string;
  job_id: string;
  direction: "inbound" | "outbound" | "internal";
  channel: "email" | "sms";
  subject: string | null;
  body: string;
  sent_by: string;
  status: "sent" | "delivered" | "failed" | "pending_twilio";
};

export type CustomerProfile = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  lead_source: string | null;
  referred_by: string | null;
  other_source: string | null;
  sales_rep: string | null;
  notes: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  total_jobs: number;
  last_job_at: string | null;
};
