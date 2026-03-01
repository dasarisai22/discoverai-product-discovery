import "./ProductModal.css";

/**
 * Full-screen product detail modal overlay.
 * @param {{ product: Object|null, onClose: () => void }} props
 */
export default function ProductModal({ product, onClose }) {
    if (!product) return null;

    const stars = Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star ${i < Math.round(product.rating) ? "filled" : ""}`}>★</span>
    ));

    return (
        <div className="modal-overlay" id="product-modal" onClick={onClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="modal-grid">
                    <div className="modal-image">
                        <img src={product.image} alt={product.name} />
                    </div>

                    <div className="modal-details">
                        <span className="modal-category">{product.category}</span>
                        <h2>{product.name}</h2>
                        <div className="modal-rating">{stars} <span>{product.rating}/5</span></div>
                        <p className="modal-price">${product.price.toFixed(2)}</p>
                        <p className="modal-desc">{product.description}</p>

                        <div className="modal-tags">
                            {product.tags.map((tag) => (
                                <span key={tag} className="tag">#{tag}</span>
                            ))}
                        </div>

                        <div className="modal-id">ID: {product.id}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
