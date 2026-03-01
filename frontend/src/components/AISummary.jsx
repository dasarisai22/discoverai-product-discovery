import { useState, useEffect } from "react";
import "./AISummary.css";

/**
 * Displays the AI-generated summary with a sparkle icon and typewriter effect.
 * @param {{ summary: string, visible: boolean }} props
 */
export default function AISummary({ summary, visible }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!visible || !summary) {
            setDisplayed("");
            setDone(false);
            return;
        }

        setDisplayed("");
        setDone(false);
        let i = 0;
        const speed = 18; // ms per character

        const timer = setInterval(() => {
            i++;
            setDisplayed(summary.slice(0, i));
            if (i >= summary.length) {
                clearInterval(timer);
                setDone(true);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [summary, visible]);

    if (!visible || !summary) return null;

    return (
        <div className="ai-summary glass" id="ai-summary">
            <div className="ai-summary-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6c5ce7" />
                            <stop offset="100%" stopColor="#00cec9" />
                        </linearGradient>
                    </defs>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            </div>
            <div className="ai-summary-content">
                <span className="ai-label">AI Recommendation</span>
                <p>
                    {displayed}
                    {!done && <span className="typing-cursor">|</span>}
                </p>
            </div>
        </div>
    );
}
