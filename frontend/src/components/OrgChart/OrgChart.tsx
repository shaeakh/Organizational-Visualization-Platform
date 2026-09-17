import React from 'react';
import type { OrgChartNode } from '../../types/index';
import { OrgNode } from './OrgNode';

interface OrgChartProps {
  nodes: OrgChartNode[];
}

export const OrgChart: React.FC<OrgChartProps> = ({ nodes }) => {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-400 text-sm">No organizational data found.</p>
      </div>
    );
  }

  // Recursive component to render a tree branch
  const RenderBranch: React.FC<{ node: OrgChartNode; depth: number }> = ({ node, depth }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div className="flex flex-col items-center select-none w-full">
        {/* Node Box */}
        <OrgNode 
          department={node.department} 
          members={node.members} 
          isRoot={depth === 0} 
        />
        
        {/* Branch Lines & Child Nodes */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full mt-6">
            {/* Vertical Connector Line from Parent */}
            <div className="h-6 w-0.5 bg-slate-300"></div>
            
            {/* Horizontal Line Connecting Siblings */}
            <div className="flex w-full items-start relative">
              {node.children.length > 1 && (
                <div className="absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-slate-300"></div>
              )}
              
              {/* Children Nodes */}
              <div className="flex justify-around w-full gap-6 pt-6">
                {node.children.map((child) => (
                  <div key={child.department.department_id} className="flex-1 flex justify-center relative">
                    {/* Sibling Vertical Top Connector */}
                    {node.children.length > 1 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-0.5 bg-slate-300"></div>
                    )}
                    <RenderBranch node={child} depth={depth + 1} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto p-6 bg-muted rounded-2xl border border-border print:block print:w-full print:max-w-full print:m-0 print:p-0 print:shadow-none print:border-none print:bg-white">
      {/* Top Level Roots Grid (e.g. Sales, Systems, IT Support, Admin) */}
      <div className="flex flex-col gap-16 min-w-[1200px] justify-center items-center py-6">
        <div className="flex justify-center gap-12 items-start w-full">
          {nodes.map((rootNode) => (
            <div 
              key={rootNode.department.department_id} 
              className="flex flex-col items-center shrink-0"
              style={{ width: nodes.length > 1 ? `${100 / nodes.length}%` : '100%' }}
            >
              <RenderBranch node={rootNode} depth={0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
