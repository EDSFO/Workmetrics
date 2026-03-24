interface TimeEntry {
    id: string;
    projectId: string | null;
    project?: {
        name: string;
    };
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
    userId: string;
}
