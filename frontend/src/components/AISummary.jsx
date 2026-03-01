import { useState, useEffect } from "react";
import "./AISummary.css";

/**
 * Displays the AI-generated summary with a sparkle icon and typewriter effect.
 * @param {{ summary: string, visible: boolean, loading?: boolean }} props
 */
export default function AISummary({ summary, visible, loading }) {
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

    if (!visible) return null;

    if (loading) {
        return (
            <div className="ai-summary glass ai-highlight ai-loading-container" id="ai-loading">
                <div className="ai-summary-icon pulsing">
                    ✨
                </div>
                <div className="ai-summary-content">
                    <span className="ai-label">✨ AI Recommendation</span>
                    <p className="ai-thinking-text">AI is thinking...</p>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="ai-summary glass ai-highlight" id="ai-summary">
            <div className="ai-summary-icon">
                ✨
            </div>
            <div className="ai-summary-content">
                <span className="ai-label">✨ AI Recommendation</span>
                <p>
                    {displayed}
                    {!done && <span className="typing-cursor">|</span>}
                </p>
            </div>
        </div>
    );
}
