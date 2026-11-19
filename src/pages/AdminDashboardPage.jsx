import React, { useEffect, useState, useRef } from "react";
import { adminApi } from "../api/adminApi";
import { storeApi } from "../api/storeApi";
import { useFeedback } from "../components/FeedbackContext";
import OfflineCustomersSection from "../components/OfflineCustomersSection";
import OfflineCustomersList from "../components/OfflineCustomersList";
import MeasurementSpecCell from "../components/MeasurementSpecCell";
import "../styles/AdminDashboard.css";
import "../styles/MeasurementForm.css";
import "../styles/CartAndGallery.css";

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("OFFLINE_LIST");
  const [products, setProducts] = useState([]);
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [onlineNameFilter, setOnlineNameFilter] = useState("");
  const [onlinePhoneFilter, setOnlinePhoneFilter] = useState("");
  const [offlineCustomers, setOfflineCustomers] = useState([]);
  const [editingOfflineCustomer, setEditingOfflineCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: "", genderType: "WOMEN" });
  const [measurementFields, setMeasurementFields] = useState([]);
  const [newField, setNewField] = useState({ label: "", genderType: "WOMEN" });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const { showSnackbar, confirmModal, promptModal } = useFeedback();

  // Edit Outfit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    basePrice: "",
    stockQuantity: 0,
    description: "",
    images: [],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [stock, setStock] = useState({
    name: "",
    category: "",
    basePrice: "",
    stockQuantity: "10",
    description: "",
    images: [],
  });

  const refreshData = () => {
    storeApi.getProducts("ALL").then((res) => {
      const list = res.data.data || [];
      setProducts(list);
      const drafts = {};
      list.forEach((p) => {
        drafts[p.id] = p.stockQuantity;
      });
      setQtyDrafts(drafts);
    });
    adminApi.getAllOrders().then((res) => setOrders(res.data.data || []));
    adminApi.getCustomers().then((res) => setCustomers(res.data.data || []));
    adminApi
      .getOfflineCustomers()
      .then((res) => setOfflineCustomers(res.data.data || []));
    storeApi
      .getMeasurementFields()
      .then((res) => setMeasurementFields(res.data.data || []));
    storeApi.getCategories().then((res) => {
      const list = res.data.data || [];
      setCategories(list);
      setStock((prev) => ({
        ...prev,
        category: prev.category || (list[0]?.slug ?? ""),
      }));
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddMeasurementField = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createMeasurementField(newField);
      setNewField((prev) => ({ ...prev, label: "" }));
      showSnackbar(
        `Added "${newField.label}" to ${newField.genderType} measurements!`,
        "success",
      );
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to add measurement field.",
        "error",
      );
    }
  };

  const handleDeleteMeasurementField = async (field) => {
    const ok = await confirmModal({
      title: "Delete Measurement Field",
      message: `Remove "${field.label}" from ${field.genderType === "WOMEN" ? "Women" : "Men"} tailoring forms?`,
      confirmText: "Delete Field",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await adminApi.deleteMeasurementField(field.id);
      showSnackbar(`Removed "${field.label}".`, "success");
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to delete measurement field.",
        "error",
      );
    }
  };

  const handleUpdateStockQty = async (product) => {
    const newQty = Number(qtyDrafts[product.id] ?? 0);
    try {
      await adminApi.updateProductStock(product.id, newQty);
      showSnackbar(
        newQty > 0
          ? `"${product.name}" restocked (${newQty} available — now In Stock)!`
          : `"${product.name}" marked as Out of Stock.`,
        "success",
      );
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to update stock",
        "error",
      );
    }
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      category: product.category || (categories[0]?.slug ?? ""),
      basePrice: product.basePrice ?? "",
      stockQuantity: product.stockQuantity ?? 0,
      description: product.description || "",
      images: Array.isArray(product.images) ? [...product.images] : [],
    });
  };

  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editForm.images.length + files.length > 5) {
      showSnackbar("Maximum 5 pictures allowed per outfit.", "error");
      e.target.value = "";
      return;
    }

    const compressedImages = await Promise.all(files.map(compressImage));
    setEditForm((prev) => ({
      ...prev,
      images: [...prev.images, ...compressedImages],
    }));
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
    showSnackbar(`${compressedImages.length} picture(s) added.`, "success");
  };

  const handleRemoveEditImage = (indexToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editForm.images.length === 0) {
      showSnackbar("Please keep at least 1 outfit picture.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      await adminApi.updateProductStock(editingProduct.id, {
        name: editForm.name,
        category: editForm.category,
        basePrice: Number(editForm.basePrice),
        stockQuantity: Number(editForm.stockQuantity),
        description: editForm.description,
        images: editForm.images,
      });

      showSnackbar(`"${editForm.name}" updated successfully!`, "success");
      setEditingProduct(null);
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to update outfit.",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCategory(newCat);
      setNewCat({ name: "", genderType: "WOMEN" });
      showSnackbar("New boutique category added!", "success");
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to add category",
        "error",
      );
    }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await confirmModal({
      title: "Delete Category",
      message: `Remove "${cat.name}" from storefront category filters?`,
      confirmText: "Delete Category",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await adminApi.deleteCategory(cat.id);
      showSnackbar(`Category "${cat.name}" removed.`, "success");
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to delete category",
        "error",
      );
    }
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 4 || files.length > 5) {
      showSnackbar("Please select between 4 and 5 pictures.", "error");
      e.target.value = "";
      setStock((prev) => ({ ...prev, images: [] }));
      return;
    }

    const compressedImages = await Promise.all(files.map(compressImage));
    setStock((prev) => ({ ...prev, images: compressedImages }));
    showSnackbar(
      `${compressedImages.length} pictures ready for upload.`,
      "success",
    );
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (stock.images.length < 4 || stock.images.length > 5) {
      showSnackbar("Please select 4 to 5 pictures before publishing.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.addStock(stock);
      setStock({
        name: "",
        category: categories[0]?.slug || "",
        basePrice: "",
        stockQuantity: "10",
        description: "",
        images: [],
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showSnackbar(
        "New stock published across Storefront, Android & iOS!",
        "success",
      );
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to add stock.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    const reason = await promptModal({
      title: `Cancel Order ${orderNumber}`,
      message:
        "Please enter a cancellation reason. If paid online, a Razorpay refund will be initiated automatically.",
      placeholder:
        "e.g., Fabric out of stock / Customer requested cancellation",
      confirmText: "Confirm Cancellation",
      variant: "danger",
    });
    if (!reason) return;

    try {
      await adminApi.cancelOrder(orderId, reason);
      showSnackbar(`Order ${orderNumber} cancelled.`, "success");
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to cancel order.",
        "error",
      );
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    const confirmed = await confirmModal({
      title: "Delete Customer Account",
      message: `Are you sure you want to remove "${name}"? Their login access will be revoked while past financial invoices remain archived.`,
      confirmText: "Delete Customer",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await adminApi.deleteCustomer(id);
      showSnackbar(`Customer "${name}" removed safely.`, "success");
      refreshData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Unable to delete customer.",
        "error",
      );
    }
  };

  const filteredOnlineCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(onlineNameFilter.trim().toLowerCase()) &&
      c.phone.includes(onlinePhoneFilter.trim()),
  );

  const womenFields = measurementFields.filter((f) => f.genderType === "WOMEN");
  const menFields = measurementFields.filter((f) => f.genderType === "MEN");

  return (
    <div className="container">
      <h2 className="page-title">SAGA Boutique — Admin Control Center</h2>

      <div className="admin-tabs" style={{ flexWrap: "wrap" }}>
        {[
          {
            id: "OFFLINE_LIST",
            label: `Offline Customers (${offlineCustomers.length})`,
          },
          {
            id: "ADD_OFFLINE",
            label: editingOfflineCustomer
              ? "Edit Offline Customer"
              : "+ Add Offline Customer",
          },
          { id: "CUSTOMERS", label: `Online Customers (${customers.length})` },
          { id: "ORDERS", label: "Online Orders" },
          { id: "INVENTORY", label: "Manage Stock & Restock" },
          { id: "STOCK", label: "Add New Stock" },
          { id: "CATEGORIES", label: "Manage Categories" },
          { id: "MEASUREMENTS", label: "Measurement Fields" },
        ].map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => {
              if (t.id === "ADD_OFFLINE" && tab !== "ADD_OFFLINE") {
                setEditingOfflineCustomer(null);
              }
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "OFFLINE_LIST" && (
        <OfflineCustomersList
          records={offlineCustomers}
          onRefresh={refreshData}
          onEditCustomer={(rec) => {
            setEditingOfflineCustomer(rec);
            setTab("ADD_OFFLINE");
          }}
        />
      )}

      {tab === "ADD_OFFLINE" && (
        <OfflineCustomersSection
          editingRecord={editingOfflineCustomer}
          onSaved={() => {
            setEditingOfflineCustomer(null);
            refreshData();
            setTab("OFFLINE_LIST");
          }}
          onCancelEdit={() => {
            setEditingOfflineCustomer(null);
            setTab("OFFLINE_LIST");
          }}
        />
      )}

      {tab === "MEASUREMENTS" && (
        <div>
          <form
            className="custom-box"
            onSubmit={handleAddMeasurementField}
            style={{ maxWidth: "720px" }}
          >
            <h3 style={{ marginTop: 0 }}>Add Custom Body Measurement Field</h3>
            <div className="measure-grid">
              <div className="input-group">
                <label>Measurement Field Name</label>
                <input
                  placeholder="e.g., Front Neck Depth, Back Neck Depth, Cuff, Thigh"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>Tailoring Template</label>
                <select
                  value={newField.genderType}
                  onChange={(e) =>
                    setNewField({ ...newField, genderType: e.target.value })
                  }
                >
                  <option value="WOMEN">Women Tailoring</option>
                  <option value="MEN">Men Tailoring</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              + Add Measurement Field
            </button>
          </form>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            <div>
              <h3 style={{ color: "var(--emerald-primary)" }}>
                Women Tailoring Fields ({womenFields.length})
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field Label</th>
                    <th style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {womenFields.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.label}</strong>
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteMeasurementField(f)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 style={{ color: "var(--emerald-primary)" }}>
                Men Tailoring Fields ({menFields.length})
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field Label</th>
                    <th style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {menFields.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.label}</strong>
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteMeasurementField(f)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "CUSTOMERS" && (
        <div>
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
                value={onlineNameFilter}
                onChange={(e) => setOnlineNameFilter(e.target.value)}
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
                value={onlinePhoneFilter}
                onChange={(e) => setOnlinePhoneFilter(e.target.value)}
              />
            </div>

            {(onlineNameFilter || onlinePhoneFilter) && (
              <button
                type="button"
                className="btn-modal-cancel"
                style={{ height: "42px" }}
                onClick={() => {
                  setOnlineNameFilter("");
                  setOnlinePhoneFilter("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Orders Placed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOnlineCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c._count?.orders || 0}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteCustomer(c.id, c.name)}
                    >
                      Delete Customer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "INVENTORY" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Outfit Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Update Stock & Edit Outfit</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isOut = !p.inStock || p.stockQuantity <= 0;
              return (
                <tr key={p.id}>
                  <td>
                    <img
                      src={
                        p.images?.[0] ||
                        "https://placehold.co/60x60/F0ECE3/1E1E1E?text=SAGA"
                      }
                      alt={p.name}
                      style={{
                        width: "56px",
                        height: "56px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    <div>₹{p.basePrice}</div>
                  </td>
                  <td>
                    <code>{p.category}</code>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        backgroundColor: isOut ? "#FEE2E2" : "#DCFCE7",
                        color: isOut ? "#B91C1C" : "#166534",
                      }}
                    >
                      {isOut ? "OUT OF STOCK" : `IN STOCK (${p.stockQuantity})`}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        value={qtyDrafts[p.id] ?? p.stockQuantity}
                        onChange={(e) =>
                          setQtyDrafts((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        style={{
                          width: "80px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleUpdateStockQty(p)}
                      >
                        Save Stock
                      </button>
                      <button
                        type="button"
                        className="btn-gold"
                        style={{ padding: "8px 14px" }}
                        onClick={() => openEditProductModal(p)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {tab === "STOCK" && (
        <form
          className="custom-box"
          onSubmit={handleAddStock}
          style={{ maxWidth: "640px" }}
        >
          <h3 style={{ marginTop: 0 }}>Publish New Boutique Stock</h3>

          <div className="input-group">
            <label>Garment Name</label>
            <input
              placeholder="e.g., Maggam Work Bridal Silk Blouse"
              value={stock.name}
              onChange={(e) => setStock({ ...stock, name: e.target.value })}
              required
            />
          </div>

          <div className="measure-grid">
            <div className="input-group">
              <label>Category</label>
              <select
                value={stock.category}
                onChange={(e) =>
                  setStock({ ...stock, category: e.target.value })
                }
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Base Price (₹)</label>
              <input
                type="number"
                min="1"
                placeholder="5000"
                value={stock.basePrice}
                onChange={(e) =>
                  setStock({ ...stock, basePrice: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Available Stock Quantity</label>
              <input
                type="number"
                min="1"
                value={stock.stockQuantity}
                onChange={(e) =>
                  setStock({ ...stock, stockQuantity: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Upload 4 to 5 Outfit Pictures (Stored in Database)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              required
            />
            {stock.images.length > 0 && (
              <div className="admin-preview-row">
                {stock.images.map((src, idx) => (
                  <img key={idx} src={src} alt={`Preview ${idx + 1}`} />
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Fabric & Detailing Description</label>
            <textarea
              rows="3"
              placeholder="Pure silk with hand embroidery, customizable sleeves and neck patterns..."
              value={stock.description}
              onChange={(e) =>
                setStock({ ...stock, description: e.target.value })
              }
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Publishing Stock..." : "Publish Stock to Storefront"}
          </button>
        </form>
      )}

      {tab === "CATEGORIES" && (
        <div style={{ maxWidth: "720px" }}>
          <form className="custom-box" onSubmit={handleAddCategory}>
            <h3 style={{ marginTop: 0 }}>Create New Storefront Category</h3>
            <div className="measure-grid">
              <div className="input-group">
                <label>Category Display Name</label>
                <input
                  placeholder="e.g., Designer Sarees or Wedding Sherwanis"
                  value={newCat.name}
                  onChange={(e) =>
                    setNewCat({ ...newCat, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>Tailoring Measurement Template</label>
                <select
                  value={newCat.genderType}
                  onChange={(e) =>
                    setNewCat({ ...newCat, genderType: e.target.value })
                  }
                >
                  <option value="WOMEN">Women Body Measurements</option>
                  <option value="MEN">Men Body Measurements</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Add Category
            </button>
          </form>

          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Code</th>
                <th>Measurement Template</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <strong>{cat.name}</strong>
                  </td>
                  <td>
                    <code>{cat.slug}</code>
                  </td>
                  <td>{cat.genderType}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteCategory(cat)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ORDERS" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Size / Custom Measurements</th>
              <th>Stage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.orderNumber}</strong>
                  <div>
                    ₹{o.totalAmount} • {o.paymentStatus}
                  </div>
                </td>
                <td>
                  <strong>{o.user?.name}</strong>
                  <div>{o.user?.phone}</div>
                </td>
                <td>
                  {o.items?.map((it, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>{it.product?.name}</strong> — Size:{" "}
                        <strong>{it.selectedSize}</strong> (Qty: {it.quantity})
                      </div>
                      {it.selectedSize === "CUSTOMISED" && (
                        <MeasurementSpecCell
                          customerName={o.user?.name || "Online Customer"}
                          subtitle={`Order #${o.orderNumber} • ${it.product?.name}`}
                          unit={it.measurementSnapshot?.unit || "INCHES"}
                          measurements={
                            it.measurementSnapshot?.measurements || {}
                          }
                          notes={it.stitchingNotes}
                        />
                      )}
                    </div>
                  ))}
                </td>
                <td>
                  <select
                    value={o.status}
                    disabled={o.status === "CANCELLED"}
                    onChange={(e) =>
                      adminApi
                        .updateOrderStatus(o.id, e.target.value)
                        .then(() => {
                          showSnackbar(
                            `Order ${o.orderNumber} updated to ${e.target.value}`,
                            "success",
                          );
                          refreshData();
                        })
                    }
                  >
                    {[
                      "CONFIRMED",
                      "FABRIC_CUTTING",
                      "STITCHING",
                      "FINISHING_QC",
                      "DISPATCHED",
                      "DELIVERED",
                      "CANCELLED",
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {o.status !== "CANCELLED" && o.status !== "DELIVERED" && (
                    <button
                      className="btn-danger"
                      onClick={() => handleCancelOrder(o.id, o.orderNumber)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Outfit Modal */}
      {editingProduct && (
        <div
          onClick={() => setEditingProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "12px",
              padding: "22px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3 style={{ margin: 0, color: "var(--emerald-primary)" }}>
                Edit Outfit — {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--text-charcoal)",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit}>
              <div className="input-group">
                <label>Garment Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="measure-grid">
                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                    {editForm.category &&
                      !categories.some((c) => c.slug === editForm.category) && (
                        <option value={editForm.category}>
                          {editForm.category}
                        </option>
                      )}
                  </select>
                </div>

                <div className="input-group">
                  <label>Base Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.basePrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, basePrice: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.stockQuantity}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        stockQuantity: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Outfit Pictures ({editForm.images.length} / 5)</label>
                {editForm.images.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "10px",
                    }}
                  >
                    {editForm.images.map((src, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          width: "70px",
                          height: "84px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <img
                          src={src}
                          alt={`Angle ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(idx)}
                          title="Remove picture"
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "rgba(0, 0, 0, 0.72)",
                            color: "#FFFFFF",
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editForm.images.length < 5 && (
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageUpload}
                  />
                )}
              </div>

              <div className="input-group">
                <label>Fabric & Detailing Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Describe fabric, embroidery, lining, and fit..."
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingEdit}
                  style={{ flex: 1, padding: "12px" }}
                >
                  {savingEdit ? "Saving Changes..." : "Save Outfit Changes"}
                </button>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: "12px 18px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
