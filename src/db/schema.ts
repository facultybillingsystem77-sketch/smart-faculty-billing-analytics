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
  department: text('department').notNull(), // Computer Science, Mathematics, Physics, Chemistry, Biology
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