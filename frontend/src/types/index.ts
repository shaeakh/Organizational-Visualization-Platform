export interface User {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  department_id: string;
  title: string;
  email: string | null;
  mobile_phone?: string | null;
  business_phone?: string | null;
  active: boolean;                   // active in company (1=active, 0=left)
  vip: boolean;
  sys_id: string;
  version: number;                    // SCD Type 2: version number
  valid_from: string;                 // SCD Type 2: active from ISO timestamp
  valid_to: string;                   // SCD Type 2: active until ISO timestamp ('9999-12-31 23:59:59' for current)
  is_active: boolean;                 // SCD Type 2: true if this is the current active version row
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  department_id: string;
  name: string;
  parent_department_id: string | null;
  department_head: string | null;
  primary_contact: string | null;
  description?: string | null;
  head_count?: number | null;
  sys_id: string;
  version: number;                    // SCD Type 2: version number
  valid_from: string;                 // SCD Type 2: active from ISO timestamp
  valid_to: string;                   // SCD Type 2: active until ISO timestamp ('9999-12-31 23:59:59' for current)
  is_active: boolean;                 // SCD Type 2: true if this is the current active version row
  created_at: string;
  updated_at: string;
}

export interface ConcurrentDuty {
  id: number;
  user_id: string;
  department_id: string;
  title: string | null;
  is_primary: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface ChangeHistoryEntry {
  id: number;
  table_name: 'users' | 'departments';
  record_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_by: string | null;
  description: string;
  changed_at: string;
}

export interface OrgChartNode {
  department: Department;
  members: (User & { is_concurrent: boolean })[];
  children: OrgChartNode[];
}

export interface Employee {
  id: string;
  lastName: string;
  firstName: string;
  department: string;
  title: string;
  concurrentDepartments: string[];
  isConcurrent?: boolean;
}

export interface TreeDepartmentNode {
  department: {
    id: string;
    name: string;
    parentName: string | null;
    head: string | null;
  };
  employees: Employee[];
  children: TreeDepartmentNode[];
}

