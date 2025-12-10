import React, { useEffect, useMemo, useState, useRef } from 'react';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';
import '../css/DailyMomentsTracker.css';
import { db } from '../firebase';
import {
    getCachedDailyMoments,
    setCachedDailyMoments,
    updateCachedDailyMoment,
    isInitialLoadDone,
    updateLastSync
} from '../utils/localCache';

const DailyMomentsTracker = ({ userId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [moments, setMoments] = useState({});
    const [editingMoments, setEditingMoments] = useState({});
    const [showRecentMoments, setShowRecentMoments] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const textareaRefs = useRef({});

    const getMonthName = (date) => date.toLocaleString('default', { month: 'long' });
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
        setEditingMoments({});
    };

    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
        setEditingMoments({});
    };

    // Save moments to Firebase
    const saveMoments = async () => {
        if (!userId) return;
        
        try {
            const monthKey = getMonthKey(currentDate);

            const savePromises = Object.entries(editingMoments).map(async ([day, moment]) => {
                // New path: users/{userId}/dailyMoments/{monthKey}/days/{dayId}
                const docRef = doc(db, `users/${userId}/dailyMoments`, monthKey, 'days', `day-${day}`);

                await setDoc(docRef, {
                    moment: moment,
                    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day))
                });
                
                // Update cache for each saved moment
                updateCachedDailyMoment(monthKey, day, moment, userId);
            });

            await Promise.all(savePromises);
            updateLastSync(userId);

            setMoments(prev => ({
                ...prev,
                ...editingMoments
            }));
            setEditingMoments({});

            alert('Moments saved successfully!');
        } catch (error) {
            console.error("Error saving moments:", error);
            alert('Failed to save moments.');
        }
    };

    const updateEditingMoment = (day, moment) => {
        setEditingMoments(prev => ({
            ...prev,
            [day]: moment
        }));
    };

    useEffect(() => {
        const fetchMoments = async () => {
            if (!userId) return;
            
            setIsLoading(true);
            try {
                const monthKey = getMonthKey(currentDate);
                
                // Check cache first if initial load is done
                if (isInitialLoadDone(userId)) {
                    const cachedMoments = getCachedDailyMoments(monthKey, userId);
                    if (cachedMoments) {
                        // console.log(`Returning daily moments for ${monthKey} from cache`);
                        setMoments(cachedMoments);
                        setIsLoading(false);
                        return;
                    }
                }

                // Fetch from Firebase - new path: users/{userId}/dailyMoments/{monthKey}/days
                // console.log(`Fetching daily moments for ${monthKey} from Firebase`);
                const q = query(
                    collection(db, `users/${userId}/dailyMoments`, monthKey, 'days')
                );

                const querySnapshot = await getDocs(q);
                const fetchedMoments = {};

                querySnapshot.forEach((doc) => {
                    const dayMatch = doc.id.match(/day-(\d+)/);
                    if (dayMatch) {
                        const day = parseInt(dayMatch[1]);
                        fetchedMoments[day] = doc.data().moment;
                    }
                });

                // Cache the fetched moments
                setCachedDailyMoments(monthKey, fetchedMoments, userId);
                updateLastSync(userId);
                setMoments(fetchedMoments);
                } catch (error) {
                console.error("Error fetching moments:", error);
                // Try to use cached data on error
                const monthKey = getMonthKey(currentDate);
                const cachedMoments = getCachedDailyMoments(monthKey, userId);
                if (cachedMoments) {
                    // console.log(`Returning cached daily moments due to error`);
                    setMoments(cachedMoments);
                }
            }
            setIsLoading(false);
        };

        fetchMoments();
    }, [currentDate, userId]);

    // Auto-resize textareas when moments are loaded
    useEffect(() => {
        Object.keys(textareaRefs.current).forEach(day => {
            const textarea = textareaRefs.current[day];
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        });
    }, [moments]);

    const unsavedCount = Object.keys(editingMoments).length;
    const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

    const mergedMoments = useMemo(() => ({ ...moments, ...editingMoments }), [moments, editingMoments]);
    const filledDays = useMemo(
        () => Object.values(mergedMoments).filter((value) => value && value.trim()).length,
        [mergedMoments]
    );

    const recentMoments = useMemo(() => {
        return Object.entries(mergedMoments)
            .filter(([, value]) => value && value.trim())
            .map(([day, value]) => ({ day: Number(day), value }))
            .sort((a, b) => b.day - a.day)
            .slice(0, 5);
    }, [mergedMoments]);

    return (
        <section className="moments-shell" id="favorite-moments">
            <div className="moments-header">
                <div>
                    <p className="eyebrow">Favorite moments</p>
                    <h2>Quick highlights</h2>
                    <p className="subtext">Jot the best parts of your day. Save whenever you tweak something.</p>
                </div>
                <button
                    onClick={saveMoments}
                    className="journal-button"
                    disabled={unsavedCount === 0}
                >
                    {unsavedCount ? `Save (${unsavedCount})` : 'Save' }
                </button>
            </div>

            {/* Mobile Overview Section - Shows at top on mobile */}
            <div className="moments-mobile-overview">
                <div className="moments-summary">
                    <p className="section-label">Overview</p>
                    <div className="summary-grid">
                        <div className="summary-chip">
                            <span className="summary-value">{filledDays}/{daysInMonth}</span>
                            <p className="summary-label">Days filled</p>
                        </div>
                        <div className="summary-chip">
                            <span className="summary-value">{unsavedCount}</span>
                            <p className="summary-label">Unsaved edits</p>
                        </div>
                    </div>
                </div>

                <div className="moments-recent">
                    <div className="moments-recent__head">
                        <p className="section-label">Recent moments</p>
                        <button 
                            className="moments-toggle-btn"
                            onClick={() => setShowRecentMoments(!showRecentMoments)}
                        >
                            {showRecentMoments ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {showRecentMoments && recentMoments.length > 0 && (
                        <div className="moments-recent__list">
                            {recentMoments.map((item) => (
                                <div key={item.day} className="recent-item">
                                    <span className="pill tiny">Day {item.day}</span>
                                    <p className="preview">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {showRecentMoments && !recentMoments.length && (
                        <p className="empty-moments">No moments recorded yet this month.</p>
                    )}
                </div>
            </div>

            <div className="moments-layout">
                <div className="moments-card moments-main">
                    <div className="month-navigation month-nav">
                            <button
                                onClick={goToPreviousMonth}
                                className="moments-nav-button month-nav__btn"
                                aria-label="Previous month"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        <div className="month-title-wrap">
                            <h3 className="month-title">
                                {getMonthName(currentDate)} {currentDate.getFullYear()}
                            </h3>
                        </div>
                        <button
                            onClick={goToNextMonth}
                            className="moments-nav-button month-nav__btn"
                            aria-label="Next month"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="moments-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading moments...</span>
                        </div>
                    ) : (
                    <div className="days-list">
                        {[...Array(daysInMonth)].map((_, index) => {
                            const day = index + 1;
                            return (
                                <div key={day} className="day-row">
                                    <div className="day-meta">
                                        <span className="day-number">{day}</span>
                                        <span className="pill tiny">{getMonthName(currentDate).slice(0,3)}</span>
                                    </div>
                                    
                                    <textarea
                                        ref={(el) => { textareaRefs.current[day] = el; }}
                                        value={editingMoments[day] ?? moments[day] ?? ""}
                                        onInput={(e) => {
                                            const val = e.target.value;
                                            updateEditingMoment(day, val);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        onPaste={() => {
                                            // Resize after paste (paste is async)
                                            setTimeout(() => {
                                                const el = textareaRefs.current[day];
                                                if (el) {
                                                    el.style.height = 'auto';
                                                    el.style.height = `${el.scrollHeight}px`;
                                                }
                                            }, 50);
                                        }}
                                        className="moment-textarea"
                                        rows={1}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>

                {/* Desktop sidebar - hidden on mobile */}
                <aside className="moments-side">
                    <div className="moments-summary">
                        <p className="section-label">Overview</p>
                        <div className="summary-grid">
                            <div className="summary-chip">
                                <span className="summary-value">{filledDays}/{daysInMonth}</span>
                                <p className="summary-label">Days filled</p>
                            </div>
                            <div className="summary-chip">
                                <span className="summary-value">{unsavedCount}</span>
                                <p className="summary-label">Unsaved edits</p>
                            </div>
                        </div>
                    </div>

                    <div className="moments-recent">
                        <div className="moments-recent__head">
                            <p className="section-label">Recent moments</p>
                            {!recentMoments.length && <span className="pill small subtle">Nothing yet</span>}
                        </div>
                        {recentMoments.length > 0 && (
                            <div className="moments-recent__list">
                                {recentMoments.map((item) => (
                                    <div key={item.day} className="recent-item">
                                        <span className="pill tiny">Day {item.day}</span>
                                        <p className="preview">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    );
};

export default DailyMomentsTracker;