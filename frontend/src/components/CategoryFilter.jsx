import "./CategoryFilter.css";

/**
 * Horizontal pill-style category filter bar with optional counts.
 * @param {{ categories: string[], active: string, onChange: (cat: string) => void, counts?: Record<string,number> }} props
 */
export default function CategoryFilter({ categories, active, onChange, counts }) {
    return (
        <div className="category-filter" id="category-filter">
            {categories.map((cat) => (
                <button
                    key={cat}
                    className={`cat-pill ${active === cat ? "active" : ""}`}
                    onClick={() => onChange(cat)}
                >
                    {cat}
                    {counts && counts[cat] != null && (
                        <span className="cat-count">{counts[cat]}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
