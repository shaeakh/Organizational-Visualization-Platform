import React from 'react';
import { Briefcase, Code2, LifeBuoy, Settings, Layers } from 'lucide-react';
import type { TreeDepartmentNode, Employee } from '../../types';

interface OrgChartTreeProps {
  node: TreeDepartmentNode;
  isLast: boolean;
  ancestorsIsLast: boolean[];
  depth: number;
}

const TITLE_RANK = [
  "代表取締役",
  "本部長",
  "事業部長",
  "部長",
  "課長",
  "担当課長",
  "主任",
  "主任2",
  "主任２",
  "課員"
];

// Helper: Get style mapping based on department ID prefixes (matching index.css variables)
const getDeptStyle = (id: string) => {
  if (id.startsWith('241')) {
    // Sales division - chart-1 (Coral/Reddish)
    return {
      bgClass: 'bg-chart-1/10 text-black',
      borderClass: 'border-l-4 border-l-chart-1 border-y border-r border-black/40'
    };
  }
  if (id.startsWith('243')) {
    // Systems division - chart-2 (Amber/Yellow)
    return {
      bgClass: 'bg-chart-2/10 text-black',
      borderClass: 'border-l-4 border-l-chart-2 border-y border-r border-black/40'
    };
  }
  if (id.startsWith('245')) {
    // IT Support/Purchasing - chart-3 (Teal/Green)
    return {
      bgClass: 'bg-chart-3/10 text-black',
      borderClass: 'border-l-4 border-l-chart-3 border-y border-r border-black/40'
    };
  }
  if (id.startsWith('249')) {
    // Admin/Management - chart-4 (Violet/Blue)
    return {
      bgClass: 'bg-chart-4/10 text-black',
      borderClass: 'border-l-4 border-l-chart-4 border-y border-r border-black/40'
    };
  }
  // Others - chart-5 (Gray/Slate)
  return {
    bgClass: 'bg-chart-5/10 text-black',
    borderClass: 'border-l-4 border-l-chart-5 border-y border-r border-black/40'
  };
};

// Helper: Get division icon based on department ID prefixes
const getDeptIcon = (id: string) => {
  const iconSize = "h-3.5 w-3.5 mr-1 text-black/75 shrink-0";
  if (id.startsWith('241')) {
    return <Briefcase className={iconSize} />;
  }
  if (id.startsWith('243')) {
    return <Code2 className={iconSize} />;
  }
  if (id.startsWith('245')) {
    return <LifeBuoy className={iconSize} />;
  }
  if (id.startsWith('249')) {
    return <Settings className={iconSize} />;
  }
  return <Layers className={iconSize} />;
};

