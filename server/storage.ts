import { 
  Professor, InsertProfessor,
  Class, InsertClass,
  ScheduleEvent, InsertEvent,
  Day
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private professors: Map<number, Professor>;
  private classes: Map<number, Class>;
  private events: Map<number, ScheduleEvent>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.professors = new Map();
    this.classes = new Map();
    this.events = new Map();
    this.currentIds = { professor: 1, class: 1, event: 1 };

    // Add some initial data
    const sampleProfessors = [
      { name: "Dr. Smith" },
      { name: "Prof. Johnson" },
      { name: "Dr. Williams" },
      { name: "Prof. Brown" }
    ];
    
    const sampleClasses = [
      { name: "Mathematics 101", code: "MATH101" },
      { name: "History 202", code: "HIST202" },
      { name: "Biology 303", code: "BIO303" },
      { name: "Chemistry 404", code: "CHEM404" }
    ];

    sampleProfessors.forEach(p => this.createProfessor(p));
    sampleClasses.forEach(c => this.createClass(c));
  }

  async getProfessors(): Promise<Professor[]> {
    return Array.from(this.professors.values());
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const id = this.currentIds.professor++;
    const newProf = { ...professor, id };
    this.professors.set(id, newProf);
    return newProf;
  }

  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(class_: InsertClass): Promise<Class> {
    const id = this.currentIds.class++;
    const newClass = { ...class_, id };
    this.classes.set(id, newClass);
    return newClass;
  }

  async getEvents(): Promise<ScheduleEvent[]> {
    return Array.from(this.events.values());
  }

  async createEvent(event: InsertEvent): Promise<ScheduleEvent> {
    const id = this.currentIds.event++;
    const newEvent = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<ScheduleEvent> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) throw new Error(`Event with id ${id} not found`);
    
    const updatedEvent = { ...existingEvent, ...event };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
  }

  async getEventsByDay(day: Day): Promise<ScheduleEvent[]> {
    return Array.from(this.events.values()).filter(event => event.day === day);
  }
}

export const storage = new MemStorage();
