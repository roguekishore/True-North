import React, { useEffect, useMemo, useState } from "react";
import { addJournalEntry, fetchJournalEntries } from "../utils/firestore";
import "../css/Journal.css";

const MAX_LENGTH = 1500;

const Journal = ({ userId }) => {
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState("");
    const [status, setStatus] = useState("idle");

    useEffect(() => {
        if (!userId) return;
        
        const fetchEntriesSafe = async () => {
            try {
                const fetchedEntries = await fetchJournalEntries(userId);
                setEntries(fetchedEntries || []);
            } catch (error) {
                console.error("Error fetching entries:", error);
            }
        };
        fetchEntriesSafe();
    }, [userId]);

    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return (bTime || 0) - (aTime || 0);
        });
    }, [entries]);

    const recentEntries = sortedEntries.slice(0, 3);
    const [showRecentEntries, setShowRecentEntries] = useState(false);

    const handleAddEntry = async () => {
        const content = newEntry.trim();
        if (!content || !userId) return;

        setStatus("saving");
        const entry = { content, timestamp: new Date() };

        try {
            await addJournalEntry(userId, entry);
            setEntries((prev) => [entry, ...prev]);
            setNewEntry("");
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 1600);
        } catch (error) {
            console.error("Error adding entry:", error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 2000);
        }
    };

    const charsLeft = MAX_LENGTH - newEntry.length;
    const buttonLabel = status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save entry";

    return (
        <div className="journal-shell" id="journal-entry">
            <div className="journal-head">
                <div>
                    <p className="eyebrow">Journal</p>
                    <h1>Today&apos;s entry</h1>
                    <p className="subtext">Capture your thoughts, then log favorite moments below.</p>
                </div>
            </div>

            <div className="journal-card">
                <textarea
                    id="journal-textarea"
                    className="journal-textarea"
                    value={newEntry}
                    maxLength={MAX_LENGTH}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="What did you take out from life today?"
                />

                <div className="journal-actions">
                    <span className={`char-count${charsLeft < 50 ? " warn" : ""}`}>
                        {charsLeft} characters left
                    </span>
                    <div className="journal-buttons">
                        <button
                            className="journal-button"
                            onClick={handleAddEntry}
                            disabled={!newEntry.trim() || status === "saving"}
                        >
                            {buttonLabel}
                        </button>
                    </div>
                </div>

                {/* <p className="journal-hint">Next: scroll to Favorite Moments to log quick highlights.</p> */}
            </div>

            <div className="journal-recent">
                <div className="journal-recent__head">
                    <p className="section-label">Recent entries</p>
                    {recentEntries.length === 0 && !showRecentEntries && <span className="pill small">Nothing yet</span>}
                    <button
                        className="moments-toggle-btn"
                        onClick={() => setShowRecentEntries((s) => !s)}
                    >
                        {showRecentEntries ? 'Hide' : 'Show'}
                    </button>
                </div>

                {showRecentEntries && recentEntries.length > 0 && (
                    <div className="journal-recent__list">
                        {recentEntries.map((entry, idx) => {
                            const date = entry.timestamp?.seconds
                                ? new Date(entry.timestamp.seconds * 1000)
                                : new Date(entry.timestamp);
                            return (
                                <div key={idx} className="journal-recent__item">
                                    <span className="pill small">{date.toLocaleDateString()}</span>
                                    <p className="preview">{entry.content?.slice(0, 160) || "Saved entry"}...</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showRecentEntries && !recentEntries.length && (
                    <p className="empty-moments">No entries yet.</p>
                )}
            </div>
        </div>
    );
};

export default Journal;
