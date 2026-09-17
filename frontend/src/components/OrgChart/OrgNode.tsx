import React from 'react';
import type { Department, User } from '../../types/index';
import { User as UserIcon, Star } from 'lucide-react';

interface OrgNodeProps {
  department: Department;
  members: (User & { is_concurrent: boolean })[];
  isRoot?: boolean;
}

export const OrgNode: React.FC<OrgNodeProps> = ({ department, members, isRoot = false }) => {
  // Separate manager/head from other staff members
  const managerName = department.department_head;
  const manager = members.find(
    m => `${m.last_name} ${m.first_name}` === managerName || `${m.first_name} ${m.last_name}` === managerName
  );
  
  const staff = members.filter(
    m => `${m.last_name} ${m.first_name}` !== managerName && `${m.first_name} ${m.last_name}` !== managerName
  );

  return (
    <div className="flex flex-col items-center">
      {/* Connector line for child departments (handled in parent tree component) */}
      
      {/* Node Box */}
      <div className={`w-80 bg-card rounded-xl shadow-md border-t-4 border-x border-b border-x-border/20 border-b-border/20 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        isRoot 
          ? 'border-t-primary ring-2 ring-primary/20' 
          : department.parent_department_id?.includes('SW') || department.department_id.startsWith('243')
            ? 'border-t-emerald-500' // Systems Division
            : department.department_id.startsWith('245')
              ? 'border-t-purple-500' // IT Support
              : department.department_id.startsWith('241')
                ? 'border-t-amber-500' // Sales
                : 'border-t-slate-500' // Management/Other
      }`}>
        {/* Department Title & ID */}
        <div className="px-4 py-3 bg-muted/50 border-b border-border/50 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-foreground text-sm">{department.name}</h4>
            <span className="text-[10px] text-muted-foreground font-mono">ID: {department.department_id}</span>
          </div>
          {department.description && (
            <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {department.description}
            </span>
          )}
        </div>

        {/* Node Body */}
        <div className="p-4 space-y-3">
          {/* 1. Manager / Department Head */}
          {managerName ? (
            <div className="bg-muted p-2.5 rounded-lg border border-border flex items-start gap-2.5">
              <div className="bg-primary/10 text-primary p-1.5 rounded-md mt-0.5">
                <Star className="h-4 w-4 fill-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-primary font-semibold tracking-wider uppercase block">
                  {manager?.title || 'Department Head'}
                </span>
                <span className="font-bold text-foreground text-sm block truncate">
                  {manager ? `${manager.first_name} ${manager.last_name}` : managerName}
                  {manager?.is_concurrent && <span className="text-destructive text-xs ml-1 font-semibold">（兼）</span>}
                </span>
                {manager?.email && <span className="text-[10px] text-muted-foreground block truncate">{manager.email}</span>}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 bg-muted rounded-lg border border-dashed border-border">
              <span className="text-xs text-muted-foreground italic">Head Position Vacant</span>
            </div>
          )}

          {/* 2. Staff Members List */}
          {staff.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase block px-1">
                Staff ({staff.length})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
                {staff.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors text-xs border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground/90 truncate">
                        {member.first_name} {member.last_name}
                        {member.is_concurrent && <span className="text-destructive text-[10px] ml-1 font-semibold">（兼）</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono">
                        {member.title}
                      </span>
                      {member.vip === true && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">VIP</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
