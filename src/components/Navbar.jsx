import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar({ user, cartCount = 0, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogoutClick = () => {
    localStorage.removeItem("saga_token");
    localStorage.removeItem("saga_user");
    closeMenu();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <header className="saga-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          SAGA <span>BOUTIQUE</span>
        </Link>

        {/* Mobile Quick Cart + Hamburger Toggle */}
        <div className="mobile-nav-controls">
          <Link to="/cart" className="nav-cart-pill" onClick={closeMenu}>
            Bag ({cartCount})
          </Link>
          <button
            type="button"
            className="hamburger-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Navigation Links (Inline on Desktop, Collapsible Drawer on Mobile) */}
        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            onClick={closeMenu}
          >
            New Arrivals
          </Link>

          <a href="/#collections" className="nav-link" onClick={closeMenu}>
            Collections
          </a>

          {user && (
            <>
              <Link
                to="/my-orders"
                className={`nav-link ${location.pathname === "/my-orders" ? "active" : ""}`}
                onClick={closeMenu}
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === "/admin" ? "active" : ""}`}
              onClick={closeMenu}
            >
              Admin Panel
            </Link>
          )}

          <Link
            to="/cart"
            className="nav-cart-pill desktop-only-cart"
            onClick={closeMenu}
          >
            Shopping Bag ({cartCount})
          </Link>

          {user ? (
            <button
              type="button"
              className="nav-logout-btn"
              onClick={handleLogoutClick}
            >
              Logout ({user.name?.split(" ")[0]})
            </button>
          ) : (
            <Link
              to="/login"
              className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
              onClick={closeMenu}
            >
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
