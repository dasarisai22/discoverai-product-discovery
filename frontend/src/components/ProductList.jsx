import ProductCard from "./ProductCard";
import "./ProductList.css";

/**
 * Responsive grid of product cards with loading skeleton.
 * @param {{ products: Array, loading: boolean, onProductClick: Function }} props
 */
export default function ProductList({ products, loading, onProductClick }) {
    if (loading) {
        return (
            <div className="product-grid" id="product-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card glass" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="empty-state" id="empty-state">
                <span className="empty-icon">🔍</span>
                <p>No products found. Try a different search or category.</p>
            </div>
        );
    }

    return (
        <div className="product-grid" id="product-grid">
            {products.map((product, i) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onProductClick}
                    style={{ animationDelay: `${i * 0.06}s` }}
                />
            ))}
        </div>
    );
}
