describe('Report Calculations', () => {
    const mockEntries = [
        {
            id: '1',
            projectId: 'project-1',
            project: { name: 'Project A' },
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T11:00:00Z'),
            duration: 7200,
            userId: 'user-1',
        },
        {
            id: '2',
            projectId: 'project-1',
            project: { name: 'Project A' },
            startTime: new Date('2024-01-15T14:00:00Z'),
            endTime: new Date('2024-01-15T16:00:00Z'),
            duration: 7200,
            userId: 'user-1',
        },
        {
            id: '3',
            projectId: 'project-2',
            project: { name: 'Project B' },
            startTime: new Date('2024-01-16T09:00:00Z'),
            endTime: new Date('2024-01-16T12:00:00Z'),
            duration: 10800,
            userId: 'user-1',
        },
        {
            id: '4',
            projectId: null,
            project: undefined,
            startTime: new Date('2024-01-17T10:00:00Z'),
            endTime: new Date('2024-01-17T11:00:00Z'),
            duration: 3600,
            userId: 'user-1',
        },
    ];
    describe('Calculate Total Hours', () => {
        const calculateTotal = (entries) => {
            return entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        };
        it('should calculate correct total for multiple entries', () => {
            const total = calculateTotal(mockEntries);
            expect(total).toBe(28800);
        });
        it('should return 0 for empty entries', () => {
            const total = calculateTotal([]);
            expect(total).toBe(0);
        });
        it('should handle entries with null duration', () => {
            const entriesWithNull = [
                { ...mockEntries[0], duration: null },
                { ...mockEntries[1], duration: null },
            ];
            const total = calculateTotal(entriesWithNull);
            expect(total).toBe(0);
        });
    });
    describe('Calculate Total by Project', () => {
        const calculateByProject = (entries) => {
            const byProject = {};
            for (const entry of entries) {
                const projectId = entry.projectId || 'no-project';
                if (!byProject[projectId]) {
                    byProject[projectId] = {
                        projectName: entry.project?.name || 'No Project',
                        totalSeconds: 0,
                    };
                }
                byProject[projectId].totalSeconds += entry.duration || 0;
            }
            return byProject;
        };
        it('should group entries by project correctly', () => {
            const byProject = calculateByProject(mockEntries);
            expect(byProject['project-1'].totalSeconds).toBe(14400);
            expect(byProject['project-2'].totalSeconds).toBe(10800);
            expect(byProject['no-project'].totalSeconds).toBe(3600);
        });
        it('should handle entries with no project', () => {
            const entriesWithNoProject = [
                { ...mockEntries[3] },
            ];
            const byProject = calculateByProject(entriesWithNoProject);
            expect(byProject['no-project']).toBeDefined();
            expect(byProject['no-project'].projectName).toBe('No Project');
        });
        it('should return empty object for no entries', () => {
            const byProject = calculateByProject([]);
            expect(Object.keys(byProject).length).toBe(0);
        });
    });
    describe('Calculate Total by Day', () => {
        const calculateByDay = (entries) => {
            const byDay = {};
            for (const entry of entries) {
                const day = entry.startTime.toISOString().split('T')[0];
                if (!byDay[day]) {
                    byDay[day] = 0;
                }
                byDay[day] += entry.duration || 0;
            }
            return byDay;
        };
        it('should group entries by day correctly', () => {
            const byDay = calculateByDay(mockEntries);
            expect(byDay['2024-01-15']).toBe(14400);
            expect(byDay['2024-01-16']).toBe(10800);
            expect(byDay['2024-01-17']).toBe(3600);
        });
        it('should return empty object for no entries', () => {
            const byDay = calculateByDay([]);
            expect(Object.keys(byDay).length).toBe(0);
        });
    });
    describe('Date Range Calculations', () => {
        const getDateRange = (startDate, endDate) => {
            const start = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };
        it('should use default range of 30 days when no dates provided', () => {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const { start, end } = getDateRange();
            const diffFromNow = now.getTime() - end.getTime();
            const diffFromThirtyDays = start.getTime() - thirtyDaysAgo.getTime();
            expect(diffFromNow).toBeLessThan(24 * 60 * 60 * 1000);
            expect(Math.abs(diffFromThirtyDays)).toBeLessThan(24 * 60 * 60 * 1000);
        });
        it('should use provided dates correctly', () => {
            const { start, end } = getDateRange('2024-01-01', '2024-01-31');
            expect(start.getHours()).toBe(0);
            expect(start.getMinutes()).toBe(0);
            expect(end.getHours()).toBe(23);
            expect(end.getMinutes()).toBe(59);
            expect(end.getTime()).toBeGreaterThan(start.getTime());
        });
        it('should filter entries within date range', () => {
            const filterByDateRange = (entries, start, end) => {
                return entries.filter(entry => {
                    return entry.startTime >= start && entry.startTime <= end;
                });
            };
            const start = new Date('2024-01-15T00:00:00Z');
            const end = new Date('2024-01-15T23:59:59Z');
            const filtered = filterByDateRange(mockEntries, start, end);
            expect(filtered.length).toBe(2);
        });
    });
    describe('CSV Export Format', () => {
        const formatDurationForCSV = (seconds) => {
            return (seconds / 3600).toFixed(2);
        };
        it('should format duration in hours correctly', () => {
            expect(formatDurationForCSV(3600)).toBe('1.00');
            expect(formatDurationForCSV(7200)).toBe('2.00');
            expect(formatDurationForCSV(5400)).toBe('1.50');
        });
        it('should handle zero duration', () => {
            expect(formatDurationForCSV(0)).toBe('0.00');
        });
    });
});
//# sourceMappingURL=report-calculations.spec.js.map