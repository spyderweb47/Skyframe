"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

interface TimeSliderProps {
    yearStart: number;
    yearEnd: number;
    onRangeChange: (start: number, end: number) => void;
}

const MIN_YEAR = -3000;
const MAX_YEAR = 2026;
const TOTAL_RANGE = MAX_YEAR - MIN_YEAR;

function formatYear(year: number): string {
    if (year < 0) return `${Math.abs(year)} BC`;
    if (year === 0) return "1 BC";
    return `${year} AD`;
}

export default function TimeSlider({
    yearStart,
    yearEnd,
    onRangeChange,
}: TimeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<"start" | "end" | "range" | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartValues, setDragStartValues] = useState({ start: 0, end: 0 });

    const yearToPercent = useCallback(
        (y: number) => ((y - MIN_YEAR) / TOTAL_RANGE) * 100,
        []
    );

    const percentToYear = useCallback(
        (pct: number) => Math.round(MIN_YEAR + (Math.max(0, Math.min(100, pct)) / 100) * TOTAL_RANGE),
        []
    );

    const clientXToPercent = useCallback(
        (clientX: number) => {
            if (!trackRef.current) return 0;
            const rect = trackRef.current.getBoundingClientRect();
            return ((clientX - rect.left) / rect.width) * 100;
        },
        []
    );

    const startPct = yearToPercent(yearStart);
    const endPct = yearToPercent(yearEnd);

    // Activity indicators (deterministic)
    const activities = useMemo(
        () => [
            { y: -2560, h: 18 }, { y: -753, h: 14 }, { y: -480, h: 20 },
            { y: -331, h: 16 }, { y: -221, h: 22 }, { y: -4, h: 24 },
            { y: 79, h: 12 }, { y: 476, h: 18 }, { y: 622, h: 20 },
            { y: 1000, h: 14 }, { y: 1206, h: 16 }, { y: 1215, h: 12 },
            { y: 1347, h: 22 }, { y: 1453, h: 20 }, { y: 1492, h: 24 },
            { y: 1503, h: 14 }, { y: 1522, h: 16 }, { y: 1600, h: 12 },
            { y: 1610, h: 18 }, { y: 1776, h: 22 }, { y: 1789, h: 20 },
            { y: 1815, h: 14 }, { y: 1859, h: 16 }, { y: 1869, h: 12 },
            { y: 1903, h: 18 }, { y: 1912, h: 20 }, { y: 1944, h: 24 },
            { y: 1945, h: 22 }, { y: 1969, h: 20 }, { y: 1989, h: 16 },
            { y: 1994, h: 14 },
        ],
        []
    );

    const labels = useMemo(
        () => [
            { year: -3000, text: "3000 BC" },
            { year: -2000, text: "2000 BC" },
            { year: -1000, text: "1000 BC" },
            { year: 0, text: "1 AD" },
            { year: 500, text: "500" },
            { year: 1000, text: "1000" },
            { year: 1500, text: "1500" },
            { year: 1800, text: "1800" },
            { year: 1900, text: "1900" },
            { year: 2000, text: "2000" },
        ],
        []
    );

    // Handle mouse/touch events
    const handleMouseDown = useCallback(
        (e: React.MouseEvent, handle: "start" | "end" | "range") => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(handle);
            setDragStartX(e.clientX);
            setDragStartValues({ start: yearStart, end: yearEnd });
        },
        [yearStart, yearEnd]
    );

    const handleTrackClick = useCallback(
        (e: React.MouseEvent) => {
            if (dragging) return;
            const pct = clientXToPercent(e.clientX);
            const clickYear = percentToYear(pct);

            // Determine which handle to move (whichever is closer)
            const distToStart = Math.abs(clickYear - yearStart);
            const distToEnd = Math.abs(clickYear - yearEnd);

            if (distToStart < distToEnd) {
                onRangeChange(Math.min(clickYear, yearEnd - 10), yearEnd);
            } else {
                onRangeChange(yearStart, Math.max(clickYear, yearStart + 10));
            }
        },
        [dragging, clientXToPercent, percentToYear, yearStart, yearEnd, onRangeChange]
    );

    useEffect(() => {
        if (!dragging) return;

        const handleMove = (e: MouseEvent) => {
            const pct = clientXToPercent(e.clientX);
            const deltaPct = pct - clientXToPercent(dragStartX);
            const deltaYear = Math.round((deltaPct / 100) * TOTAL_RANGE);

            if (dragging === "start") {
                const newStart = Math.max(MIN_YEAR, Math.min(yearEnd - 10, dragStartValues.start + deltaYear));
                onRangeChange(newStart, yearEnd);
            } else if (dragging === "end") {
                const newEnd = Math.min(MAX_YEAR, Math.max(yearStart + 10, dragStartValues.end + deltaYear));
                onRangeChange(yearStart, newEnd);
            } else if (dragging === "range") {
                const rangeWidth = dragStartValues.end - dragStartValues.start;
                let newStart = dragStartValues.start + deltaYear;
                let newEnd = dragStartValues.end + deltaYear;
                if (newStart < MIN_YEAR) {
                    newStart = MIN_YEAR;
                    newEnd = MIN_YEAR + rangeWidth;
                }
                if (newEnd > MAX_YEAR) {
                    newEnd = MAX_YEAR;
                    newStart = MAX_YEAR - rangeWidth;
                }
                onRangeChange(newStart, newEnd);
            }
        };

        const handleUp = () => setDragging(null);

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [dragging, dragStartX, dragStartValues, yearStart, yearEnd, clientXToPercent, onRangeChange]);

    return (
        <div className="ts-root">
            {/* Range info */}
            <div className="ts-info">
                <div className="ts-range-badge">
                    <span className="ts-range-text">{formatYear(yearStart)}</span>
                    <span className="ts-range-sep">→</span>
                    <span className="ts-range-text">{formatYear(yearEnd)}</span>
                </div>
                <span className="ts-range-span">{yearEnd - yearStart} year span</span>
            </div>

            {/* Track Container */}
            <div className="ts-track-container">
                <div
                    ref={trackRef}
                    className="ts-track"
                    onClick={handleTrackClick}
                >
                    {/* Labels (inside track at top) */}
                    <div className="ts-labels">
                        {labels.map((l) => (
                            <span
                                key={l.year}
                                className="ts-label"
                                style={{ left: `${yearToPercent(l.year)}%` }}
                            >
                                {l.text}
                            </span>
                        ))}
                    </div>

                    {/* Baseline */}
                    <div className="ts-baseline" />

                    {/* Activity bars */}
                    {activities.map((a) => {
                        const inRange = a.y >= yearStart && a.y <= yearEnd;
                        return (
                            <div
                                key={a.y}
                                className={`ts-activity ${inRange ? "ts-activity-active" : ""}`}
                                style={{
                                    left: `${yearToPercent(a.y)}%`,
                                    height: `${a.h}px`,
                                }}
                            />
                        );
                    })}

                    {/* Selected range highlight */}
                    <div
                        className="ts-range-fill"
                        style={{
                            left: `${startPct}%`,
                            width: `${endPct - startPct}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, "range")}
                    />

                    {/* Start handle (minimal pill) */}
                    <div
                        className="ts-handle ts-handle-start"
                        style={{ left: `${startPct}%` }}
                        onMouseDown={(e) => handleMouseDown(e, "start")}
                    />

                    {/* End handle (minimal pill) */}
                    <div
                        className="ts-handle ts-handle-end"
                        style={{ left: `${endPct}%` }}
                        onMouseDown={(e) => handleMouseDown(e, "end")}
                    />
                </div>
            </div>
        </div>
    );
}
