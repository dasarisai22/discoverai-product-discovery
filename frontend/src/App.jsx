import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchProducts, askAI } from "./api";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import SortControls from "./components/SortControls";
import AISummary from "./components/AISummary";
import ProductList from "./components/ProductList";
import ProductModal from "./components/ProductModal";
import ScrollToTop from "./components/ScrollToTop";
import ErrorState from "./components/ErrorState";
import "./App.css";

const CATEGORIES = [
  "All", "Laptops", "Gaming", "Audio", "Wearables",
  "Smart Home", "Electronics", "Tablets", "Cameras",
  "Networking", "Accessories",
];

/** Sort comparator factory */
function getSorter(sortBy) {
  switch (sortBy) {
    case "price-asc": return (a, b) => a.price - b.price;
    case "price-desc": return (a, b) => b.price - a.price;
    case "rating-desc": return (a, b) => b.rating - a.rating;
    case "name-asc": return (a, b) => a.name.localeCompare(b.name);
    default: return null;
  }
}

export default function App() {
  // ── State ─────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [askLoading, setAskLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [aiSummary, setAiSummary] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [askModeEnabled, setAskModeEnabled] = useState(true); // Toggles between Normal vs AI search in the input bar
  const [cartCount, setCartCount] = useState(0);
  const [lastQuery, setLastQuery] = useState("");

  // ── Add to cart handler ──────────────────────────────────
  const handleAddToCart = useCallback(() => {
    setCartCount((c) => c + 1);
  }, []);

  // ── Computed stats ────────────────────────────────────────
  const stats = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    const featured = products.filter((p) => p.featured).length;
    return { total: products.length, categories: cats.size, featured };
  }, [products]);

  // Category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // ── Load all products on mount ────────────────────────────
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLastQuery("");
      const data = await fetchProducts();
      setProducts(data);
      setDisplayProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Apply sort whenever sortBy or displayProducts source changes ──
  const applySort = useCallback(
    (list, sort) => {
      const sorter = getSorter(sort);
      return sorter ? [...list].sort(sorter) : list;
    },
    []
  );

  // ── Category filter ───────────────────────────────────────
  const handleCategoryChange = useCallback(
    (cat) => {
      setActiveCategory(cat);
      setAiSummary("");
      setIsAIMode(false);
      const filtered = cat === "All" ? products : products.filter((p) => p.category === cat);
      setDisplayProducts(applySort(filtered, sortBy));
    },
    [products, sortBy, applySort]
  );

  // ── Sort change ───────────────────────────────────────────
  const handleSortChange = useCallback(
    (newSort) => {
      setSortBy(newSort);
      setDisplayProducts((prev) => applySort(prev, newSort));
    },
    [applySort]
  );

  // ── AI + keyword ask ──────────────────────────────────────
  const handleAsk = useCallback(async (query) => {
    try {
      setAskLoading(true);
      setError(null);
      setAiSummary("");
      setActiveCategory("All");
      setLastQuery(query);

      if (askModeEnabled) {
        setIsAIMode(true);
        const result = await askAI(query);
        setAiSummary(result.summary || "");
        setDisplayProducts(result.products || []);
      } else {
        // Normal keyword search
        setIsAIMode(false);
        const url = new URL(`http://localhost:4000/api/products`);
        url.searchParams.set("q", query);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setDisplayProducts(data);
      }
    } catch (err) {
      setError(err.message);
      setIsAIMode(false);
    } finally {
      setAskLoading(false);
    }
  }, [askModeEnabled]);

  // ── Retry handler ─────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (lastQuery) {
      handleAsk(lastQuery);
    } else {
      loadProducts();
    }
  }, [lastQuery, handleAsk, loadProducts]);

  // ── Clear AI results ──────────────────────────────────────
  const handleClearAI = useCallback(() => {
    setAiSummary("");
    setIsAIMode(false);
    setActiveCategory("All");
    setSortBy("default");
    setDisplayProducts(products);
  }, [products]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo" id="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f857a6" />
                  <stop offset="100%" stopColor="#ff5858" />
                </linearGradient>
              </defs>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>DiscoverAI</span>
          </div>

          <nav className="header-nav" id="main-nav">
            <a href="#" className="nav-link active" id="nav-home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Home
            </a>
            <a href="#about-section" className="nav-link" id="nav-about">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              About
            </a>
            <a href="#contact-section" className="nav-link" id="nav-contact">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              Contact
            </a>
            <button className="nav-cart-btn" id="nav-cart" onClick={handleAddToCart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </nav>

        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Discover products with
            <span className="gradient-text"> AI-powered</span> search
          </h1>
          <p className="hero-subtitle">
            Ask anything — our AI understands your intent and finds the perfect match from our catalog.
          </p>

          {/* Stats bar */}
          {!loading && (
            <div className="hero-stats" id="hero-stats">
              <div className="stat">
                <span className="stat-num">{stats.total}</span>
                <span className="stat-label">Products</span>
              </div>
              <span className="stat-dot">·</span>
              <div className="stat">
                <span className="stat-num">{stats.categories}</span>
                <span className="stat-label">Categories</span>
              </div>
              <span className="stat-dot">·</span>
              <div className="stat">
                <span className="stat-num">{stats.featured}</span>
                <span className="stat-label">Featured</span>
              </div>
              <span className="stat-dot">·</span>
              <div className="stat">
                <span className="stat-num ai-sparkle">✦</span>
                <span className="stat-label">AI-Powered</span>
              </div>
            </div>
          )}

          <SearchBar
            onSearch={handleAsk}
            loading={askLoading}
            isAIMode={askModeEnabled}
            onToggleMode={setAskModeEnabled}
          />
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="main container">
        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />

        {/* AI Summary */}
        <AISummary summary={aiSummary} visible={isAIMode} loading={askLoading} />

        {/* Toolbar: categories + sort + clear */}
        <div className="toolbar">
          <CategoryFilter
            categories={CATEGORIES}
            active={activeCategory}
            onChange={handleCategoryChange}
            counts={categoryCounts}
          />

          <div className="toolbar-row">
            <SortControls sortBy={sortBy} onChange={handleSortChange} />
            {isAIMode && (
              <button className="clear-btn" onClick={handleClearAI} id="clear-ai">
                ✕ Clear AI results
              </button>
            )}
          </div>
        </div>

        {/* Product count */}
        <div className="results-info">
          <span>
            {loading ? "Loading…" : `${displayProducts.length} product${displayProducts.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <ProductList
          products={displayProducts}
          loading={loading || askLoading}
          onProductClick={setSelectedProduct}
        />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="footer" id="contact-section">
        <div className="container">
          <div className="footer-grid">
            {/* Column 1: Brand & Quote */}
            <div className="footer-col" id="about-section">
              <div className="footer-brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#footerGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f857a6" />
                      <stop offset="100%" stopColor="#ff5858" />
                    </linearGradient>
                  </defs>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>DiscoverAI</span>
              </div>
              <blockquote className="footer-quote">
                "The best way to predict the future is to invent it."
                <cite>— Alan Kay</cite>
              </blockquote>
              <p className="footer-tagline">Empowering your shopping with artificial intelligence. Finding the right product shouldn't be hard.</p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#">Home</a></li>
                <li><a href="#about-section">About Us</a></li>
                <li><a href="#">Products</a></li>
                <li><a href="#contact-section">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div className="footer-col">
              <h4 className="footer-heading">Get in Touch</h4>
              <ul className="footer-contact">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  hello@discoverai.com
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  +1 (555) 123-4567
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  San Francisco, CA 94105
                </li>
              </ul>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Twitter">𝕏</a>
                <a href="#" className="social-link" aria-label="GitHub">⌘</a>
                <a href="#" className="social-link" aria-label="LinkedIn">in</a>
                <a href="#" className="social-link" aria-label="Instagram">◎</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 DiscoverAI — Built with React + Express + OpenAI</p>
            <p className="footer-quote-small">"Innovation distinguishes between a leader and a follower." — Steve Jobs</p>
          </div>
        </div>
      </footer>

      {/* ── Scroll-to-top ───────────────────────────────────── */}
      <ScrollToTop />

      {/* ── Modal ───────────────────────────────────────────── */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
