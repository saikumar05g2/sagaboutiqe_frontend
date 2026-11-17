import React, { useEffect, useState } from "react";
import { storeApi } from "../api/storeApi";
import "../styles/MeasurementForm.css";

export default function MeasurementForm({ gender = "WOMEN", onChange }) {
  const [unit, setUnit] = useState("INCHES");
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setLoadingFields(true);
    storeApi
      .getMeasurementFields()
      .then((res) => {
        const allFields = res.data.data || [];
        const filtered = allFields
          .filter((f) => f.genderType === gender)
          .map((f) => f.label);
        setFields(filtered);
      })
      .finally(() => setLoadingFields(false));
  }, [gender]);

  const handleUpdate = (field, val) => {
    const next = { ...values, [field]: val };
    setValues(next);
    onChange({ unit, measurements: next, stitchingNotes: notes });
  };

  const handleNotes = (val) => {
    setNotes(val);
    onChange({ unit, measurements: values, stitchingNotes: val });
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    onChange({ unit: newUnit, measurements: values, stitchingNotes: notes });
  };

  return (
    <div className="custom-box">
      <div className="unit-row">
        <strong>
          Custom Body Measurements (
          {gender === "WOMEN" ? "Women Tailoring" : "Men Tailoring"})
        </strong>
        <div className="unit-switch">
          {["INCHES", "CM"].map((u) => (
            <button
              key={u}
              type="button"
              className={unit === u ? "active" : ""}
              onClick={() => handleUnitChange(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {loadingFields ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Loading tailoring measurement fields...
        </p>
      ) : (
        <div className="measure-grid">
          {fields.map((field) => (
            <div className="input-group" key={field}>
              <label>
                {field} ({unit.toLowerCase()})
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                placeholder="0.0"
                value={values[field] || ""}
                onChange={(e) => handleUpdate(field, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="input-group">
        <label>Custom Stitching & Design Instructions</label>
        <textarea
          rows="3"
          placeholder="Specify neck design, sleeve style, lining, slim/regular fit, or seam margins..."
          value={notes}
          onChange={(e) => handleNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
