import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storeApi } from "../api/storeApi";
import { useFeedback } from "../components/FeedbackContext";
import "../styles/CartAndGallery.css";
import "../styles/MeasurementForm.css";

export default function CartPage({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) {
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewOverrides, setPreviewOverrides] = useState({});
  const { showSnackbar, showModal } = useFeedback();
  const navigate = useNavigate();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.basePrice * item.quantity,
    0,
  );

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        shippingAddress: address,
        cartItems: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          measurementSnapshot: item.measurementSnapshot,
          stitchingNotes: item.stitchingNotes,
        })),
      };

      const { data } = await storeApi.createCheckout(payload);

      if (data.mockMode) {
        onClearCart();
        await showModal({
          title: "Order Confirmed!",
          message: `Thank you! Your order ${data.order.orderNumber} has been received by our master tailors. You can track every stitching stage live.`,
          confirmText: "Track My Order",
        });
        navigate("/my-orders");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: "INR",
        name: "SAGA Boutique",
        description: `Order ${data.order.orderNumber}`,
        order_id: data.razorpay.orderId,
        handler: async (response) => {
          await storeApi.verifyPayment({ orderId: data.order.id, ...response });
          onClearCart();
          await showModal({
            title: "Payment Successful & Order Confirmed!",
            message: `Order ${data.order.orderNumber} is now in our tailoring queue.`,
            confirmText: "Track My Order",
          });
          navigate("/my-orders");
        },
      });
      rzp.open();
    } catch (err) {
      if (err.response?.status === 401) {
        showSnackbar("Please log in to complete your order.", "error");
        navigate("/login");
      } else {
        showSnackbar(
          err.response?.data?.message || "Checkout failed.",
          "error",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3 style={{ marginTop: 0 }}>Your SAGA Boutique Cart is empty</h3>
          <p>
            Explore bespoke blouses, lehengas, blazers, and formal wear crafted
            to your fit.
          </p>
          <Link to="/" className="btn-gold">
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="cart-layout">
        <div className="cart-items-panel">
          <div className="cart-panel-header">
            <h2>
              Shopping Bag ({totalItems} {totalItems === 1 ? "item" : "items"})
            </h2>
            <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
              Price
            </span>
          </div>

          {cart.map((item) => {
            const imgs = item.product.images || [];
            const activeCover =
              previewOverrides[item.cartItemId] ||
              imgs[0] ||
              "https://placehold.co/200x240/F0ECE3/1E1E1E?text=SAGA";

            return (
              <div className="cart-row" key={item.cartItemId}>
                <div className="cart-media-col">
                  <img
                    className="cart-cover-img"
                    src={activeCover}
                    alt={item.product.name}
                  />
                  {imgs.length > 1 && (
                    <div className="cart-mini-strip">
                      {imgs.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Angle ${idx + 1}`}
                          onClick={() =>
                            setPreviewOverrides((prev) => ({
                              ...prev,
                              [item.cartItemId]: src,
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="cart-info-col">
                  <div className="cart-item-title-row">
                    <h3 className="cart-item-title">{item.product.name}</h3>
                    <span className="cart-item-price">
                      ₹{item.product.basePrice * item.quantity}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#166534",
                      fontWeight: 700,
                    }}
                  >
                    In Stock • Handcrafted by SAGA Master Tailors
                  </span>

                  <div className="cart-meta-badges">
                    <span className="meta-chip">Size: {item.selectedSize}</span>
                    <span className="meta-chip">
                      Color: {item.selectedColor}
                    </span>
                    <span className="meta-chip">
                      Unit Price: ₹{item.product.basePrice}
                    </span>
                  </div>

                  {item.selectedSize === "CUSTOMISED" &&
                    item.measurementSnapshot?.measurements && (
                      <div className="custom-fit-box">
                        <strong>
                          Custom Body Measurements (
                          {item.measurementSnapshot.unit}):{" "}
                        </strong>
                        {Object.entries(item.measurementSnapshot.measurements)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" • ")}
                        {item.stitchingNotes && (
                          <div
                            style={{
                              marginTop: "4px",
                              color: "var(--text-muted)",
                            }}
                          >
                            <em>Note: {item.stitchingNotes}</em>
                          </div>
                        )}
                      </div>
                    )}

                  <div className="cart-actions-bar">
                    <div className="qty-stepper">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.cartItemId,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.cartItemId,
                            Math.min(
                              item.product.stockQuantity,
                              item.quantity + 1,
                            ),
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="remove-link-btn"
                      onClick={() => {
                        onRemoveItem(item.cartItemId);
                        showSnackbar("Item removed from bag.", "success");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form className="cart-summary-card" onSubmit={handleCheckout}>
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Order Summary</h3>

          <div className="summary-row">
            <span>Items ({totalItems}):</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="summary-row">
            <span>Bespoke Tailoring & QC:</span>
            <span style={{ color: "#166534", fontWeight: 600 }}>Included</span>
          </div>
          <div className="summary-row">
            <span>Delivery:</span>
            <span style={{ color: "#166534", fontWeight: 600 }}>FREE</span>
          </div>

          <div className="summary-total-row">
            <span>Order Total:</span>
            <span>₹{totalAmount}</span>
          </div>

          <div className="input-group">
            <label>Delivery Address (Door No, Street, City, Pincode)</label>
            <textarea
              rows="3"
              placeholder="Enter complete delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-gold"
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
            disabled={submitting}
          >
            {submitting
              ? "Processing Order..."
              : `Proceed to Buy (${totalItems} ${totalItems === 1 ? "item" : "items"})`}
          </button>
        </form>
      </div>
    </div>
  );
}
