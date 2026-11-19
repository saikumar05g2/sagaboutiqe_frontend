import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import apiClient from "../api/client";
import { useFeedback } from "../components/FeedbackContext";
import "../styles/ProfilePage.css";

const LIBRARIES = ["places"];
const DEFAULT_CENTER = { lat: 17.6868, lng: 83.2185 };

const EMPTY_ADDRESS_FORM = {
  label: "Home",
  recipientName: "",
  mobileNumber: "",
  flatNo: "",
  street: "",
  city: "",
  pincode: "",
  latitude: null,
  longitude: null,
  mapAddress: "",
  isDefault: false,
};

export default function ProfilePage({ onUserUpdated }) {
  const { showSnackbar, showModal } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [profile, setProfile] = useState({ name: "", phone: "", email: "" });
  const [addresses, setAddresses] = useState([]);

  // Add / Edit Address Drawer State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS_FORM);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: "saga-google-maps",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const loadProfileData = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/users/profile");
      if (data?.user) {
        setProfile({
          name: data.user.name || "",
          phone: data.user.phone || "",
          email: data.user.email || "",
        });
        setAddresses(data.user.addresses || []);
      }
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to load profile.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const applyAddressComponents = useCallback(
    (components, formattedAddress, lat, lng) => {
      let route = "";
      let sublocality = "";
      let locality = "";
      let postalCode = "";

      (components || []).forEach((comp) => {
        if (comp.types.includes("route")) route = comp.long_name;
        if (
          comp.types.includes("sublocality_level_1") ||
          comp.types.includes("sublocality")
        ) {
          sublocality = comp.long_name;
        }
        if (comp.types.includes("locality")) locality = comp.long_name;
        if (comp.types.includes("postal_code")) postalCode = comp.long_name;
      });

      const detectedStreet = [route, sublocality].filter(Boolean).join(", ");
      setAddrForm((prev) => ({
        ...prev,
        street: detectedStreet || prev.street,
        city: locality || prev.city,
        pincode: postalCode || prev.pincode,
        latitude: lat,
        longitude: lng,
        mapAddress: formattedAddress || prev.mapAddress,
      }));
      setMapCenter({ lat, lng });
    },
    [],
  );

  const reverseGeocode = useCallback(
    (lat, lng) => {
      if (!window.google?.maps) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          applyAddressComponents(
            results[0].address_components,
            results[0].formatted_address,
            lat,
            lng,
          );
        } else {
          setAddrForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          setMapCenter({ lat, lng });
        }
      });
    },
    [applyAddressComponents],
  );

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    reverseGeocode(
      place.geometry.location.lat(),
      place.geometry.location.lng(),
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        showSnackbar("Current location pinned!", "success");
      },
      () => showSnackbar("Please enable location permissions.", "error"),
      { enableHighAccuracy: true },
    );
  };

  const openAddNewForm = () => {
    setEditingAddressId(null);
    setAddrForm({
      ...EMPTY_ADDRESS_FORM,
      recipientName: profile.name || "",
      mobileNumber: profile.phone || "",
      isDefault: addresses.length === 0,
    });
    setMapCenter(DEFAULT_CENTER);
    setShowAddressForm(true);
  };

  const openEditForm = (addr) => {
    setEditingAddressId(addr.id);
    setAddrForm({
      label: addr.label || "Home",
      recipientName: addr.recipientName || "",
      mobileNumber: addr.mobileNumber || "",
      flatNo: addr.flatNo || "",
      street: addr.street || "",
      city: addr.city || "",
      pincode: addr.pincode || "",
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      mapAddress: addr.mapAddress || "",
      isDefault: Boolean(addr.isDefault),
    });
    if (addr.latitude && addr.longitude) {
      setMapCenter({ lat: Number(addr.latitude), lng: Number(addr.longitude) });
    }
    setShowAddressForm(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await apiClient.put("/users/profile", profile);
      showSnackbar("Personal details saved!", "success");
      if (onUserUpdated && data?.user) onUserUpdated(data.user);
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to update profile.",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (editingAddressId) {
        await apiClient.put(`/users/addresses/${editingAddressId}`, addrForm);
        showSnackbar("Address updated!", "success");
      } else {
        await apiClient.post("/users/addresses", addrForm);
        showSnackbar("New address saved to your profile!", "success");
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      await loadProfileData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save address.",
        "error",
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addr) => {
    const confirmed = await showModal({
      title: "Delete Saved Address?",
      message: `Remove "${addr.label}" (${addr.recipientName}, ${addr.city}) from your address book?`,
      confirmText: "Delete Address",
    });
    if (!confirmed) return;

    try {
      await apiClient.delete(`/users/addresses/${addr.id}`);
      showSnackbar("Address removed.", "success");
      await loadProfileData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Could not delete address.",
        "error",
      );
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="profile-loading">
          Loading your SAGA Boutique profile...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-page-wrapper">
        <div className="profile-header">
          <span className="detail-category-badge">SAGA Member Account</span>
          <h1>My Profile & Address Book</h1>
          <p>
            Manage your account and save multiple delivery addresses for Vizag,
            Hyderabad, Bangalore, and beyond.
          </p>
        </div>

        <div className="profile-grid">
          {/* Left Column: Account Details */}
          <form onSubmit={handleSaveProfile} className="profile-card">
            <h2 className="profile-card-title">Account Details</h2>

            <div className="input-group">
              <label>Your Full Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Registered Login Mobile</label>
              <input
                type="text"
                value={profile.phone}
                disabled
                className="input-readonly"
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={savingProfile}
              style={{ width: "100%", padding: "12px", marginTop: "8px" }}
            >
              {savingProfile ? "Saving..." : "Update Account Info"}
            </button>
          </form>

          {/* Right Column: Multiple Saved Addresses */}
          <div className="profile-card">
            <div className="profile-card-header-row">
              <h2 className="profile-card-title">
                Saved Delivery Addresses ({addresses.length})
              </h2>
              {!showAddressForm && (
                <button
                  type="button"
                  className="btn-gold"
                  style={{ padding: "8px 14px", fontSize: "0.86rem" }}
                  onClick={openAddNewForm}
                >
                  + Add New Address
                </button>
              )}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleSaveAddress} className="address-editor-box">
                <div className="profile-card-header-row">
                  <strong>
                    {editingAddressId
                      ? "Edit Delivery Address"
                      : "Add New Delivery Address"}
                  </strong>
                  {isLoaded && (
                    <button
                      type="button"
                      className="btn-gps-locate"
                      onClick={handleUseCurrentLocation}
                    >
                      📍 Pin Current Location
                    </button>
                  )}
                </div>

                {isLoaded && (
                  <div className="map-section">
                    <Autocomplete
                      onLoad={(ac) => (autocompleteRef.current = ac)}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      <input
                        type="text"
                        className="map-search-input"
                        placeholder="Search area or landmark (e.g., Banjara Hills Hyderabad, Indiranagar Bangalore)..."
                      />
                    </Autocomplete>

                    <div className="map-canvas-box">
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "210px" }}
                        center={mapCenter}
                        zoom={addrForm.latitude ? 16 : 12}
                        onClick={(e) =>
                          reverseGeocode(e.latLng.lat(), e.latLng.lng())
                        }
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false,
                        }}
                      >
                        <Marker
                          position={mapCenter}
                          draggable
                          onDragEnd={(e) =>
                            reverseGeocode(e.latLng.lat(), e.latLng.lng())
                          }
                        />
                      </GoogleMap>
                    </div>
                  </div>
                )}

                <div className="address-fields-grid">
                  <div className="input-group">
                    <label>Address Label (Tag) *</label>
                    <input
                      type="text"
                      value={addrForm.label}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, label: e.target.value })
                      }
                      placeholder="e.g., Vizag Home, Hyd Office, Sister Bangalore"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Recipient Name *</label>
                    <input
                      type="text"
                      value={addrForm.recipientName}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          recipientName: e.target.value,
                        })
                      }
                      placeholder="Person receiving the order"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Recipient Mobile Number *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={addrForm.mobileNumber}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          mobileNumber: e.target.value,
                        })
                      }
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Flat / House No. / Building *</label>
                    <input
                      type="text"
                      value={addrForm.flatNo}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, flatNo: e.target.value })
                      }
                      placeholder="e.g., Flat 302, Green Residency"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Street / Colony / Landmark *</label>
                    <input
                      type="text"
                      value={addrForm.street}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, street: e.target.value })
                      }
                      placeholder="e.g., MVP Colony / Jubilee Hills"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={addrForm.city}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, city: e.target.value })
                      }
                      placeholder="e.g., Vizag / Hyderabad / Bangalore"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addrForm.pincode}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, pincode: e.target.value })
                      }
                      placeholder="6-digit pincode"
                      required
                    />
                  </div>
                </div>

                <label className="save-default-checkbox">
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={(e) =>
                      setAddrForm({ ...addrForm, isDefault: e.target.checked })
                    }
                  />
                  <span>Set as default delivery address</span>
                </label>

                <div
                  style={{ display: "flex", gap: "10px", marginTop: "14px" }}
                >
                  <button
                    type="submit"
                    className="btn-gold"
                    disabled={savingAddress}
                    style={{ flex: 1, padding: "12px" }}
                  >
                    {savingAddress
                      ? "Saving..."
                      : editingAddressId
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                  <button
                    type="button"
                    className="addr-tab-btn"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                    style={{ padding: "12px 18px" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="empty-state" style={{ padding: "28px 16px" }}>
                <p style={{ marginTop: 0 }}>
                  No saved addresses yet. Add your Vizag, Hyderabad, or
                  Bangalore delivery addresses for 1-click checkout.
                </p>
                <button
                  type="button"
                  className="btn-gold"
                  onClick={openAddNewForm}
                >
                  + Add Your First Address
                </button>
              </div>
            ) : (
              <div className="saved-addresses-list">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`saved-address-card ${addr.isDefault ? "default-card" : ""}`}
                  >
                    <div className="saved-addr-top-row">
                      <div>
                        <span className="saved-addr-badge">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="default-pill">Default</span>
                        )}
                      </div>
                      <div className="saved-addr-actions">
                        <button
                          type="button"
                          className="addr-action-link"
                          onClick={() => openEditForm(addr)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="addr-action-link delete"
                          onClick={() => handleDeleteAddress(addr)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <p className="saved-addr-name">
                      <strong>{addr.recipientName}</strong> • 📞{" "}
                      {addr.mobileNumber}
                    </p>
                    <p className="saved-addr-line">
                      {addr.flatNo}, {addr.street}
                    </p>
                    <p className="saved-addr-line">
                      {addr.city} — <strong>{addr.pincode}</strong>
                    </p>
                    {addr.mapAddress && (
                      <p className="saved-addr-pin">📍 {addr.mapAddress}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
