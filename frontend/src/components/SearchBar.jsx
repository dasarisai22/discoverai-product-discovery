import { useState } from "react";
import "./SearchBar.css";

/**
 * @param {{ onSearch: (query: string) => void, loading: boolean }} props
 */
export default function SearchBar({ onSearch, loading }) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !loading) onSearch(query.trim());
    };

    return (
        <form className="search-bar glass" onSubmit={handleSubmit} id="search-bar">
            <div className="search-icon">
                {loading ? (
                    <span className="spinner" aria-label="Loading" />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                )}
            </div>

            <input
                id="search-input"
                type="text"
                placeholder='Ask AI anything — e.g. "budget laptops" or "best for gaming"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                autoComplete="off"
            />

            <button
                id="search-submit"
                type="submit"
                disabled={!query.trim() || loading}
                className="search-btn"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                <span>Ask AI</span>
            </button>
        </form>
    );
}
