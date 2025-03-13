import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(),
  startTime: integer("start_time").notNull(), // Minutes from start of day
  duration: integer("duration").notNull(), // Duration in minutes
  professorId: integer("professor_id").references(() => professors.id),
  classId: integer("class_id").references(() => classes.id),
  repeatPattern: text("repeat_pattern"), // e.g. "MWF", "TR"
  repeatGroupId: text("repeat_group_id"), // For linking repeated events
});

export const insertProfessorSchema = createInsertSchema(professors);
export const insertClassSchema = createInsertSchema(classes);
export const insertEventSchema = createInsertSchema(scheduleEvents).omit({ id: true });

export type Professor = typeof professors.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Constants
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type Day = typeof DAYS[number];

export const RESTRICTED_DAYS = ["Wednesday", "Thursday", "Friday"] as const;
export const REPETITION_DAYS = ["Monday", "Tuesday"] as const;
