import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and role management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "faculty", "staff"] }).notNull().default("faculty"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Academic terms (builds)
export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room management
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  building: text("building").notNull(),
});

// Existing tables
export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  termId: integer("term_id").references(() => terms.id),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(),
  startTime: integer("start_time").notNull(), // Minutes from start of day
  duration: integer("duration").notNull(), // Duration in minutes
  professorId: integer("professor_id").references(() => professors.id),
  classId: integer("class_id").references(() => classes.id),
  roomId: integer("room_id").references(() => rooms.id),
  termId: integer("term_id").references(() => terms.id),
  repeatPattern: text("repeat_pattern"), // e.g. "MWF", "TR"
  repeatGroupId: text("repeat_group_id"), // For linking repeated events
});

// Schemas for insertion
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertTermSchema = createInsertSchema(terms);
export const insertRoomSchema = createInsertSchema(rooms);
export const insertProfessorSchema = createInsertSchema(professors);
export const insertClassSchema = createInsertSchema(classes);
export const insertEventSchema = createInsertSchema(scheduleEvents).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Professor = typeof professors.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Constants
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type Day = typeof DAYS[number];

export const RESTRICTED_DAYS = ["Wednesday", "Thursday", "Friday"] as const;
export const REPETITION_DAYS = ["Monday", "Tuesday"] as const;