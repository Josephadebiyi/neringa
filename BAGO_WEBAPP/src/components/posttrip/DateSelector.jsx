import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_BULK_DATES = 60;

function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function buildMonthGrid(cursor) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    return cells;
}

const MODES = [
    { id: 'single', label: 'Single date' },
    { id: 'pick', label: 'Pick dates' },
    { id: 'month', label: 'Whole month' },
    { id: 'daily', label: 'Next N days' },
];

// Manages `dates` (array of 'YYYY-MM-DD' strings). Business accounts get all four
// modes; individual accounts are restricted to a single date since their trips
// need manual admin review and bulk posting would flood that queue.
export default function DateSelector({ dates, onChange, isBusinessAccount }) {
    const [mode, setMode] = useState(dates.length > 1 ? 'pick' : 'single');
    const [cursor, setCursor] = useState(() => {
        const base = dates[0] ? new Date(dates[0]) : new Date();
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });
    const [dailyCount, setDailyCount] = useState(14);
    const [dailyStart, setDailyStart] = useState(dates[0] || toDateStr(startOfToday()));

    const today = startOfToday();
    const selectedSet = useMemo(() => new Set(dates), [dates]);
    const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

    const changeMode = (nextMode) => {
        setMode(nextMode);
        if (nextMode === 'single') {
            onChange(dates[0] ? [dates[0]] : []);
        }
    };

    const toggleDate = (date) => {
        if (!date || date < today) return;
        const str = toDateStr(date);
        if (mode === 'single') {
            onChange([str]);
            return;
        }
        if (selectedSet.has(str)) {
            onChange(dates.filter(d => d !== str));
        } else if (dates.length < MAX_BULK_DATES) {
            onChange([...dates, str].sort());
        }
    };

    const selectWholeMonth = () => {
        const days = grid.filter(d => d && d >= today).map(toDateStr);
        onChange(days.slice(0, MAX_BULK_DATES));
    };

    const applyDailyRange = () => {
        const start = new Date(dailyStart);
        if (Number.isNaN(start.getTime())) return;
        const count = Math.min(Math.max(1, Number(dailyCount) || 1), MAX_BULK_DATES);
        const result = [];
        for (let i = 0; i < count; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            result.push(toDateStr(d));
        }
        onChange(result);
    };

    return (
        <div className="space-y-4">
            {isBusinessAccount && (
                <div className="flex flex-wrap gap-2">
                    {MODES.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => changeMode(m.id)}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === m.id ? 'bg-[#5845D8] text-white shadow-lg shadow-[#5845D8]/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            )}

            {mode === 'single' && (
                <input
                    type="date"
                    value={dates[0] || ''}
                    min={toDateStr(today)}
                    onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                />
            )}

            {(mode === 'pick' || mode === 'month') && (
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => setCursor(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-white text-gray-400"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-black text-[#012126] uppercase tracking-wider">
                            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-white text-gray-400"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {mode === 'month' && (
                        <button
                            type="button"
                            onClick={selectWholeMonth}
                            className="w-full mb-3 py-2 bg-[#5845D8]/10 text-[#5845D8] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#5845D8]/15"
                        >
                            Select all remaining days this month
                        </button>
                    )}

                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={i} className="text-[9px] font-black text-gray-300 uppercase">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {grid.map((date, i) => {
                            if (!date) return <div key={i} />;
                            const str = toDateStr(date);
                            const isPast = date < today;
                            const isSelected = selectedSet.has(str);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => toggleDate(date)}
                                    className={`aspect-square rounded-lg text-[11px] font-bold transition-all ${
                                        isPast ? 'text-gray-200 cursor-not-allowed' :
                                        isSelected ? 'bg-[#5845D8] text-white shadow-md' :
                                        'text-[#012126] hover:bg-white'
                                    }`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                    {dates.length > 0 && (
                        <p className="mt-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {dates.length} date{dates.length > 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>
            )}

            {mode === 'daily' && (
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Start date</label>
                            <input
                                type="date"
                                value={dailyStart}
                                min={toDateStr(today)}
                                onChange={(e) => setDailyStart(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-100 text-xs font-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Number of days</label>
                            <input
                                type="number"
                                min={1}
                                max={MAX_BULK_DATES}
                                value={dailyCount}
                                onChange={(e) => setDailyCount(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-100 text-xs font-black bg-white"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={applyDailyRange}
                        className="w-full py-2 bg-[#5845D8]/10 text-[#5845D8] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#5845D8]/15"
                    >
                        Post daily for {Math.min(Math.max(1, Number(dailyCount) || 1), MAX_BULK_DATES)} days
                    </button>
                    {dates.length > 0 && (
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {dates.length} date{dates.length > 1 ? 's' : ''} selected — {dates[0]} to {dates[dates.length - 1]}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
