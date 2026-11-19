import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storeApi } from "../api/storeApi";
import apiClient from "../api/client";
import { useFeedback } from "../components/FeedbackContext";
import "../styles/CartAndGallery.css";
import "../styles/MeasurementForm.css";

export default function CartPage({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) {
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [newAddress, setNewAddress] = useState({
    label: "Home",
    recipientName: "",
    mobileNumber: "",
    flatNo: "",
    street: "",
    city: "",
    pincode: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [previewOverrides, setPreviewOverrides] = useState({});
  const { showSnackbar, showModal } = useFeedback();
  const navigate = useNavigate();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.basePrice * item.quantity,
    0,
  );

  // Load all saved addresses for the logged-in user
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const { data } = await apiClient.get("/users/profile");
        const u = data?.user;
        if (u) {
          setUserProfile(u);
          const list = u.addresses || [];
          setAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr.id);
            setShowNewAddressForm(false);
          } else {
            setNewAddress((prev) => ({
              ...prev,
              recipientName: u.name || "",
              mobileNumber: u.phone || "",
            }));
            setShowNewAddressForm(true);
          }
        }
      } catch {
        setShowNewAddressForm(true);
      }
    };

    loadAddresses();
  }, []);

  const handleSaveAndSelectNewAddress = async () => {
    const {
      label,
      recipientName,
      mobileNumber,
      flatNo,
      street,
      city,
      pincode,
    } = newAddress;

    if (
      !recipientName.trim() ||
      !flatNo.trim() ||
      !street.trim() ||
      !city.trim()
    ) {
      showSnackbar(
        "Please fill Recipient Name, Flat No., Street, and City.",
        "error",
      );
      return null;
    }
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      showSnackbar("Enter a valid 10-digit recipient mobile number.", "error");
      return null;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      showSnackbar("Enter a valid 6-digit pincode.", "error");
      return null;
    }

    try {
      const { data } = await apiClient.post("/users/addresses", {
        label: label.trim() || "Other",
        recipientName: recipientName.trim(),
        mobileNumber: mobileNumber.trim(),
        flatNo: flatNo.trim(),
        street: street.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        isDefault: addresses.length === 0,
      });

      const created = data.address;
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      showSnackbar(
        `"${created.label}" address saved to your profile!`,
        "success",
      );
      return created;
    } catch (err) {
      if (err.response?.status === 401) {
        showSnackbar("Please log in to save address and checkout.", "error");
        navigate("/login");
      } else {
        showSnackbar(
          err.response?.data?.message || "Could not save address.",
          "error",
        );
      }
      return null;
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    let chosenAddress = addresses.find((a) => a.id === selectedAddressId);

    if (showNewAddressForm || !chosenAddress) {
      chosenAddress = await handleSaveAndSelectNewAddress();
      if (!chosenAddress) return;
    }

    const formattedShippingAddress = `[${chosenAddress.label}] ${chosenAddress.recipientName} (Mobile: ${chosenAddress.mobileNumber}) — ${chosenAddress.flatNo}, ${chosenAddress.street}, ${chosenAddress.city} - ${chosenAddress.pincode}`;

    setSubmitting(true);
    try {
      const payload = {
        shippingAddress: formattedShippingAddress,
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

          {/* Multi-Address Selector & Inline Add */}
          <div className="checkout-address-box">
            <div className="checkout-address-header">
              <label
                style={{ fontWeight: 700, fontSize: "0.92rem", margin: 0 }}
              >
                Select Delivery Address
              </label>

              {addresses.length > 0 && (
                <button
                  type="button"
                  className="addr-tab-btn active"
                  onClick={() => {
                    setNewAddress({
                      label: "",
                      recipientName: userProfile?.name || "",
                      mobileNumber: userProfile?.phone || "",
                      flatNo: "",
                      street: "",
                      city: "",
                      pincode: "",
                    });
                    setShowNewAddressForm((prev) => !prev);
                  }}
                >
                  {showNewAddressForm ? "← Back to Saved" : "+ Add New Address"}
                </button>
              )}
            </div>

            {!showNewAddressForm && addresses.length > 0 ? (
              <div className="cart-address-radio-list">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedAddressId;
                  return (
                    <label
                      key={addr.id}
                      className={`cart-addr-option ${isSelected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div className="cart-addr-option-body">
                        <div className="cart-addr-option-top">
                          <span className="saved-addr-badge">{addr.label}</span>
                          <strong>{addr.recipientName}</strong>
                        </div>
                        <div className="cart-addr-option-line">
                          📞 {addr.mobileNumber}
                        </div>
                        <div className="cart-addr-option-line">
                          {addr.flatNo}, {addr.street}, {addr.city} —{" "}
                          <strong>{addr.pincode}</strong>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="new-address-form">
                <div className="checkout-addr-grid">
                  <div className="input-group">
                    <label>Address Name / Tag *</label>
                    <input
                      type="text"
                      placeholder="e.g., Vizag, Hyderabad, Bangalore"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, label: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Recipient Name *</label>
                    <input
                      type="text"
                      placeholder="Full name of receiver"
                      value={newAddress.recipientName}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          recipientName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Recipient Mobile No. *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={newAddress.mobileNumber}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          mobileNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Flat / House No. *</label>
                    <input
                      type="text"
                      placeholder="e.g., Flat 302, Green Residency"
                      value={newAddress.flatNo}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, flatNo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Street / Colony *</label>
                    <input
                      type="text"
                      placeholder="e.g., MVP Colony / Indiranagar"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>City *</label>
                    <input
                      type="text"
                      placeholder="e.g., Visakhapatnam / Hyderabad"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit pincode"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          pincode: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    margin: "6px 0 0 0",
                  }}
                >
                  This address will be saved to your profile automatically when
                  you proceed.
                </p>
              </div>
            )}
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
