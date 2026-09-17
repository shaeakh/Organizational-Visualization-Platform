export interface Department {
  id: string;
  name: string;
  parentName: string | null;
  head: string | null;
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
  department: Department;
  employees: Employee[];
  children: TreeDepartmentNode[];
}
