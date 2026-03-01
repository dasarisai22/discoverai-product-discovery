import { useState } from "react";
import "./SearchBar.css";

/**
 * @param {{ onSearch: (query: string) => void, loading: boolean, isAIMode: boolean, onToggleMode: (mode: boolean) => void }} props
 */
export default function SearchBar({ onSearch, loading, isAIMode, onToggleMode }) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !loading) onSearch(query.trim());
    };

    return (
        <div className="search-container">
            {isAIMode && (
                <div className="ai-mode-badge fade-in">
                    <span className="ai-sparkle pulse-icon">✨</span> AI Mode Active
                </div>
            )}
            <form className={`search-bar glass ${isAIMode ? 'ai-active-border' : ''}`} onSubmit={handleSubmit} id="search-bar">

                <div className="search-mode-toggle">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isAIMode}
                            onChange={(e) => onToggleMode(e.target.checked)}
                            disabled={loading}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div className="search-icon">
                    {loading ? (
                        <span className="spinner" aria-label="Loading" />
                    ) : isAIMode ? (
                        <span className="ai-sparkle">✨</span>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    )}
                </div>

                <input
                    id="search-input"
                    type="text"
                    placeholder={isAIMode ? 'Ask AI anything — e.g. "budget laptops for students"' : 'Search catalog...'}
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
                    {isAIMode ? (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            <span>Ask AI</span>
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <span>Search</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
