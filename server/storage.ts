import { 
  Professor, InsertProfessor,
  Class, InsertClass,
  ScheduleEvent, InsertEvent,
  User, InsertUser,
  Room, InsertRoom,
  Day,
  professors,
  classes,
  scheduleEvents,
  users,
  terms,
  rooms
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Professor operations
  getProfessors(): Promise<Professor[]>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;

  // Class operations
  getClasses(): Promise<Class[]>;
  createClass(class_: InsertClass): Promise<Class>;

  // Schedule operations
  getEvents(): Promise<ScheduleEvent[]>;
  createEvent(event: InsertEvent): Promise<ScheduleEvent>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<ScheduleEvent>;
  deleteEvent(id: number): Promise<void>;
  getEventsByDay(day: Day): Promise<ScheduleEvent[]>;

  // Room operations
  getRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;

  // User operations
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: Omit<InsertUser, "confirmPassword">): Promise<User>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getProfessors(): Promise<Professor[]> {
    return await db.select().from(professors);
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const [newProf] = await db.insert(professors).values(professor).returning();
    return newProf;
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(class_: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(class_).returning();
    return newClass;
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getEvents(): Promise<ScheduleEvent[]> {
    return await db.select().from(scheduleEvents);
  }

  async createEvent(event: InsertEvent): Promise<ScheduleEvent> {
    const [newEvent] = await db.insert(scheduleEvents).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<ScheduleEvent> {
    const [updatedEvent] = await db
      .update(scheduleEvents)
      .set(event)
      .where(eq(scheduleEvents.id, id))
      .returning();

    if (!updatedEvent) {
      throw new Error(`Event with id ${id} not found`);
    }

    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    const result = await db
      .delete(scheduleEvents)
      .where(eq(scheduleEvents.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Event with id ${id} not found`);
    }
  }

  async getEventsByDay(day: Day): Promise<ScheduleEvent[]> {
    return await db
      .select()
      .from(scheduleEvents)
      .where(eq(scheduleEvents.day, day));
  }

  async getUser(id: number): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return user || null;
  }

  async createUser(user: Omit<InsertUser, "confirmPassword">): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
}

export const storage = new DatabaseStorage();