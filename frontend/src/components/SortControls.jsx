import "./SortControls.css";

/**
 * @param {{ sortBy: string, onChange: (value: string) => void }} props
 */
export default function SortControls({ sortBy, onChange }) {
    const options = [
        { value: "default", label: "Default" },
        { value: "price-asc", label: "Price: Low → High" },
        { value: "price-desc", label: "Price: High → Low" },
        { value: "rating-desc", label: "Top Rated" },
        { value: "name-asc", label: "Name: A → Z" },
    ];

    return (
        <div className="sort-controls" id="sort-controls">
            <label htmlFor="sort-select" className="sort-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 7 2 11 6" /><line x1="7" y1="2" x2="7" y2="22" /><polyline points="21 18 17 22 13 18" /><line x1="17" y1="22" x2="17" y2="2" /></svg>
                Sort
            </label>
            <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
