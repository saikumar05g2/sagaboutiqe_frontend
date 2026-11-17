import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { storeApi } from "../api/storeApi";
import "../styles/Storefront.css";

const PAGE_SIZE = 12;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [hoveredId, setHoveredId] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef(null);
  const navigate = useNavigate();

  // Load dynamic categories from Admin Panel
  useEffect(() => {
    storeApi.getCategories().then((res) => setCategories(res.data.data || []));
  }, []);

  // Fetch initial 12 products whenever category changes
  useEffect(() => {
    let isCancelled = false;
    setInitialLoading(true);
    setPage(1);
    setHasMore(true);

    storeApi
      .getProducts(selectedCat, 1, PAGE_SIZE)
      .then((res) => {
        if (isCancelled) return;
        const items = res.data.data || [];
        const meta = res.data.pagination || {};
        setProducts(items);
        setHasMore(Boolean(meta.hasMore));
        setTotalCount(meta.total ?? items.length);
      })
      .finally(() => {
        if (!isCancelled) setInitialLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCat]);

  // Fetch next batch of 12 products for infinite scrolling
  const loadNextPage = useCallback(() => {
    if (initialLoading || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    storeApi
      .getProducts(selectedCat, nextPage, PAGE_SIZE)
      .then((res) => {
        const nextItems = res.data.data || [];
        const meta = res.data.pagination || {};

        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = nextItems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(Boolean(meta.hasMore));
        if (meta.total !== undefined) setTotalCount(meta.total);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [initialLoading, loadingMore, hasMore, page, selectedCat]);

  // IntersectionObserver triggers loadNextPage 250px before reaching the bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "250px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  return (
    <div>
      {/* 1. CLASSIC BOUTIQUE HERO SECTION */}
      <section className="hero-banner">
        <div className="hero-inner">
          <div>
            <span className="hero-eyebrow">SAGA BESPOKE ATELIER</span>
            <h1 className="hero-title">
              Timeless Craftsmanship, Tailored to Your Exact Silhouette.
            </h1>
            <p className="hero-subtitle">
              From hand-embroidered bridal blouses, lehengas, and designer
              frocks to sharp men&apos;s blazers and formal wear—choose standard
              sizing or enter your custom body measurements for a
              master-tailored fit.
            </p>
            <div className="hero-cta-row">
              <a href="#collections" className="btn-gold">
                Explore Collections
              </a>
              <a href="#tailoring-process" className="btn-outline-ivory">
                How Custom Tailoring Works
              </a>
            </div>
          </div>

          <div className="hero-atelier-card">
            <h3>The SAGA Standard</h3>
            <ul className="atelier-list">
              <li>✦ Hand-finished Maggam, Zardosi & Couture Detailing</li>
              <li>✦ Standard Sizes (S, M, L, XL) & Custom Body Measurements</li>
              <li>✦ Live Stitching Stage Tracking from Cutting to Dispatch</li>
              <li>✦ Doorstep Delivery with Fit Assurance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC COLLECTIONS CATALOG WITH 12-ITEM INFINITE SCROLL */}
      <section id="collections" className="container">
        <div className="section-header-centered">
          <span className="section-kicker">CURATED LOOKBOOK</span>
          <h2 className="section-heading">Signature Boutique Arrivals</h2>
          <p className="section-subtext">
            Select any design below to inspect multi-angle detailing, pick your
            size or custom measurements, and place your order.
          </p>
        </div>

        <div className="category-bar">
          <button
            className={`cat-pill ${selectedCat === "ALL" ? "active" : ""}`}
            onClick={() => setSelectedCat("ALL")}
          >
            All Collections
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill ${selectedCat === cat.slug ? "active" : ""}`}
              onClick={() => setSelectedCat(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {initialLoading ? (
          <div className="infinite-scroll-trigger">
            <div className="scroll-spinner" />
            <span className="scroll-status-text">
              Loading SAGA Boutique collections...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            No outfits available in this category right now.
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((item) => {
                const isOutOfStock = !item.inStock || item.stockQuantity <= 0;
                const primaryImg =
                  item.images?.[0] ||
                  "https://placehold.co/400x500/F0ECE3/1E1E1E?text=SAGA+Boutique";
                const secondaryImg = item.images?.[1] || primaryImg;
                const displayImg =
                  hoveredId === item.id ? secondaryImg : primaryImg;

                return (
                  <div
                    className={`product-card ${isOutOfStock ? "sold-out" : ""}`}
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className="product-img-frame"
                      style={{ cursor: isOutOfStock ? "default" : "pointer" }}
                      onClick={() => {
                        if (!isOutOfStock) {
                          navigate(`/customize/${item.id}`, {
                            state: { product: item, categories },
                          });
                        }
                      }}
                    >
                      <img
                        className="product-img"
                        src={displayImg}
                        alt={item.name}
                      />
                      <span
                        className={`product-floating-badge ${isOutOfStock ? "out-of-stock" : ""}`}
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : `${item.stockQuantity} In Stock`}
                      </span>
                    </div>

                    <div className="product-body">
                      <span className="product-tag">
                        {item.category} • {item.images?.length || 1} Views
                      </span>
                      <h3 className="product-name">{item.name}</h3>
                      <p className="product-desc">{item.description}</p>

                      <div className="product-footer-row">
                        <span className="product-price">₹{item.basePrice}</span>
                        {isOutOfStock ? (
                          <button
                            type="button"
                            className="btn-out-of-stock"
                            disabled
                          >
                            Out of Stock
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() =>
                              navigate(`/customize/${item.id}`, {
                                state: { product: item, categories },
                              })
                            }
                          >
                            Customize Fit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={sentinelRef} className="infinite-scroll-trigger">
              {loadingMore && (
                <>
                  <div className="scroll-spinner" />
                  <span className="scroll-status-text">
                    Loading more designs...
                  </span>
                </>
              )}
              {!hasMore && products.length > 0 && (
                <span className="scroll-status-text">
                  Showing all {totalCount}{" "}
                  {totalCount === 1 ? "design" : "designs"}
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* 3. HOW BESPOKE TAILORING WORKS BAND */}
      <section id="tailoring-process" className="atelier-band">
        <div className="section-header-centered">
          <span className="section-kicker">BESPOKE EXPERIENCE</span>
          <h2 className="section-heading">From Measurement to Masterpiece</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Choose Design & Fabric</h4>
            <p>
              Browse our latest ethnic blouses, lehengas, frocks, blazers, and
              formal wear with multi-angle previews.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Standard or Customised Fit</h4>
            <p>
              Pick S, M, L, XL or select Customised Size to enter your exact
              body measurements in inches or centimeters.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Master Cutter & Stitching</h4>
            <p>
              Our tailors cut and stitch your garment to specification, updating
              your live order tracker at every stage.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">04</div>
            <h4>Quality Check & Dispatch</h4>
            <p>
              Every seam, embroidery motif, and button is inspected before safe
              doorstep delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
