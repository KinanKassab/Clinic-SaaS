// User and Authentication Types
export interface User {
  id: string;
  email: string;
  created_at?: string;
}

// Clinic Types
export interface Clinic {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Profile Types
export type UserRole = 'doctor' | 'nurse' | 'admin' | 'receptionist';

export interface Profile {
  id: string; // Same as User ID
  clinic_id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

// Patient Types
export interface Patient {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Extended types with relations
export interface PatientWithDetails extends Patient {
  // Can add related data here if needed
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Patient;
  doctor?: Profile;
}

