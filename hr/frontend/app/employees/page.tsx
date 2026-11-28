"use client";

import HRISSidebar from "@/components/HRISSidebar";
import { useEffect, useState } from "react";
import "./employee.css";

const API = process.env.NEXT_PUBLIC_API_URL!;

type Employee = {
  employee_id: number;
  userid: string | null;
  position_id: number | null;
  first_name: string;
  last_name: string;
  birth_date: string;
  contact_no: string;
  email: string | null;
  address: string;
  hire_date: string;
  employment_status: string;
};

type Position = {
  position_id: number;
  position_name: string;
  basic_salary: number;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // Current date
  const [currentDate, setCurrentDate] = useState("");

  // Edit Employee Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null
  );

  // Archive Employees Modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");

  // Archived Employees Search
  const [archiveSearch, setArchiveSearch] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({
    userid: "",
    position_id: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    contact_no: "",
    email: "",
    address: "",
    hire_date: "",
    employment_status: "Active",
  });

  // =========================
  // FETCH EMPLOYEES
  // =========================

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API}/employees/`);

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH POSITIONS
  // =========================

  const fetchPositions = async () => {
    try {
      const response = await fetch(`${API}/positions/`);

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    fetchEmployees();
    fetchPositions();
  }, []);

  // =========================
  // EDIT EMPLOYEE
  // =========================

  const handleEditClick = (employee: Employee) => {
    setEditingEmployeeId(employee.employee_id);

    setEditForm({
      userid: employee.userid || "",
      position_id:
        employee.position_id !== null
          ? String(employee.position_id)
          : "",
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      birth_date: employee.birth_date
        ? employee.birth_date.substring(0, 10)
        : "",
      contact_no: employee.contact_no || "",
      email: employee.email || "",
      address: employee.address || "",
      hire_date: employee.hire_date
        ? employee.hire_date.substring(0, 10)
        : "",
      employment_status: employee.employment_status || "Active",
    });

    setShowEditModal(true);
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployeeId === null) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/employees/${editingEmployeeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: editForm.userid || null,
            position_id: editForm.position_id
              ? Number(editForm.position_id)
              : null,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            birth_date: editForm.birth_date || null,
            contact_no: editForm.contact_no,
            email: editForm.email || null,
            address: editForm.address,
            hire_date: editForm.hire_date,
            employment_status: editForm.employment_status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to update employee.");
        return;
      }

      alert("Employee updated successfully!");

      setShowEditModal(false);
      setEditingEmployeeId(null);

      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Something went wrong while updating the employee.");
    }
  };

  // =========================
  // ARCHIVE EMPLOYEE
  // =========================

  const handleArchive = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive ${employee.first_name} ${employee.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/employees/${employee.employee_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: employee.userid,
            position_id: employee.position_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            birth_date: employee.birth_date
              ? employee.birth_date.substring(0, 10)
              : null,
            contact_no: employee.contact_no,
            email: employee.email,
            address: employee.address,
            hire_date: employee.hire_date
              ? employee.hire_date.substring(0, 10)
              : null,
            employment_status: "Archived",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to archive employee.");
        return;
      }

      alert("Employee archived successfully!");

      fetchEmployees();
    } catch (error) {
      console.error("Error archiving employee:", error);
      alert("Something went wrong while archiving the employee.");
    }
  };

  // =========================
  // RESTORE EMPLOYEE
  // =========================

  const handleRestore = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to restore ${employee.first_name} ${employee.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/employees/${employee.employee_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: employee.userid,
            position_id: employee.position_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            birth_date: employee.birth_date
              ? employee.birth_date.substring(0, 10)
              : null,
            contact_no: employee.contact_no,
            email: employee.email,
            address: employee.address,
            hire_date: employee.hire_date
              ? employee.hire_date.substring(0, 10)
              : null,
            employment_status: "Active",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to restore employee.");
        return;
      }

      alert("Employee restored successfully!");

      fetchEmployees();
    } catch (error) {
      console.error("Error restoring employee:", error);
      alert("Something went wrong while restoring the employee.");
    }
  };

  // =========================
  // FILTER ACTIVE EMPLOYEES
  // =========================

  const filteredEmployees = employees
    .filter((employee) => {
      // Archived employees are hidden from the main Employee Records page.
      if (employee.employment_status === "Archived") {
        return false;
      }

      const fullName =
        `${employee.first_name} ${employee.last_name}`.toLowerCase();

      const searchMatch =
        fullName.includes(search.toLowerCase()) ||
        (employee.userid ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (employee.email ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "All" ||
        employee.employment_status === statusFilter;

      const positionMatch =
        positionFilter === "All" ||
        String(employee.position_id) === positionFilter;

      return searchMatch && statusMatch && positionMatch;
    })
    .sort((a, b) => {
      const dateA = a.hire_date
        ? new Date(a.hire_date).getTime()
        : 0;

      const dateB = b.hire_date
        ? new Date(b.hire_date).getTime()
        : 0;

      return dateB - dateA;
    });

  // =========================
  // ARCHIVED EMPLOYEES
  // =========================

  const archivedEmployees = employees
    .filter(
      (employee) => employee.employment_status === "Archived"
    )
    .sort((a, b) => {
      const dateA = a.hire_date
        ? new Date(a.hire_date).getTime()
        : 0;

      const dateB = b.hire_date
        ? new Date(b.hire_date).getTime()
        : 0;

      return dateB - dateA;
    });

  // Search archived employees
  const filteredArchivedEmployees = archivedEmployees.filter((employee) => {
    const searchTerm = archiveSearch.toLowerCase();

    const fullName =
      `${employee.first_name} ${employee.last_name}`.toLowerCase();

    return (
      fullName.includes(searchTerm) ||
      (employee.userid ?? "").toLowerCase().includes(searchTerm) ||
      (employee.email ?? "").toLowerCase().includes(searchTerm)
    );
  });

  // =========================
  // STATISTICS
  // =========================

  const totalEmployees = employees.filter(
    (employee) => employee.employment_status !== "Archived"
  ).length;

  const activeEmployees = employees.filter(
    (employee) => employee.employment_status === "Active"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.employment_status === "Inactive"
  ).length;

  const leaveEmployees = employees.filter(
    (employee) => employee.employment_status === "Leave"
  ).length;

  // =========================
  // GET POSITION NAME
  // =========================

  const getPositionName = (positionId: number | null) => {
    if (positionId === null) {
      return "No Position";
    }

    const position = positions.find(
      (item) => item.position_id === positionId
    );

    return position ? position.position_name : "Unknown Position";
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status: string) => {
    if (status === "Active") {
      return "active";
    }

    if (status === "Leave") {
      return "leave";
    }

    if (status === "Archived") {
      return "inactive";
    }

    return "inactive";
  };

  return (
    <div className="employees-page">
      <HRISSidebar />

      <main className="main-content">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1>Employees</h1>

            <p>
              Manage employee information and records
            </p>
          </div>

          <div className="date">
            {currentDate}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">TOTAL EMPLOYEES</div>

            <div className="stat-number">
              {totalEmployees}
            </div>

            <div className="stat-description">
              All registered employees
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">ACTIVE EMPLOYEES</div>

            <div className="stat-number">
              {activeEmployees}
            </div>

            <div className="stat-description">
              Currently employed
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">ON LEAVE</div>

            <div className="stat-number">
              {leaveEmployees}
            </div>

            <div className="stat-description">
              Employees currently on leave
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">INACTIVE</div>

            <div className="stat-number">
              {inactiveEmployees}
            </div>

            <div className="stat-description">
              Inactive employees
            </div>
          </div>
        </div>

        {/* EMPLOYEE CARD */}
        <div className="employee-card">
          <div className="card-header">
            <div>
              <h2>Employee Records</h2>

              <p>
                View and manage all employee records
              </p>
            </div>

            {/* ARCHIVED EMPLOYEES BUTTON */}
            <button
              className="edit-button"
              onClick={() => {
                setArchiveSearch("");
                setShowArchiveModal(true);
              }}
            >
              Archived Employees
            </button>
          </div>

          {/* FILTERS */}
          <div className="filters">
            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Leave">Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="All">All Positions</option>

              {positions.map((position) => (
                <option
                  key={position.position_id}
                  value={position.position_id}
                >
                  {position.position_name}
                </option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="loading">
              Loading employees...
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>USER ID</th>
                    <th>POSITION</th>
                    <th>CONTACT</th>
                    <th>EMAIL</th>
                    <th>HIRE DATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="no-data">
                          No employees found.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.employee_id}>
                        <td>
                          <div className="employee-name">
                            <div className="employee-avatar">
                              {employee.first_name.charAt(0)}
                              {employee.last_name.charAt(0)}
                            </div>

                            <div>
                              <strong>
                                {employee.first_name}{" "}
                                {employee.last_name}
                              </strong>

                              <small>
                                ID: {employee.employee_id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{employee.userid || "-"}</td>

                        <td>
                          {getPositionName(employee.position_id)}
                        </td>

                        <td>{employee.contact_no}</td>

                        <td>{employee.email || "-"}</td>

                        <td>
                          {employee.hire_date
                            ? new Date(
                                employee.hire_date
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          <span
                            className={`status ${getStatusClass(
                              employee.employment_status
                            )}`}
                          >
                            {employee.employment_status}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              className="edit-button"
                              onClick={() =>
                                handleEditClick(employee)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleArchive(employee)
                              }
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-footer">
            Showing {filteredEmployees.length} of{" "}
            {totalEmployees} employees
          </div>
        </div>
      </main>

      {/* =========================
          ARCHIVED EMPLOYEES MODAL
      ========================= */}

      {showArchiveModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowArchiveModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Archived Employees</h2>

                <p>
                  View and restore archived employee records
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowArchiveModal(false)}
              >
                ×
              </button>
            </div>

            {/* ARCHIVED EMPLOYEE SEARCH */}
            <div className="archive-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search archived employees..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>USER ID</th>
                    <th>POSITION</th>
                    <th>HIRE DATE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredArchivedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="no-data">
                          {archiveSearch
                            ? "No archived employees found matching your search."
                            : "No archived employees found."}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredArchivedEmployees.map((employee) => (
                      <tr key={employee.employee_id}>
                        <td>
                          <div className="employee-name">
                            <div className="employee-avatar">
                              {employee.first_name.charAt(0)}
                              {employee.last_name.charAt(0)}
                            </div>

                            <div>
                              <strong>
                                {employee.first_name}{" "}
                                {employee.last_name}
                              </strong>

                              <small>
                                ID: {employee.employee_id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{employee.userid || "-"}</td>

                        <td>
                          {getPositionName(employee.position_id)}
                        </td>

                        <td>
                          {employee.hire_date
                            ? new Date(
                                employee.hire_date
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          <span className="status inactive">
                            Archived
                          </span>
                        </td>

                        <td>
                          <button
                            className="edit-button"
                            onClick={() =>
                              handleRestore(employee)
                            }
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              {filteredArchivedEmployees.length} of{" "}
              {archivedEmployees.length} archived employee
              {archivedEmployees.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          EDIT EMPLOYEE MODAL
      ========================= */}

      {showEditModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit Employee</h2>

                <p>
                  Update the employee information below
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>User ID</label>

                  <input
                    type="text"
                    name="userid"
                    value={editForm.userid}
                    onChange={handleEditFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Position</label>

                  <select
                    name="position_id"
                    value={editForm.position_id}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">
                      Select Position
                    </option>

                    {positions.map((position) => (
                      <option
                        key={position.position_id}
                        value={position.position_id}
                      >
                        {position.position_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>First Name</label>

                  <input
                    type="text"
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>

                  <input
                    type="text"
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Birth Date</label>

                  <input
                    type="date"
                    name="birth_date"
                    value={editForm.birth_date}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>

                  <input
                    type="text"
                    name="contact_no"
                    value={editForm.contact_no}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hire Date</label>

                  <input
                    type="date"
                    name="hire_date"
                    value={editForm.hire_date}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Employment Status</label>

                  <select
                    name="employment_status"
                    value={editForm.employment_status}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Leave">Leave</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Address</label>

                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
