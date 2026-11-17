import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer id="contact" className="saga-footer">
      <div className="footer-inner">
        {/* Column 1: Brand Story */}
        <div>
          <h3 className="footer-brand">
            SAGA <span>BOUTIQUE</span>
          </h3>
          <p className="footer-tagline">
            Bespoke ethnic and formal tailoring crafted to your exact
            measurements. Specializing in bridal blouses, lehengas, designer
            frocks, men&apos;s blazers, and custom formal wear.
          </p>
        </div>

        {/* Column 2: Quick Navigation */}
        <div>
          <h4 className="footer-heading">Explore</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">New Arrivals</Link>
            </li>
            <li>
              <a href="/#collections">Signature Collections</a>
            </li>
            <li>
              <a href="/#tailoring-process">How Custom Tailoring Works</a>
            </li>
            <li>
              <Link to="/my-orders">Track Your Order</Link>
            </li>
            <li>
              <Link to="/cart">Shopping Bag</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Details & Google Maps */}
        <div>
          <h4 className="footer-heading">Visit & Contact Us</h4>
          <ul className="contact-list">
            <li className="contact-item">
              <span className="contact-label">Phone / WhatsApp</span>
              <a className="contact-value" href="tel:+917674019171">
                +91 76740 19171
              </a>
            </li>

            <li className="contact-item">
              <span className="contact-label">Email</span>
              <a
                className="contact-value"
                href="mailto:contact@sagaboutiqe.com"
              >
                contact@sagaboutiqe.com
              </a>
            </li>

            <li className="contact-item">
              <span className="contact-label">Boutique Location</span>
              <a
                className="maps-btn"
                href="https://maps.app.goo.gl/63qgia5xcM7HUwGm9"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} SAGA Boutique. All rights reserved.
        Handcrafted with precision.
      </div>
    </footer>
  );
}
