import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workLogs } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface ValidationIssue {
  type: 'overlap' | 'impossible' | 'pattern' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  message: string;
  logIds: number[];
  suggestion?: string;
  details?: any;
}

interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalLogs: number;
    totalHours: number;
    averageHoursPerDay: number;
    maxHoursInDay: number;
  };
}

// Helper to parse time string to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper to check if two time ranges overlap
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// Detect overlapping work hours on the same day
function detectOverlaps(logs: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const logsByDate: { [key: string]: any[] } = {};

  // Group logs by date
  logs.forEach((log) => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  // Check for overlaps within each day
  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    for (let i = 0; i < dayLogs.length; i++) {
      for (let j = i + 1; j < dayLogs.length; j++) {
        const log1 = dayLogs[i];
        const log2 = dayLogs[j];

        if (timeRangesOverlap(log1.timeIn, log1.timeOut, log2.timeIn, log2.timeOut)) {
          issues.push({
            type: 'overlap',
            severity: 'high',
            message: `Overlapping work hours detected on ${date}`,
            logIds: [log1.id, log2.id],
            suggestion: 'Please adjust the time entries to avoid overlap or remove duplicate entries.',
            details: {
              date,
              log1: `${log1.timeIn} - ${log1.timeOut} (${log1.activityType})`,
              log2: `${log2.timeIn} - ${log2.timeOut} (${log2.activityType})`,
            },
          });
        }
      }
    }
  });

  return issues;
}

// Detect impossible hour entries
function detectImpossibleHours(logs: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const logsByDate: { [key: string]: any[] } = {};

  // Group logs by date
  logs.forEach((log) => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  // Check each log for impossible hours
  logs.forEach((log) => {
    // Check for negative hours
    if (log.totalHours < 0) {
      issues.push({
        type: 'impossible',
        severity: 'high',
        message: `Negative hours detected: ${log.totalHours} hours`,
        logIds: [log.id],
        suggestion: 'Time-out should be after time-in. Please correct the entry.',
        details: { date: log.date, timeIn: log.timeIn, timeOut: log.timeOut },
      });
    }

    // Check for unreasonably long hours (>12 hours in a single entry)
    if (log.totalHours > 12) {
      issues.push({
        type: 'impossible',
        severity: 'medium',
        message: `Unusually long work session: ${log.totalHours} hours`,
        logIds: [log.id],
        suggestion: 'A single work session exceeding 12 hours is unusual. Please verify the entry.',
        details: { date: log.date, timeIn: log.timeIn, timeOut: log.timeOut },
      });
    }
  });

  // Check total hours per day
  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    const totalHours = dayLogs.reduce((sum, log) => sum + log.totalHours, 0);

    if (totalHours > 24) {
      issues.push({
        type: 'impossible',
        severity: 'high',
        message: `Total hours exceed 24 hours on ${date}: ${totalHours.toFixed(1)} hours`,
        logIds: dayLogs.map((log) => log.id),
        suggestion: 'The total work hours for a day cannot exceed 24 hours. Please review all entries for this date.',
        details: { date, totalHours },
      });
    } else if (totalHours > 16) {
      issues.push({
        type: 'impossible',
        severity: 'medium',
        message: `Very high total hours on ${date}: ${totalHours.toFixed(1)} hours`,
        logIds: dayLogs.map((log) => log.id),
        suggestion: 'Working more than 16 hours in a day is unusual. Please verify all entries.',
        details: { date, totalHours },
      });
    }
  });

  return issues;
}

