import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// User table for authentication
export const user = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'admin' or 'faculty'
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Faculty table with employment details
export const faculty = sqliteTable('faculty', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => user.id).notNull(),
  employeeId: text('employee_id').notNull().unique(),
  department: text('department').notNull(), // AI & DS, Electrical, Food Tech, Mechatronics, Civil & Infrastructure
  designation: text('designation').notNull(), // Professor, Associate Professor, Assistant Professor, Lecturer
  joiningDate: text('joining_date').notNull(),
  baseSalary: real('base_salary').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Billing table for salary records
export const billing = sqliteTable('billing', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  month: text('month').notNull(), // Format: YYYY-MM
  baseSalary: real('base_salary').notNull(),
  allowances: real('allowances').notNull(),
  deductions: real('deductions').notNull(),
  netSalary: real('net_salary').notNull(),
  workload: text('workload', { mode: 'json' }).notNull(), // { lectures: number, labs: number, tutorials: number }
  status: text('status').notNull(), // pending, processed, paid
  generatedAt: text('generated_at').notNull(),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Work logs table for faculty time tracking
export const workLogs = sqliteTable('work_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  date: text('date').notNull(),
  timeIn: text('time_in').notNull(),
  timeOut: text('time_out').notNull(),
  department: text('department').notNull(),
  subject: text('subject').notNull(),
  activityType: text('activity_type').notNull(), // lecture, lab, tutorial, exam_duty, project_guidance, other
  description: text('description'),
  totalHours: real('total_hours').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Subjects table for managing subjects
export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  subjectCode: text('subject_code').notNull().unique(),
  department: text('department').notNull(),
  subjectType: text('subject_type').notNull(), // Theory, Lab, Practical
  credits: real('credits').notNull(),
  hoursPerWeek: real('hours_per_week').notNull(),
  semesterId: integer('semester_id').references(() => semesters.id),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add new semesters table
export const semesters = sqliteTable('semesters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: text('year').notNull(),
  semesterNumber: integer('semester_number').notNull(),
  semesterName: text('semester_name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add new faculty_subject_map table
export const facultySubjectMap = sqliteTable('faculty_subject_map', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  semesterId: integer('semester_id').references(() => semesters.id).notNull(),
  role: text('role').notNull().default('primary'),
  assignedAt: text('assigned_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add new timetable table
export const timetable = sqliteTable('timetable', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facultyId: integer('faculty_id').references(() => faculty.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  semesterId: integer('semester_id').references(() => semesters.id).notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  roomNumber: text('room_number'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});