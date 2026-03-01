import "./ProductCard.css";

/**
 * Reusable product card component.
 * @param {{ product: Object, onClick: (product: Object) => void }} props
 */
export default function ProductCard({ product, onClick }) {
    const stars = Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star ${i < Math.round(product.rating) ? "filled" : ""}`}>★</span>
    ));

    const isOutOfStock = product.inStock === false;

    return (
        <article
            className={`product-card glass ${isOutOfStock ? "out-of-stock" : ""}`}
            onClick={() => onClick?.(product)}
            id={`product-${product.id}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onClick?.(product)}
            role="button"
            aria-label={`View details for ${product.name}`}
        >
            <div className="card-img-wrapper">
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="card-category">{product.category}</span>
                {product.featured && <span className="card-badge featured-badge">⚡ Featured</span>}
                {isOutOfStock && <span className="card-badge oos-badge">Out of Stock</span>}
                <div className="card-hover-overlay">
                    <span className="view-details-cue">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        View Details
                    </span>
                </div>
            </div>

            <div className="card-body">
                <h3 className="card-title">{product.name}</h3>

                <div className="card-meta">
                    <span className="card-price">${product.price.toFixed(2)}</span>
                    <span className="card-rating">{stars} <span className="rating-num">{product.rating}</span></span>
                </div>

                <p className="card-desc">{product.description}</p>

                <div className="card-tags">
                    {product.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </article>
    );
}
