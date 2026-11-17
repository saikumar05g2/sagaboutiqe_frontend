import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeApi } from "../api/storeApi";
import { useFeedback } from "../components/FeedbackContext";
import "../styles/MeasurementForm.css";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const { showSnackbar } = useFeedback();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = isRegister
        ? await storeApi.register(form)
        : await storeApi.login(form);
      localStorage.setItem("saga_token", res.data.token);
      localStorage.setItem("saga_user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
      showSnackbar(
        `Welcome to SAGA Boutique, ${res.data.user.name}!`,
        "success",
      );
      navigate(res.data.user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      showSnackbar(
        err.response?.data?.message ||
          "Authentication failed. Check your credentials.",
        "error",
      );
    }
  };

  return (
    <div className="container" style={{ maxWidth: "440px" }}>
      <form className="custom-box" onSubmit={handleSubmit}>
        <h3 style={{ marginTop: 0 }}>
          {isRegister ? "Create SAGA Account" : "Login to SAGA Boutique"}
        </h3>

        {isRegister && (
          <div className="input-group">
            <label>Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        )}

        <div className="input-group">
          <label>Mobile Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p
          style={{
            cursor: "pointer",
            textAlign: "center",
            marginTop: "14px",
            fontSize: "0.9rem",
          }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New to SAGA Boutique? Register"}
        </p>
      </form>
    </div>
  );
}
