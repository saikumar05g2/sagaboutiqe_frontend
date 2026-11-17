import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MeasurementForm from "../components/MeasurementForm";
import { useFeedback } from "../components/FeedbackContext";
import "../styles/MeasurementForm.css";
import "../styles/CartAndGallery.css";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "CUSTOMISED"];

export default function CustomizeOrderPage({ onAddToCart }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showSnackbar } = useFeedback();
  const product = state?.product;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("Royal Emerald");
  const [measurementPayload, setMeasurementPayload] = useState({});

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          Please select an outfit from New Arrivals first.
        </div>
      </div>
    );
  }

  const images =
    product.images?.length > 0
      ? product.images
      : ["https://placehold.co/500x600/F0ECE3/1E1E1E?text=SAGA+Boutique"];

  const isMen = ["BLAZER", "SHIRT", "PANT"].includes(product.category);

  const handleAdd = (e) => {
    e.preventDefault();
    if (
      selectedSize === "CUSTOMISED" &&
      (!measurementPayload.measurements ||
        Object.keys(measurementPayload.measurements).length === 0)
    ) {
      showSnackbar(
        "Please enter your custom body measurements before adding to cart.",
        "error",
      );
      return;
    }

    onAddToCart({
      cartItemId: `${product.id}_${Date.now()}`,
      product,
      quantity: Number(quantity),
      selectedSize,
      selectedColor: color,
      measurementSnapshot:
        selectedSize === "CUSTOMISED" ? measurementPayload : null,
      stitchingNotes: measurementPayload.stitchingNotes || "",
    });

    showSnackbar(
      `${product.name} (${selectedSize}) added to your bag!`,
      "success",
    );
    navigate("/cart");
  };

  return (
    <div className="container">
      <div className="product-detail-layout">
        <div className="gallery-left-column">
          <div className="gallery-vertical-thumbs">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name} view ${idx + 1}`}
                className={`gallery-thumb ${activeImage === idx ? "active" : ""}`}
                onMouseEnter={() => setActiveImage(idx)}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>

          <div className="gallery-main-stage">
            <img
              className="gallery-main-img"
              src={images[activeImage]}
              alt={product.name}
            />
          </div>
        </div>

        <div className="product-right-column">
          <span className="detail-category-badge">
            {product.category} • SAGA Bespoke Collection
          </span>
          <h1 className="detail-title">{product.name}</h1>

          <div className="detail-price-row">
            <span className="detail-price">₹{product.basePrice}</span>
            <span className="detail-stock-pill">
              In Stock ({product.stockQuantity} available)
            </span>
          </div>

          <p className="detail-description">
            {product.description ||
              "Crafted with premium boutique fabric and hand-finished detailing. Available in standard sizes or custom-tailored to your exact body measurements."}
          </p>

          <form onSubmit={handleAdd}>
            <label style={{ fontWeight: 700, fontSize: "0.92rem" }}>
              Select Size:
            </label>
            <div className="size-selector">
              {SIZE_OPTIONS.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`size-btn ${selectedSize === sz ? "active" : ""}`}
                  onClick={() => setSelectedSize(sz)}
                >
                  {sz === "CUSTOMISED" ? "Customised Size" : sz}
                </button>
              ))}
            </div>

            <div className="options-two-col">
              <div className="input-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={product.stockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Fabric Color / Shade Preference</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedSize === "CUSTOMISED" && (
              <MeasurementForm
                gender={isMen ? "MEN" : "WOMEN"}
                onChange={setMeasurementPayload}
              />
            )}

            <button
              type="submit"
              className="btn-gold"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1rem",
                marginTop: "10px",
              }}
            >
              Add to Cart — ₹{product.basePrice * quantity}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
