import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { Department, User } from '../types/index';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, GitPullRequest } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal/Form States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form fields
  const [deptId, setDeptId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [parentDeptId, setParentDeptId] = useState<string>('');
  const [deptHead, setDeptHead] = useState<string>('');
  const [primaryContact, setPrimaryContact] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [headCount, setHeadCount] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsData, usersData] = await Promise.all([
        api.get<Department[]>('/api/departments'),
        api.get<User[]>('/api/users'),
      ]);
      setDepartments(deptsData);
      setUsers(usersData);
    } catch (err: any) {
      alert(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingDept(null);
    setDeptId('');
    setName('');
    setParentDeptId('');
    setDeptHead('');
    setPrimaryContact('');
    setDescription('');
    setHeadCount('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptId(dept.department_id);
    setName(dept.name);
    setParentDeptId(dept.parent_department_id || '');
    setDeptHead(dept.department_head || '');
    setPrimaryContact(dept.primary_contact || '');
    setDescription(dept.description || '');
    setHeadCount(dept.head_count ? String(dept.head_count) : '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Department Name is required.');
      return;
    }

    const payload = {
      department_id: editingDept ? deptId : undefined,
      name: name,
      parent_department_id: parentDeptId || null,
      department_head: deptHead || null,
      primary_contact: primaryContact || null,
      description: description || null,
      head_count: headCount ? Number(headCount) : null,
    };

    try {
      if (editingDept) {
        // PUT calls SCD Type 2 backend
        await api.put(`/api/departments/${editingDept.department_id}`, payload);
        alert('Department information updated successfully (new version added to database).');
      } else {
        await api.post('/api/departments', payload);
        alert('New department created successfully.');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Are you sure you want to deactivate/retire the "${dept.name}" department? Sub-departments under it will automatically move to the root level.`)) {
      return;
    }

    try {
      await api.delete(`/api/departments/${dept.department_id}`);
      alert('Department deactivated successfully.');
      fetchData();
    } catch (err: any) {
      alert(`Failed to deactivate: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-base">Company Organizational Departments</h3>
          <p className="text-xs text-muted-foreground mt-1">All departments are tracked via SCD Type 2 history tracking.</p>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-primary/10 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Create Department
        </button>
      </div>

      {/* Departments List Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No departments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <th className="px-6 py-4">Department ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Parent Department</th>
                  <th className="px-6 py-4">Department Head</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departments.map((dept) => {
                  const parent = departments.find(d => d.department_id === dept.parent_department_id);
                  return (
                    <tr key={dept.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground">{dept.department_id}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{dept.name}</td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        {parent ? (
                          <span className="flex items-center gap-1">
                            <GitPullRequest className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {parent.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 italic">None (Root Level)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground/90 font-medium">{dept.department_head || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">V{dept.version}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(dept)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-border">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">
                {editingDept ? 'Edit Department (SCD Versioning)' : 'Add New Department'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editingDept && (
                <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex gap-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">SCD Type 2 Warning:</span>
                    Updating information will create a new version in the database. The previous version's validity will end. History will be preserved.
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Dept ID */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Department ID</label>
                  <input
                    type="text"
                    value={editingDept ? deptId : "Auto-generated"}
                    disabled
                    readOnly
                    className="w-full bg-muted/60 border border-input/60 text-muted-foreground rounded-lg px-3 py-2 text-sm italic opacity-75 cursor-not-allowed"
                  />
                </div>

                {/* Dept Name */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Department Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., ITサポート事業部"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Parent Dept */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Parent Department</label>
                  <select
                    value={parentDeptId}
                    onChange={(e) => setParentDeptId(e.target.value)}
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-card text-foreground">None (Root Level)</option>
                    {departments
                      .filter(d => d.department_id !== deptId) // Cannot parent to itself
                      .map((d) => (
                        <option key={d.department_id} value={d.department_id} className="bg-card text-foreground">
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Department Head */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Department Head</label>
                  <select
                    value={deptHead}
                    onChange={(e) => setDeptHead(e.target.value)}
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-card text-foreground">Select</option>
                    {users
                      .filter(u => Boolean(u.active) || `${u.first_name} ${u.last_name}` === deptHead)
                      .map(u => (
                        <option key={u.user_id} value={`${u.first_name} ${u.last_name}`} className="bg-card text-foreground">
                          {u.first_name} {u.last_name} ({u.title})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 font-medium">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of department"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm shadow-primary/10 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
