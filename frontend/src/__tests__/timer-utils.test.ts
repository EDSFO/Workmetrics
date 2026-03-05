/**
 * Unit tests for Timer utility functions
 */

// Format seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate elapsed time from start time
function calculateElapsed(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / 1000);
}

describe('Timer Utils', () => {
  describe('formatDuration', () => {
    it('should format 0 seconds as 00:00:00', () => {
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

    it('should format exactly one hour', () => {
      expect(formatDuration(3600)).toBe('01:00:00');
    });

    it('should format large durations correctly', () => {
      expect(formatDuration(86400)).toBe('24:00:00');
    });

    it('should handle edge cases at hour boundaries', () => {
      expect(formatDuration(3599)).toBe('00:59:59');
      expect(formatDuration(3600)).toBe('01:00:00');
      expect(formatDuration(3601)).toBe('01:00:01');
    });
  });

  describe('calculateElapsed', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate elapsed seconds correctly', () => {
      const pastDate = new Date('2024-01-01T10:00:00Z');
      jest.setSystemTime(new Date('2024-01-01T10:05:00Z'));

      const elapsed = calculateElapsed(pastDate.toISOString());

      expect(elapsed).toBe(300);
    });

    it('should return 0 for current time', () => {
      const now = new Date();
      jest.setSystemTime(now);

      const elapsed = calculateElapsed(now.toISOString());

      expect(elapsed).toBe(0);
    });

    it('should calculate elapsed for 1 hour', () => {
      const pastDate = new Date('2024-01-01T10:00:00Z');
      jest.setSystemTime(new Date('2024-01-01T11:00:00Z'));

      const elapsed = calculateElapsed(pastDate.toISOString());

      expect(elapsed).toBe(3600);
    });

    it('should handle different time zones correctly', () => {
      // Using ISO string ensures timezone consistency
      const pastDate = new Date('2024-01-01T10:00:00Z');
      jest.setSystemTime(new Date('2024-01-01T10:30:30Z'));

      const elapsed = calculateElapsed(pastDate.toISOString());

      // Should be approximately 1830 seconds (30 min 30 sec)
      expect(elapsed).toBe(1830);
    });
  });
});
