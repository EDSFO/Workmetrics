describe('Timer Logic', () => {
    const calculateDuration = (startTime, endTime) => {
        return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    };
    const calculateElapsed = (startTime) => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        return Math.floor((now - start) / 1000);
    };
    describe('calculateDuration', () => {
        it('should calculate correct duration for 1 hour', () => {
            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T11:00:00Z');
            const duration = calculateDuration(start, end);
            expect(duration).toBe(3600);
        });
        it('should calculate correct duration for 30 minutes', () => {
            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T10:30:00Z');
            const duration = calculateDuration(start, end);
            expect(duration).toBe(1800);
        });
        it('should calculate correct duration for 1 minute', () => {
            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T10:01:00Z');
            const duration = calculateDuration(start, end);
            expect(duration).toBe(60);
        });
        it('should handle duration across days', () => {
            const start = new Date('2024-01-01T23:00:00Z');
            const end = new Date('2024-01-02T01:00:00Z');
            const duration = calculateDuration(start, end);
            expect(duration).toBe(7200);
        });
        it('should return 0 for same start and end time', () => {
            const time = new Date('2024-01-01T10:00:00Z');
            const duration = calculateDuration(time, time);
            expect(duration).toBe(0);
        });
    });
    describe('calculateElapsed', () => {
        it('should calculate elapsed seconds from ISO string', () => {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
            const elapsed = calculateElapsed(fiveMinutesAgo);
            expect(elapsed).toBeGreaterThanOrEqual(299);
            expect(elapsed).toBeLessThanOrEqual(301);
        });
        it('should return 0 for current time', () => {
            const now = new Date().toISOString();
            const elapsed = calculateElapsed(now);
            expect(elapsed).toBe(0);
        });
        it('should handle dates in the past', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const elapsed = calculateElapsed(oneHourAgo);
            expect(elapsed).toBeGreaterThanOrEqual(3599);
            expect(elapsed).toBeLessThanOrEqual(3601);
        });
    });
    describe('Time Entry Validation', () => {
        const hasOverlap = (newStart, newEnd, existingEntries) => {
            return existingEntries.some(entry => {
                if (!entry.endTime)
                    return true;
                return ((newStart >= entry.startTime && newStart <= entry.endTime) ||
                    (newEnd >= entry.startTime && newEnd <= entry.endTime) ||
                    (newStart <= entry.startTime && newEnd >= entry.endTime));
            });
        };
        it('should detect overlapping entries', () => {
            const existingEntries = [
                {
                    startTime: new Date('2024-01-01T10:00:00Z'),
                    endTime: new Date('2024-01-01T11:00:00Z'),
                },
            ];
            const newStart = new Date('2024-01-01T10:30:00Z');
            const newEnd = new Date('2024-01-01T11:30:00Z');
            expect(hasOverlap(newStart, newEnd, existingEntries)).toBe(true);
        });
        it('should not flag non-overlapping entries', () => {
            const existingEntries = [
                {
                    startTime: new Date('2024-01-01T10:00:00Z'),
                    endTime: new Date('2024-01-01T11:00:00Z'),
                },
            ];
            const newStart = new Date('2024-01-01T14:00:00Z');
            const newEnd = new Date('2024-01-01T15:00:00Z');
            expect(hasOverlap(newStart, newEnd, existingEntries)).toBe(false);
        });
        it('should detect adjacent entries as non-overlapping', () => {
            const existingEntries = [
                {
                    startTime: new Date('2024-01-01T10:00:00Z'),
                    endTime: new Date('2024-01-01T11:00:00Z'),
                },
            ];
            const newStart = new Date('2024-01-01T11:05:00Z');
            const newEnd = new Date('2024-01-01T12:00:00Z');
            expect(hasOverlap(newStart, newEnd, existingEntries)).toBe(false);
        });
    });
    describe('Duration Formatting', () => {
        const formatDuration = (seconds) => {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        it('should format 0 seconds correctly', () => {
            expect(formatDuration(0)).toBe('00:00:00');
        });
        it('should format seconds only correctly', () => {
            expect(formatDuration(45)).toBe('00:00:45');
        });
        it('should format minutes and seconds correctly', () => {
            expect(formatDuration(125)).toBe('00:02:05');
        });
        it('should format hours correctly', () => {
            expect(formatDuration(3661)).toBe('01:01:01');
        });
        it('should format large durations correctly', () => {
            expect(formatDuration(86400)).toBe('24:00:00');
        });
    });
});
//# sourceMappingURL=timer-logic.spec.js.map