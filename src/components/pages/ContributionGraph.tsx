import React, { useEffect, useState } from 'react';

interface Week {
    total: number;
    week: number;
    days: number[];
}

const COLORS = [
    '#e0e0e0', // 0
    '#a7f3d0', // 1
    '#34d399', // 2-4
    '#059669', // 5+
];

function getLevel(count: number) {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 4) return 2;
    return 3;
}

function getMonthShort(date: Date) {
    return date.toLocaleString('en-US', { month: 'short' });
}

export default function ContributionGraph() {
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [error, setError] = useState('');
    const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);
    const [showLegend, setShowLegend] = useState(false);

    useEffect(() => {
        fetch('https://api.github.com/repos/torvalds/linux/stats/commit_activity')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then(setWeeks)
            .catch(e => setError(e.message));
    }, []);

    // عرض فقط آخر 28 أسبوع (7 شهور تقريبًا)
    const lastWeeks = weeks.slice(-28);

    // حساب الشهور
    let monthsBar: React.ReactNode[] = [];
    if (lastWeeks.length) {
        let lastMonth: number | null = null;
        lastWeeks.forEach((week, weekIdx) => {
            const weekStart = new Date(week.week * 1000);
            const month = weekStart.getMonth();
            if (month !== lastMonth) {
                monthsBar.push(
                    <span key={weekIdx}>{getMonthShort(weekStart)}</span>
                );
                lastMonth = month;
            } else {
                monthsBar.push(<span key={weekIdx}></span>);
            }
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', margin: '24px 0', position: 'relative' }}>
            {/* الشبكة */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#111', marginLeft: 0, marginBottom: 2, userSelect: 'none', fontWeight: 600 }}>
                    {monthsBar}
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateRows: 'repeat(7, 10px)',
                        gridAutoFlow: 'column',
                        gap: 2,
                        background: '#fff',
                        padding: '4px 4px 4px 2px',
                        borderRadius: 0,
                        boxShadow: 'none',
                        overflowX: 'auto',
                        marginBottom: 8,
                        cursor: 'pointer',
                    }}
                    onClick={() => setShowLegend(true)}
                >
                    {lastWeeks.map((week, weekIdx) =>
                        week.days.map((count, dayIdx) => {
                            const date = new Date((week.week + dayIdx * 86400) * 1000);
                            const dateString = date.toLocaleDateString();
                            return (
                                <div
                                    key={weekIdx + '-' + dayIdx}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        boxSizing: 'border-box',
                                        border: '1px solid #eee',
                                        background: COLORS[getLevel(count)],
                                        transition: 'background 0.2s',
                                        gridRow: dayIdx + 1,
                                        gridColumn: weekIdx + 1,
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        setTooltip({
                                            x: e.clientX,
                                            y: e.clientY,
                                            text: `${count} commit${count !== 1 ? 's' : ''} on ${dateString}`
                                        });
                                    }}
                                    onMouseMove={e => {
                                        setTooltip(tooltip => tooltip ? { ...tooltip, x: e.clientX, y: e.clientY } : null);
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            );
                        })
                    )}
                </div>
                {tooltip && (
                    <div style={{
                        position: 'fixed',
                        left: tooltip.x + 12,
                        top: tooltip.y + 12,
                        background: '#222',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        pointerEvents: 'none',
                        zIndex: 9999,
                        boxShadow: '0 2px 8px #0003',
                        whiteSpace: 'nowrap',
                    }}>
                        {tooltip.text}
                    </div>
                )}
                {error && <div style={{ color: '#c00', marginTop: 8 }}>Error: {error}</div>}
            </div>
            {/* Legend يظهر فقط عند الضغط على الشبكة ويبقى ظاهرًا حتى الريفريش */}
            {showLegend && (
                <div
                    style={{
                        border: '1.5px dashed #a78bfa',
                        borderRadius: 6,
                        padding: 8,
                        minWidth: 90,
                        fontSize: 7,
                        color: '#222',
                        background: '#fff',
                        marginLeft: 8,
                        marginTop: 10,
                        boxShadow: '0 2px 8px #0001',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 10, height: 10, background: '#a7f3d0', borderRadius: 2, border: '1px solid #eee' }} />
                        1 коммит за день
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 10, height: 10, background: '#34d399', borderRadius: 2, border: '1px solid #eee' }} />
                        от 2 до 5 коммитов за день
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 10, height: 10, background: '#059669', borderRadius: 2, border: '1px solid #eee' }} />
                        больше 5 коммитов за день
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 10, height: 10, background: '#e0e0e0', borderRadius: 2, border: '1px solid #eee' }} />
                        0 коммитов за день
                    </div>
                </div>
            )}
        </div>
    );
} 