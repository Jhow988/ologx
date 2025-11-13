export interface Company {
  id: string;
  name: string;
  document: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string | null; // Can be null for super admin
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'driver' | 'operator';
  status: 'pending' | 'active' | 'inactive';
  cnhDueDate?: string;
  cnhCategories?: string[];
  avatar?: string;
  isSuperAdmin: boolean;
}

export interface Vehicle {
  id: string;
  company_id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  driver?: string;
  lastMaintenance: string;
  licensing_due_date: string;
  required_cnh_category?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  file?: File;
  storagePath?: string; // Caminho no Supabase Storage
}

export interface Trip {
  id: string;
  companyId: string;
  clientId: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  distance: number;
  freight_value: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  description?: string;
  attachments?: Attachment[];
  cte?: string;
  nf?: string;
  requester?: string;
  vehicleType?: string;
  freightType?: string;
  insuranceInfo?: string;
  // Joined data
  clientName?: string;
  vehiclePlate?: string;
  driverName?: string;
}

export interface FinancialCategory {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface FinancialSubcategory {
  id: string;
  company_id: string;
  name: string;
  category_id: string;
  created_at: string;
}

export interface FinancialRecord {
  id: string;
  company_id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  category_id: string;
  subcategory_id?: string;
  recurrence: 'unique' | 'installment' | 'recurring';
  related_trip_id?: string;
  recurrence_id?: string;
  created_at: string;
  // Joined data
  categoryName?: string;
  subcategoryName?: string;
}

export interface Maintenance {
  id: string;
  company_id: string;
  vehicle_id: string;
  title: string;
  start_date: string;
  end_date?: string;
  description: string;
  cost: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  type: 'preventive' | 'corrective';
  next_maintenance_reminder?: string;
}

export interface SystemAlert {
  id: string;
  type: 'financial' | 'maintenance' | 'licensing' | 'cnh';
  title: string;
  message: string;
  date: string;
  relatedId: string;
}