export const OrgChartTree: React.FC<OrgChartTreeProps> = ({
  node,
  isLast,
  depth
}) => {
  const { department, employees, children } = node;
  const isRoot = depth === 0;

  // Group employees by their title
  const titleGroups: { title: string; employees: Employee[] }[] = [];
  
  // Sort employees by rank to ensure correct order
  const sortedEmployees = [...employees].sort((a, b) => {
    const rankA = TITLE_RANK.indexOf(a.title);
    const rankB = TITLE_RANK.indexOf(b.title);
    const indexA = rankA === -1 ? 99 : rankA;
    const indexB = rankB === -1 ? 99 : rankB;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.lastName.localeCompare(b.lastName);
  });

  // Group sorted employees by title
  sortedEmployees.forEach(emp => {
    let group = titleGroups.find(g => g.title === emp.title);
    if (!group) {
      group = { title: emp.title, employees: [] };
      titleGroups.push(group);
    }
    group.employees.push(emp);
  });

  // Combine title groups (as titles) and sub-departments (as depts) into a single child list
  const deptChildren: (
    | { type: 'title'; title: string; employees: Employee[] }
    | { type: 'dept'; node: TreeDepartmentNode }
  )[] = [
    ...titleGroups.map(g => ({ type: 'title' as const, title: g.title, employees: g.employees })),
    ...children.map(c => ({ type: 'dept' as const, node: c }))
  ];

  const style = getDeptStyle(department.id);

  return (
    <div 
      className={`flex flex-col relative ${!isRoot ? 'pl-6' : ''}`}
      style={{ fontFamily: '"Yu Gothic", "游ゴシック", "Noto Sans JP", sans-serif' }}
    >
      
      {/* 1. Connector lines for this department box (relative to outer wrapper) */}
      {!isRoot && (
        <>
          {/* Vertical segment of parent's line flow */}
          <div 
            className="absolute bg-black print:bg-black w-px -z-10" 
            style={{ 
              left: '12px', // half of pl-6 (24px)
              top: '0px', 
              bottom: isLast ? 'calc(100% - 24px)' : '0px' // Stop at vertical middle of department row if last child
            }}
          ></div>

          {/* Horizontal branch line connecting to department box */}
          <div 
            className="absolute bg-black print:bg-black h-px -z-10" 
            style={{ 
              left: '12px', 
              width: '12px', 
              top: '24px' // middle of the 48px row
            }}
          ></div>
        </>
      )}

      {/* 2. Department Name Row */}
      <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
        {/* Content Box Block */}
        <div className="flex items-center py-0 z-10">
          {/* Department Name Cell */}
          <div className={`px-4 py-0 font-bold text-xs min-w-[140px] h-10 leading-10 flex items-center justify-center gap-1 text-center shrink-0 bg-white border border-black rounded-sm shadow-sm ${style.borderClass} ${style.bgClass}`}>
            {getDeptIcon(department.id)}
            <span className="truncate">{department.name}</span>
          </div>
        </div>
      </div>

      {/* 3. Children Block (Titles & Sub-departments nested under department) */}
      {deptChildren.length > 0 && (
        <div className="flex flex-col relative">
          {deptChildren.map((child, index) => {
            const isChildLast = index === deptChildren.length - 1;
            
            if (child.type === 'dept') {
              return (
                <OrgChartTree
                  key={child.node.department.name}
                  node={child.node}
                  isLast={isChildLast}
                  ancestorsIsLast={[]}
                  depth={depth + 1}
                />
              );
            }

             // Otherwise it is a Title group (rendered as a branch node)
             const showInLine = child.employees.length <= 3;

             return (
               <div 
                 key={child.title}
                 className="flex flex-col relative pl-6"
               >
                 {/* Connector lines for Title Box relative to this title wrapper */}
                 {/* Vertical segment of parent's line flow */}
                 <div 
                   className="absolute bg-black print:bg-black w-px -z-10" 
                   style={{ 
                     left: '12px', 
                     top: '0px', 
                     bottom: isChildLast ? 'calc(100% - 24px)' : '0px' // Stop at vertical middle of Title row if last child of dept
                   }}
                 ></div>
                 {/* Horizontal branch line connecting to Title Box */}
                 <div 
                   className="absolute bg-black print:bg-black h-px -z-10" 
                   style={{ 
                     left: '12px', 
                     width: '12px', 
                     top: '24px'
                   }}
                 ></div>

                 {/* Title Row */}
                 <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
                   <div className="flex items-center py-0 z-10 gap-0">
                     {/* Title Box (styled to match department color) */}
                     <div className={`border border-black px-3 py-0 text-[11px] font-semibold text-center min-w-[90px] h-8 leading-8 flex items-center justify-center text-black shrink-0 rounded-sm shadow-xs ${style.bgClass}`}>
                       {child.title}
                     </div>

                     {/* If showing in-line, connect and show employee name boxes right next to it */}
                     {showInLine && (
                       <>
                         {/* Horizontal connector line */}
                         <div className="w-2 h-px bg-black shrink-0"></div>
                         {/* Employee Name Cells */}
                         <div className="flex gap-1.5 items-center">
                           {child.employees.map((emp, idx) => (
                             <div 
                               key={`${emp.id}-${emp.isConcurrent ? 'concurrent' : 'primary'}-${idx}`}
                               className="border border-black px-3 py-0 text-[11px] text-center min-w-[90px] h-8 leading-8 flex items-center justify-center bg-white text-black whitespace-nowrap rounded-sm shadow-xs"
                             >
                               {emp.isConcurrent ? `(兼) ${emp.firstName} ${emp.lastName}` : `${emp.firstName} ${emp.lastName}`}
                             </div>
                           ))}
                         </div>
                       </>
                     )}
                   </div>
                 </div>

                 {/* Employees Block (nested under the Title node ONLY if > 3 employees) */}
                 {!showInLine && (
                   <div className="flex flex-col relative pl-6">
                     {/* Vertical line segment connecting Title to Employees */}
                     <div 
                       className="absolute bg-black print:bg-black w-px -z-10" 
                       style={{ 
                         left: '12px', 
                         top: '0px', 
                         bottom: '24px' // stops at the middle of the employees row (height 48px)
                       }}
                     ></div>
                     {/* Horizontal branch line connecting to Employees Box */}
                     <div 
                       className="absolute bg-black print:bg-black h-px -z-10" 
                       style={{ 
                         left: '12px', 
                         width: '12px', 
                         top: '24px'
                       }}
                     ></div>

                     {/* Employees Name Row */}
                     <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
                       <div className="flex items-center py-0 z-10">
                         {/* Name Cells Grid - up to 5 columns */}
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-w-5xl">
                           {child.employees.map((emp, idx) => (
                             <div 
                               key={`${emp.id}-${emp.isConcurrent ? 'concurrent' : 'primary'}-${idx}`}
                               className="border border-black px-3 text-[11px] text-center min-w-[90px] h-8 leading-8 bg-white text-black whitespace-nowrap rounded-sm shadow-xs"
                             >
                               {emp.isConcurrent ? `(兼) ${emp.firstName} ${emp.lastName}` : `${emp.firstName} ${emp.lastName}`}
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

               </div>
             );
           })}
        </div>
      )}

    </div>
  );
};
