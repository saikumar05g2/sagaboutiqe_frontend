import React, { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { storeApi } from "../api/storeApi";
import { useFeedback } from "./FeedbackContext";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  genderType: "WOMEN",
  unit: "INCHES",
  measurements: {},
  specifications: "",
  totalAmount: "",
  advanceAmount: "",
};

export default function OfflineCustomersSection({
  editingRecord,
  onSaved,
  onCancelEdit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [dynamicFields, setDynamicFields] = useState({ WOMEN: [], MEN: [] });
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useFeedback();

  useEffect(() => {
    storeApi.getMeasurementFields().then((res) => {
      const list = res.data.data || [];
      setDynamicFields({
        WOMEN: list.filter((f) => f.genderType === "WOMEN").map((f) => f.label),
        MEN: list.filter((f) => f.genderType === "MEN").map((f) => f.label),
      });
    });
  }, []);

  useEffect(() => {
    if (editingRecord) {
      setForm({
        name: editingRecord.name || "",
        phone: editingRecord.phone || "",
        email: editingRecord.email || "",
        genderType: editingRecord.genderType || "WOMEN",
        unit: editingRecord.unit || "INCHES",
        measurements: editingRecord.measurements || {},
        specifications: editingRecord.specifications || "",
        totalAmount: String(editingRecord.totalAmount ?? ""),
        advanceAmount: String(editingRecord.advanceAmount ?? ""),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingRecord]);

  const totalNum = parseFloat(form.totalAmount) || 0;
  const advanceNum = parseFloat(form.advanceAmount) || 0;
  const balanceNum = Math.max(0, totalNum - advanceNum);

  const handleMeasurementChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRecord?.id) {
        await adminApi.updateOfflineCustomer(editingRecord.id, form);
        showSnackbar(`Updated "${form.name}" successfully!`, "success");
      } else {
        await adminApi.createOfflineCustomer(form);
        showSnackbar(`Added walk-in customer "${form.name}"!`, "success");
      }
      setForm(EMPTY_FORM);
      if (onSaved) onSaved();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save customer record.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const templateList = dynamicFields[form.genderType] || [];
  const existingKeys = Object.keys(form.measurements || {});
  const activeFields = Array.from(new Set([...templateList, ...existingKeys]));

  return (
    <form className="custom-box" onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h3 style={{ margin: 0, color: "var(--emerald-primary)" }}>
          {editingRecord
            ? `Edit Walk-in Customer: ${form.name}`
            : "Add Offline / Walk-in Customer"}
        </h3>
        {editingRecord && (
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={() => {
              setForm(EMPTY_FORM);
              if (onCancelEdit) onCancelEdit();
            }}
          >
            Cancel Edit & Create New
          </button>
        )}
      </div>

      {/* Contact Details */}
      <div
        className="measure-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <div className="input-group">
          <label>Customer Full Name *</label>
          <input
            placeholder="e.g., Madhavi Latha"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input
            placeholder="e.g., 9876543210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Email ID (Optional)</label>
          <input
            type="email"
            placeholder="customer@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      {/* Template & Unit Switchers */}
      <div
        className="unit-row"
        style={{ marginTop: "10px", flexWrap: "wrap", gap: "12px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>Measurement Template:</strong>
          <div className="unit-switch">
            {["WOMEN", "MEN"].map((g) => (
              <button
                key={g}
                type="button"
                className={form.genderType === g ? "active" : ""}
                onClick={() => setForm({ ...form, genderType: g })}
              >
                {g === "WOMEN" ? "Women Tailoring" : "Men Tailoring"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>Unit:</strong>
          <div className="unit-switch">
            {["INCHES", "CM"].map((u) => (
              <button
                key={u}
                type="button"
                className={form.unit === u ? "active" : ""}
                onClick={() => setForm({ ...form, unit: u })}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Body Measurements */}
      <div className="measure-grid">
        {activeFields.map((field) => (
          <div className="input-group" key={field}>
            <label>
              {field} ({form.unit.toLowerCase()})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={form.measurements?.[field] || ""}
              onChange={(e) => handleMeasurementChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Specifications & Tailoring Notes */}
      <div className="input-group">
        <label>Specifications & Custom Tailoring Notes</label>
        <textarea
          rows="3"
          placeholder="Write outfit type, neck design, sleeve pattern, lining details, delivery date, or alteration notes..."
          value={form.specifications}
          onChange={(e) => setForm({ ...form, specifications: e.target.value })}
        />
      </div>

      {/* Billing Summary */}
      <div
        className="measure-grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          backgroundColor: "var(--bg-sand)",
          padding: "16px",
          borderRadius: "8px",
          marginTop: "8px",
        }}
      >
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Total Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
            required
          />
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Advance Paid (₹)</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.advanceAmount}
            onChange={(e) =>
              setForm({ ...form, advanceAmount: e.target.value })
            }
            required
          />
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Balance Due (₹) — Auto-Calculated</label>
          <input
            type="text"
            readOnly
            value={`₹${balanceNum.toFixed(2)}`}
            style={{
              fontWeight: 800,
              color: balanceNum > 0 ? "var(--danger)" : "#166534",
              backgroundColor: "#FFFFFF",
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-gold"
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "1rem",
          marginTop: "18px",
        }}
        disabled={saving}
      >
        {saving
          ? "Saving Customer Record..."
          : editingRecord
            ? "Save Updated Customer Details"
            : "Save Walk-in Customer & Measurements"}
      </button>
    </form>
  );
}
