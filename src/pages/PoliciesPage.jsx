import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/PoliciesPage.css";

const STUDIO_ADDRESS =
  "Ground Floor, Saga Boutiqe, Hanuman Temple Road, Puppalaguda, Manikonda, Hyderabad 500089, India"; // Replace with your exact shop street address

export default function PoliciesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="container policies-page-container">
      <div className="policies-wrapper">
        <span className="detail-category-badge">
          SAGA Boutique • Official Policies
        </span>
        <h1 className="policies-main-title">
          Store Policies, Terms &amp; Customer Support
        </h1>
        <p className="policies-subtitle">
          Effective Date: November 20, 2026 • Applicable to orders placed on
          sagaboutiqe.com
        </p>

        {/* Contact Us */}
        <section id="contact" className="policy-card">
          <h2 className="policy-card-title">
            Contact Us &amp; Grievance Redressal
          </h2>
          <p>
            <strong>Legal / Brand Name:</strong> SAGA Boutiqe
          </p>
          <p>
            <strong>Customer Support Email:</strong>{" "}
            <a href="mailto:contact@sagaboutiqe.com" className="policy-link">
              contact@sagaboutiqe.com
            </a>
          </p>
          <p>
            <strong>Phone / WhatsApp:</strong>{" "}
            <a href="tel:+917674019171" className="policy-link">
              +91 76740 19171
            </a>{" "}
            (Mon–Sat, 10:00 AM – 7:00 PM IST)
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Studio Address:</strong> {STUDIO_ADDRESS}
          </p>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="policy-card">
          <h2 className="policy-card-title">Privacy Policy</h2>
          <p>
            SAGA Boutique collects your name, mobile number, email, saved
            delivery addresses, and custom body measurements solely to stitch,
            fulfill, and deliver your orders.
          </p>
          <ul className="policy-list">
            <li>
              <strong>Payment Security:</strong> All online payments are
              processed securely by Razorpay (PCI-DSS Level 1 certified). SAGA
              Boutique never stores your card numbers, CVV, or UPI PIN.
            </li>
            <li>
              <strong>Third-Party Sharing:</strong> Delivery details are shared
              strictly with logistics partners to deliver your parcel. We never
              sell customer data.
            </li>
            <li>
              <strong>Data Control:</strong> You may update or delete your saved
              addresses anytime in My Profile or request account deletion at
              contact@sagaboutiqe.com.
            </li>
          </ul>
        </section>

        {/* Terms & Conditions */}
        <section id="terms" className="policy-card">
          <h2 className="policy-card-title">Terms &amp; Conditions</h2>
          <ul className="policy-list">
            <li>
              <strong>Pricing &amp; Currency:</strong> All product prices are
              displayed in Indian Rupees (INR ₹).
            </li>
            <li>
              <strong>Bespoke Craftsmanship:</strong> Minor variations in
              hand-embroidery, maggam work, and fabric weave are hallmarks of
              handcrafted garments.
            </li>
            <li>
              <strong>Custom Measurements:</strong> Customers are responsible
              for verifying body measurement inputs (Inches/CM) before
              submitting custom orders.
            </li>
            <li>
              <strong>Jurisdiction:</strong> Governed by the laws of India under
              the jurisdiction of Visakhapatnam, Andhra Pradesh.
            </li>
          </ul>
        </section>

        {/* Shipping & Delivery Policy */}
        <section id="shipping" className="policy-card">
          <h2 className="policy-card-title">Shipping &amp; Delivery Policy</h2>
          <ul className="policy-list">
            <li>
              <strong>Standard Sizes (S, M, L, XL):</strong> Dispatched within{" "}
              <strong>2 to 4 business days</strong>.
            </li>
            <li>
              <strong>Custom-Stitched Outfits:</strong> Tailored and
              quality-checked within <strong>7 to 12 business days</strong> (12
              to 15 business days for heavy bridal handwork).
            </li>
            <li>
              <strong>Delivery Transit Time:</strong> 1–3 business days within
              AP &amp; Telangana; 3–7 business days across metro cities and the
              rest of India.
            </li>
            <li>
              <strong>Shipping Fee:</strong> Free standard delivery across
              India. Live stitching and dispatch stages are visible under My
              Orders.
            </li>
          </ul>
        </section>

        {/* Cancellation & Refund Policy */}
        <section id="refunds" className="policy-card">
          <h2 className="policy-card-title">
            Cancellation &amp; Refund Policy
          </h2>
          <ul className="policy-list">
            <li>
              <strong>Order Cancellation:</strong> Orders can be cancelled
              within <strong>12 hours</strong> of placement (before status moves
              to Fabric Cutting) for a 100% refund. Custom orders cannot be
              cancelled once fabric cutting begins.
            </li>
            <li>
              <strong>Standard Sizes (S, M, L, XL):</strong> Eligible for size
              exchange or return within <strong>5 days of delivery</strong> if
              unworn with original tags attached.
            </li>
            <li>
              <strong>Custom-Stitched Outfits:</strong> Not eligible for
              return/refund due to change of mind or incorrect customer
              measurements. Free alteration is provided if the stitched garment
              deviates from your submitted measurements.
            </li>
            <li>
              <strong>Refund Timeline:</strong> Approved refunds are initiated
              via Razorpay within 2 business days and credited to your original
              payment source within <strong>5 to 7 business days</strong>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
