import {
  AlertTriangle,
  Check,
  CheckSquare,
  Edit2,
  MinusSquare,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type { ConcurrentDuty, Department, User } from "../types/index";
import { api } from "../utils/api";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Bulk selection state (persists across filter changes)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState<boolean>(false);

  // Modal/Form States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [userId, setUserId] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("課員");
  const [email, setEmail] = useState<string>("");
  const [mobilePhone, setMobilePhone] = useState<string>("");
  const [businessPhone, setBusinessPhone] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);
  const [vip, setVip] = useState<boolean>(false);

  // Concurrent duties states
  const [concurrentDuties, setConcurrentDuties] = useState<ConcurrentDuty[]>(
    [],
  );
  const [newDutyDeptId, setNewDutyDeptId] = useState<string>("");
  const [newDutyTitle, setNewDutyTitle] = useState<string>("課員");

  const titles = [
    "代表取締役",
    "本部長",
    "事業部長",
    "部長",
    "課長",
    "担当課長",
    "主任",
    "主任２",
    "課員",
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        api.get<User[]>("/api/users"),
        api.get<Department[]>("/api/departments"),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
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
    setEditingUser(null);
    setUserId("");
    setFirstName("");
    setLastName("");
    setSelectedDeptId("");
    setSelectedTitle("課員");
    setEmail("");
    setMobilePhone("");
    setBusinessPhone("");
    setActive(true);
    setVip(false);
    setConcurrentDuties([]);
    setNewDutyDeptId("");
    setNewDutyTitle("課員");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = async (user: User) => {
    setEditingUser(user);
    setUserId(user.user_id);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setSelectedDeptId(user.department_id || "");
    setSelectedTitle(user.title || "課員");
    setEmail(user.email || "");
    setMobilePhone(user.mobile_phone || "");
    setBusinessPhone(user.business_phone || "");
    setActive(user.active);
    setVip(user.vip);
    setShowModal(true);

    // Fetch concurrent duties
    try {
      const duties = await api.get<ConcurrentDuty[]>(
        `/api/users/${user.user_id}/concurrent-duties`,
      );
      setConcurrentDuties(duties);
    } catch (err: any) {
      console.error("Failed to load concurrent duties:", err);
    }
  };

  const handleAddDuty = async () => {
    if (!editingUser) return;
    if (!newDutyDeptId) {
      alert("Please select a department for the concurrent duty.");
      return;
    }
    try {
      await api.post(`/api/users/${editingUser.user_id}/concurrent-duties`, {
        department_id: newDutyDeptId,
        title: newDutyTitle,
      });
      // Refresh duties list
      const duties = await api.get<ConcurrentDuty[]>(
        `/api/users/${editingUser.user_id}/concurrent-duties`,
      );
      setConcurrentDuties(duties);
      setNewDutyDeptId("");
      setNewDutyTitle("課員");
      fetchData();
    } catch (err: any) {
      alert(`Failed to add concurrent duty: ${err.message}`);
    }
  };

  const handleRemoveDuty = async (dutyId: number) => {
    if (!editingUser) return;
    if (
      !window.confirm("Are you sure you want to remove this concurrent duty?")
    )
      return;
    try {
      await api.delete(
        `/api/users/${editingUser.user_id}/concurrent-duties/${dutyId}`,
      );
      // Refresh duties list
      const duties = await api.get<ConcurrentDuty[]>(
        `/api/users/${editingUser.user_id}/concurrent-duties`,
      );
      setConcurrentDuties(duties);
      fetchData();
    } catch (err: any) {
      alert(`Failed to remove concurrent duty: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert("Please provide full name.");
      return;
    }

    const payload = {
      user_id: editingUser ? userId : undefined,
      first_name: firstName,
      last_name: lastName,
      department_id: selectedDeptId || null,
      title: selectedTitle,
      email: email || null,
      mobile_phone: mobilePhone || null,
      business_phone: businessPhone || null,
      active: active ? 1 : 0,
      vip: vip ? 1 : 0,
    };

    try {
      if (editingUser) {
        // PUT calls SCD Type 2 backend
        await api.put(`/api/users/${editingUser.user_id}`, payload);
        alert(
          "Employee details updated successfully (new version added to database).",
        );
      } else {
        await api.post("/api/users", payload);
        alert("New employee added successfully.");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  // ── Bulk selection handlers ──────────────────────────────────────
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const activeFilteredIds = filteredUsers
      .filter((u) => u.active)
      .map((u) => u.user_id);
    const allSelected = activeFilteredIds.every((id) => selectedUserIds.has(id));
    if (allSelected) {
      // Deselect all filtered active users
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        activeFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all filtered active users
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        activeFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await api.deleteWithBody<{
        deactivated: string[];
        skipped: string[];
      }>("/api/users", { user_ids: Array.from(selectedUserIds) });
      const skippedMsg =
        result.skipped.length > 0
          ? ` ${result.skipped.length} were already inactive and skipped.`
          : "";
      alert(
        `${result.deactivated.length} employee(s) deactivated successfully.${skippedMsg}`
      );
      setSelectedUserIds(new Set());
      setShowBulkConfirmModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Bulk deactivation failed (all changes rolled back): ${err.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate ${user.first_name} ${user.last_name}? This will add a new inactive row version in the database under SCD Type 2.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/users/${user.user_id}`);
      alert("Employee deactivated successfully.");
      fetchData();
    } catch (err: any) {
      alert(`Failed to deactivate: ${err.message}`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const deptName =
      departments
        .find((d) => d.department_id === u.department_id)
        ?.name.toLowerCase() || "";

    return (
      fullName.includes(query) ||
      u.user_id.includes(query) ||
      u.title.toLowerCase().includes(query) ||
      deptName.includes(query)
    );
  });

  // ── Derived values for bulk UI ────────────────────────────────────
  const activeFilteredIds = filteredUsers
    .filter((u) => u.active)
    .map((u) => u.user_id);
  const allActiveFilteredSelected =
    activeFilteredIds.length > 0 &&
    activeFilteredIds.every((id) => selectedUserIds.has(id));
  const someActiveFilteredSelected =
    !allActiveFilteredSelected &&
    activeFilteredIds.some((id) => selectedUserIds.has(id));
  const selectedCount = selectedUserIds.size;

  // Names of selected users for confirmation modal
  const selectedUsersForConfirm = users.filter((u) =>
    selectedUserIds.has(u.user_id)
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search by name, ID, title, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-primary/10"
        >
          <Plus className="h-5 w-5" />
          Add Employee
        </button>
      </div>

      {/* Bulk Action Toolbar — visible when ≥1 user selected */}
      {selectedCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-5 py-3 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-destructive" />
            <span className="text-sm font-semibold text-destructive">
              {selectedCount} employee{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkConfirmModal(true)}
              className="flex items-center gap-1.5 bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Deactivate Selected
            </button>
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Users Table Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Loading...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No employees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  {/* Select-all checkbox */}
                  <th className="pl-5 pr-2 py-4 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title={allActiveFilteredSelected ? "Deselect all" : "Select all active"}
                    >
                      {allActiveFilteredSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : someActiveFilteredSelected ? (
                        <MinusSquare className="h-4 w-4 text-primary/70" />
                      ) : (
                        <div className="h-4 w-4 rounded border-2 border-muted-foreground/40" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const dept = departments.find(
                    (d) => d.department_id === user.department_id,
                  );
                  const isChecked = selectedUserIds.has(user.user_id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isChecked ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Row checkbox */}
                      <td className="pl-5 pr-2 py-4">
                        <button
                          type="button"
                          disabled={!user.active}
                          onClick={() => handleSelectUser(user.user_id)}
                          className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                          title={user.active ? "Select" : "Cannot select inactive employee"}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded border-2 border-muted-foreground/40" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground">
                        {user.user_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                          {user.vip === true && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              VIP
                            </span>
                          )}
                          <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">
                            V{user.version}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium">
                          {user.title}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {dept?.name || "No Department"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={!user.active}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:hover:bg-transparent disabled:opacity-30 rounded-lg transition-colors"
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
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">
                {editingUser
                  ? "Edit Employee (SCD Versioning)"
                  : "Register New Employee"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editingUser && (
                <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex gap-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">SCD Type 2 Warning:</span>
                    Updating information will create a new record version in the
                    database. The previous version's validity will end. History
                    will be preserved.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* User ID */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Employee ID (User ID)
                  </label>
                  <input
                    type="text"
                    value={editingUser ? userId : "Auto-generated"}
                    disabled
                    readOnly
                    className="w-full bg-muted/60 border border-input/60 text-muted-foreground rounded-lg px-3 py-2 text-sm italic opacity-75 cursor-not-allowed"
                  />
                </div>

                {/* VIP Flag */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="vip"
                    checked={vip}
                    onChange={(e) => setVip(e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-input focus:ring-primary"
                  />
                  <label
                    htmlFor="vip"
                    className="text-sm text-foreground font-semibold"
                  >
                    VIP Status (VIP)
                  </label>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g., Shaeakh"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g., Chowdhury"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Title
                  </label>
                  <select
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {titles.map((t) => (
                      <option
                        key={t}
                        value={t}
                        className="bg-card text-foreground"
                      >
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-card text-foreground">
                      Select Department
                    </option>
                    {departments.map((d) => (
                      <option
                        key={d.department_id}
                        value={d.department_id}
                        className="bg-card text-foreground"
                      >
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@syslabo.com"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    placeholder="080-XXXX-XXXX"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Business Phone */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Business Phone Number
                  </label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="03-XXXX-XXXX"
                    className="w-full bg-muted border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Concurrent Duties section (only when editing) */}
              {editingUser && (
                <div className="border-t border-border pt-4 mt-2">
                  <h4 className="font-bold text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                    Concurrent Duties (Secondary Posts)
                  </h4>

                  {/* List of current concurrent duties */}
                  {concurrentDuties.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic mb-4">
                      No concurrent duties assigned.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {concurrentDuties.map((duty) => {
                        const dept = departments.find(
                          (d) => d.department_id === duty.department_id,
                        );
                        return (
                          <div
                            key={duty.id}
                            className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border border-border text-xs"
                          >
                            <div>
                              <span className="font-semibold text-foreground">
                                {dept?.name || duty.department_id}
                              </span>
                              <span className="mx-2 text-muted-foreground">
                                |
                              </span>
                              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[10px] font-medium">
                                {duty.title || "No Title"}
                              </span>
                              {duty.start_date && (
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  from {duty.start_date}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDuty(duty.id)}
                              className="text-destructive hover:text-destructive/80 font-bold p-1 hover:bg-destructive/10 rounded transition-colors"
                              title="Remove Concurrent Duty"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Form to add a new concurrent duty */}
                  <div className="grid grid-cols-3 gap-3 items-end bg-muted/20 p-3.5 rounded-xl border border-border/60">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">
                        Secondary Department
                      </label>
                      <select
                        value={newDutyDeptId}
                        onChange={(e) => setNewDutyDeptId(e.target.value)}
                        className="w-full bg-muted border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Department</option>
                        {departments
                          .filter((d) => d.department_id !== selectedDeptId) // Cannot be the primary department
                          .map((d) => (
                            <option
                              key={d.department_id}
                              value={d.department_id}
                            >
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">
                        Secondary Title
                      </label>
                      <select
                        value={newDutyTitle}
                        onChange={(e) => setNewDutyTitle(e.target.value)}
                        className="w-full bg-muted border border-input text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {titles.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddDuty}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer h-[32px] shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Post
                    </button>
                  </div>
                </div>
              )}

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

      {/* Bulk Deactivate Confirmation Modal */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Bulk Deactivate Employees
              </h3>
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="text-muted-foreground hover:text-foreground"
                disabled={isBulkDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* SCD Warning */}
              <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex gap-2.5 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block">SCD Type 2 Warning:</span>
                  A new inactive version will be created for each employee. Previous versions are preserved in history.
                </div>
              </div>

              {/* Selected employees list */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  The following{" "}
                  <span className="font-bold text-foreground">
                    {selectedCount} employee{selectedCount > 1 ? "s" : ""}
                  </span>{" "}
                  will be deactivated:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-xl p-3 bg-muted/30">
                  {selectedUsersForConfirm.map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center gap-2 text-sm py-0.5"
                    >
                      <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                        {u.user_id}
                      </span>
                      <span className="font-semibold text-foreground">
                        {u.first_name} {u.last_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkConfirmModal(false)}
                  disabled={isBulkDeleting}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-1.5 bg-destructive hover:bg-destructive/90 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {isBulkDeleting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirm Deactivate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
