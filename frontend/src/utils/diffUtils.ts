import type { Employee } from "../types";

export interface TransferredEmployee {
  employee: Employee;
  oldDepartment: string;
  newDepartment: string;
  oldTitle: string;
  newTitle: string;
}

export interface DiffResult {
  added: Employee[];
  removed: Employee[];
  transferred: TransferredEmployee[];
  unchanged: Employee[];
  summary: {
    addedCount: number;
    removedCount: number;
    transferredCount: number;
    unchangedCount: number;
  };
}

/**
 * Computes difference between two snapshots (Snapshot A = Base, Snapshot B = Target)
 */
export function computeOrgDiff(
  employeesA: Employee[],
  employeesB: Employee[],
): DiffResult {
  const mapA = new Map<string, Employee>();
  employeesA.forEach((e) => mapA.set(e.id, e));

  const mapB = new Map<string, Employee>();
  employeesB.forEach((e) => mapB.set(e.id, e));

  const added: Employee[] = [];
  const removed: Employee[] = [];
  const transferred: TransferredEmployee[] = [];
  const unchanged: Employee[] = [];

  // Check employees in Snapshot B
  employeesB.forEach((empB) => {
    const empA = mapA.get(empB.id);
    if (!empA) {
      // Present in B but not in A -> Added
      added.push(empB);
    } else {
      // Present in both -> check if department or title changed
      const deptChanged = empA.department !== empB.department;
      const titleChanged = empA.title !== empB.title;

      if (deptChanged || titleChanged) {
        transferred.push({
          employee: empB,
          oldDepartment: empA.department,
          newDepartment: empB.department,
          oldTitle: empA.title,
          newTitle: empB.title,
        });
      } else {
        unchanged.push(empB);
      }
    }
  });

  // Check employees in Snapshot A not in Snapshot B -> Removed
  employeesA.forEach((empA) => {
    if (!mapB.has(empA.id)) {
      removed.push(empA);
    }
  });

  return {
    added,
    removed,
    transferred,
    unchanged,
    summary: {
      addedCount: added.length,
      removedCount: removed.length,
      transferredCount: transferred.length,
      unchangedCount: unchanged.length,
    },
  };
}
