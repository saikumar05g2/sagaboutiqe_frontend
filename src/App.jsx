import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/theme.css";
import { FeedbackProvider } from "./components/FeedbackContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CustomizeOrderPage from "./pages/CustomizeOrderPage";
import CartPage from "./pages/CartPage";
import TrackOrdersPage from "./pages/TrackOrdersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import PoliciesPage from "./pages/PoliciesPage";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("saga_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState([]);

  const handleAddToCart = (item) => setCart((prev) => [...prev, item]);
  const handleUpdateQty = (cartItemId, newQty) =>
    setCart((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: newQty } : i,
      ),
    );
  const handleRemoveItem = (cartItemId) =>
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  const handleClearCart = () => setCart([]);

  return (
    <FeedbackProvider>
      <BrowserRouter>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Navbar
            user={user}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            onLogout={() => setUser(null)}
          />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage onLogin={setUser} />} />
              <Route
                path="/profile"
                element={
                  user ? (
                    <ProfilePage
                      onUserUpdated={(updatedUser) => {
                        setUser((prev) => ({ ...prev, ...updatedUser }));
                        localStorage.setItem(
                          "saga_user",
                          JSON.stringify({ ...user, ...updatedUser }),
                        );
                      }}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/customize/:id"
                element={<CustomizeOrderPage onAddToCart={handleAddToCart} />}
              />
              <Route
                path="/cart"
                element={
                  <CartPage
                    cart={cart}
                    onUpdateQty={handleUpdateQty}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                  />
                }
              />
              <Route path="/my-orders" element={<TrackOrdersPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </FeedbackProvider>
  );
}
