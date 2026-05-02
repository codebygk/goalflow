import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "completed", "archived", "on_hold"]).default("active"),
  targetDate: z.string().optional().nullable(),
});

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  goalId: z.string().uuid("Invalid goal"),
  status: z.enum(["active", "completed", "archived", "on_hold"]).default("active"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  projectId: z.string().uuid("Invalid project"),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  repeatInterval: z.enum(["none", "daily", "weekly", "biweekly", "monthly"]).default("none"),
  repeatDays: z.string().optional().nullable(),       // "1,3,5" for weekly/biweekly
  repeatMonthDay: z.number().int().min(1).max(31).optional().nullable(), // for monthly
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