// Detect suspicious repeating patterns
function detectPatterns(logs: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const timePatterns: { [key: string]: number[] } = {};

  // Look for exact time repetitions
  logs.forEach((log) => {
    const pattern = `${log.timeIn}-${log.timeOut}`;
    if (!timePatterns[pattern]) {
      timePatterns[pattern] = [];
    }
    timePatterns[pattern].push(log.id);
  });

  // Flag patterns that repeat suspiciously often
  Object.entries(timePatterns).forEach(([pattern, logIds]) => {
    if (logIds.length >= 5) {
      const [timeIn, timeOut] = pattern.split('-');
      issues.push({
        type: 'pattern',
        severity: 'low',
        message: `Identical time pattern repeated ${logIds.length} times: ${timeIn} - ${timeOut}`,
        logIds,
        suggestion: 'While consistent schedules are common, verify that all these entries are accurate.',
        details: { pattern, count: logIds.length },
      });
    }
  });

  // Check for consecutive days with identical entries
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let consecutiveCount = 1;
  let consecutiveGroup: number[] = [];

  for (let i = 1; i < sortedLogs.length; i++) {
    const prev = sortedLogs[i - 1];
    const curr = sortedLogs[i];

    if (
      prev.timeIn === curr.timeIn &&
      prev.timeOut === curr.timeOut &&
      prev.activityType === curr.activityType &&
      prev.subject === curr.subject
    ) {
      if (consecutiveCount === 1) {
        consecutiveGroup.push(prev.id);
      }
      consecutiveGroup.push(curr.id);
      consecutiveCount++;
    } else {
      if (consecutiveCount >= 7) {
        issues.push({
          type: 'pattern',
          severity: 'medium',
          message: `Identical entries for ${consecutiveCount} consecutive days`,
          logIds: consecutiveGroup,
          suggestion: 'Verify that these entries represent actual work and not copy-paste errors.',
          details: { consecutiveDays: consecutiveCount },
        });
      }
      consecutiveCount = 1;
      consecutiveGroup = [];
    }
  }

  // Check last group
  if (consecutiveCount >= 7) {
    issues.push({
      type: 'pattern',
      severity: 'medium',
      message: `Identical entries for ${consecutiveCount} consecutive days`,
      logIds: consecutiveGroup,
      suggestion: 'Verify that these entries represent actual work and not copy-paste errors.',
    });
  }

  return issues;
}

// Simple anomaly detection using statistical methods (IQR method)
function detectAnomalies(logs: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (logs.length < 10) {
    // Not enough data for anomaly detection
    return issues;
  }

  // Get all hours values
  const hours = logs.map((log) => log.totalHours).sort((a, b) => a - b);

  // Calculate quartiles
  const q1Index = Math.floor(hours.length * 0.25);
  const q3Index = Math.floor(hours.length * 0.75);
  const q1 = hours[q1Index];
  const q3 = hours[q3Index];
  const iqr = q3 - q1;

  // Define outlier bounds
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Find anomalies
  logs.forEach((log) => {
    if (log.totalHours < lowerBound || log.totalHours > upperBound) {
      issues.push({
        type: 'anomaly',
        severity: 'low',
        message: `Unusual work duration detected: ${log.totalHours} hours on ${log.date}`,
        logIds: [log.id],
        suggestion: 'This entry deviates significantly from your typical work pattern. Please verify.',
        details: {
          date: log.date,
          hours: log.totalHours,
          typicalRange: `${q1.toFixed(1)} - ${q3.toFixed(1)} hours`,
        },
      });
    }
  });

  return issues;
}

// Calculate statistics
function calculateStats(logs: any[]) {
  const totalHours = logs.reduce((sum, log) => sum + log.totalHours, 0);
  
  // Get unique dates
  const uniqueDates = new Set(logs.map((log) => log.date));
  const averageHoursPerDay = uniqueDates.size > 0 ? totalHours / uniqueDates.size : 0;

  // Calculate max hours in a single day
  const logsByDate: { [key: string]: number } = {};
  logs.forEach((log) => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = 0;
    }
    logsByDate[log.date] += log.totalHours;
  });

  const maxHoursInDay = Object.values(logsByDate).reduce((max, hours) => Math.max(max, hours), 0);

  return {
    totalLogs: logs.length,
    totalHours: Math.round(totalHours * 10) / 10,
    averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
    maxHoursInDay: Math.round(maxHoursInDay * 10) / 10,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { facultyId, startDate, endDate } = await req.json();

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    // Build query conditions
    const conditions = [eq(workLogs.facultyId, facultyId)];
    
    if (startDate) {
      conditions.push(gte(workLogs.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(workLogs.date, endDate));
    }

    // Fetch work logs
    const logs = await db
      .select()
      .from(workLogs)
      .where(and(...conditions))
      .orderBy(workLogs.date);

    if (logs.length === 0) {
      return NextResponse.json({
        isValid: true,
        issues: [],
        stats: {
          totalLogs: 0,
          totalHours: 0,
          averageHoursPerDay: 0,
          maxHoursInDay: 0,
        },
      });
    }

    // Run all validations
    const overlapIssues = detectOverlaps(logs);
    const impossibleIssues = detectImpossibleHours(logs);
    const patternIssues = detectPatterns(logs);
    const anomalyIssues = detectAnomalies(logs);

    // Combine all issues
    const allIssues = [
      ...overlapIssues,
      ...impossibleIssues,
      ...patternIssues,
      ...anomalyIssues,
    ];

    // Calculate statistics
    const stats = calculateStats(logs);

    const result: ValidationResult = {
      isValid: allIssues.filter((i) => i.severity === 'high').length === 0,
      issues: allIssues,
      stats,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate work logs' },
      { status: 500 }
    );
  }
}
