import React, { useState } from "react";
import { adminApi } from "../api/adminApi";
import { useFeedback } from "./FeedbackContext";
import MeasurementSpecCell from "./MeasurementSpecCell";

export default function OfflineCustomersList({
  records,
  onRefresh,
  onEditCustomer,
}) {
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const { showSnackbar, confirmModal } = useFeedback();

  const filteredRecords = records.filter((rec) => {
    const matchesName = rec.name
      .toLowerCase()
      .includes(nameFilter.trim().toLowerCase());
    const matchesPhone = rec.phone.includes(phoneFilter.trim());
    return matchesName && matchesPhone;
  });

  const handleDelete = async (rec) => {
    const ok = await confirmModal({
      title: "Delete Offline Customer",
      message: `Are you sure you want to delete "${rec.name}" (${rec.phone}) and their measurement record?`,
      confirmText: "Delete Customer",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await adminApi.deleteOfflineCustomer(rec.id);
      showSnackbar(`Offline customer "${rec.name}" deleted.`, "success");
      onRefresh();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Unable to delete customer.",
        "error",
      );
    }
  };

  return (
    <div>
      {/* Dedicated Filter Bar for Name & Phone Number */}
      <div
        className="custom-box"
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "flex-end",
          flexWrap: "wrap",
          padding: "18px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          className="input-group"
          style={{ marginBottom: 0, flex: "1 1 220px" }}
        >
          <label>Filter by Customer Name</label>
          <input
            type="text"
            placeholder="Search customer name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>

        <div
          className="input-group"
          style={{ marginBottom: 0, flex: "1 1 220px" }}
        >
          <label>Filter by Phone Number</label>
          <input
            type="text"
            placeholder="Search mobile number..."
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
          />
        </div>

        {(nameFilter || phoneFilter) && (
          <button
            type="button"
            className="btn-modal-cancel"
            style={{ height: "42px" }}
            onClick={() => {
              setNameFilter("");
              setPhoneFilter("");
            }}
          >
            Clear Filters
          </button>
        )}

        <div
          style={{
            marginLeft: "auto",
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--emerald-primary)",
          }}
        >
          Showing {filteredRecords.length} of {records.length} customers
        </div>
      </div>

      {/* Offline Customers Directory Table */}
      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          {records.length === 0
            ? 'No offline customers added yet. Use "+ Add Offline Customer" to record a walk-in client.'
            : "No offline customers match your name or phone number filter."}
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Mobile & Email</th>
              <th>Body Measurements</th>
              <th>Specifications / Notes</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((rec) => (
              <tr key={rec.id}>
                <td>
                  <strong>{rec.name}</strong>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "var(--bg-sand)",
                      }}
                    >
                      {rec.genderType} • {rec.unit}
                    </span>
                  </div>
                </td>

                <td>
                  <div>
                    <strong>{rec.phone}</strong>
                  </div>
                  {rec.email && (
                    <div
                      style={{
                        fontSize: "0.83rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {rec.email}
                    </div>
                  )}
                </td>

                <td>
                  <MeasurementSpecCell
                    customerName={rec.name}
                    subtitle={`${rec.phone} • ${rec.genderType === "WOMEN" ? "Women Tailoring" : "Men Tailoring"}`}
                    unit={rec.unit}
                    measurements={rec.measurements}
                    notes={rec.specifications}
                  />
                </td>

                <td style={{ maxWidth: "220px", whiteSpace: "pre-wrap" }}>
                  {rec.specifications || (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>

                <td>
                  <div>
                    Total: <strong>₹{rec.totalAmount}</strong>
                  </div>
                  <div style={{ color: "#166534" }}>
                    Advance: <strong>₹{rec.advanceAmount}</strong>
                  </div>
                  <div
                    style={{
                      color:
                        rec.balanceAmount > 0 ? "var(--danger)" : "#166534",
                      fontWeight: 700,
                    }}
                  >
                    Balance: ₹{rec.balanceAmount}
                  </div>
                </td>

                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "7px 14px", fontSize: "0.84rem" }}
                      onClick={() => onEditCustomer(rec)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(rec)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
