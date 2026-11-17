import React from "react";
import "../styles/OrderTracker.css";

const STAGES = [
  "CONFIRMED",
  "FABRIC_CUTTING",
  "STITCHING",
  "FINISHING_QC",
  "DISPATCHED",
  "DELIVERED",
];

export default function OrderTracker({ order }) {
  const currentIdx = STAGES.indexOf(order.status);

  return (
    <div className="order-card">
      <div className="order-header">
        <div>
          <strong>Order #{order.orderNumber}</strong>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {order.items?.[0]?.product?.name || "Custom Outfit"} • ₹
            {order.totalAmount} ({order.paymentStatus})
          </div>
        </div>
        <span
          className={`status-pill ${order.status === "CANCELLED" ? "cancelled" : ""}`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div style={{ fontSize: "0.9rem" }}>
        <strong>Delivery Address:</strong> {order.shippingAddress}
      </div>

      {order.status === "CANCELLED" ? (
        <p
          style={{ color: "var(--danger)", fontWeight: 600, marginTop: "10px" }}
        >
          Cancelled: {order.cancellationReason || "Cancelled by boutique"}
        </p>
      ) : (
        <div className="tracker-steps">
          {STAGES.map((stage, idx) => (
            <div
              key={stage}
              className={`step-badge ${idx <= currentIdx ? "completed" : ""}`}
            >
              {stage.replace("_", " ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
