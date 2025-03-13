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
  updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor>;
  deleteProfessor(id: number): Promise<void>;

  // Class operations
  getClasses(): Promise<Class[]>;
  createClass(class_: InsertClass): Promise<Class>;
  updateClass(id: number, class_: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;

  // Room operations
  getRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;

  // Schedule operations
  getEvents(): Promise<ScheduleEvent[]>;
  createEvent(event: InsertEvent): Promise<ScheduleEvent>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<ScheduleEvent>;
  deleteEvent(id: number): Promise<void>;
  getEventsByDay(day: Day): Promise<ScheduleEvent[]>;

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

  async updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor> {
    const [updatedProf] = await db
      .update(professors)
      .set(professor)
      .where(eq(professors.id, id))
      .returning();

    if (!updatedProf) {
      throw new Error(`Professor with id ${id} not found`);
    }

    return updatedProf;
  }

  async deleteProfessor(id: number): Promise<void> {
    const result = await db
      .delete(professors)
      .where(eq(professors.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Professor with id ${id} not found`);
    }
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(class_: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(class_).returning();
    return newClass;
  }

  async updateClass(id: number, class_: Partial<InsertClass>): Promise<Class> {
    const [updatedClass] = await db
      .update(classes)
      .set(class_)
      .where(eq(classes.id, id))
      .returning();

    if (!updatedClass) {
      throw new Error(`Class with id ${id} not found`);
    }

    return updatedClass;
  }

  async deleteClass(id: number): Promise<void> {
    const result = await db
      .delete(classes)
      .where(eq(classes.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Class with id ${id} not found`);
    }
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();

    if (!updatedRoom) {
      throw new Error(`Room with id ${id} not found`);
    }

    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    const result = await db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Room with id ${id} not found`);
    }
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