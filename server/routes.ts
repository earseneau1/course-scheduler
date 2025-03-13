import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertProfessorSchema, insertClassSchema, insertRoomSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Professors routes
  app.get("/api/professors", async (_req, res) => {
    const professors = await storage.getProfessors();
    res.json(professors);
  });

  app.post("/api/professors", async (req, res) => {
    const result = insertProfessorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const professor = await storage.createProfessor(result.data);
    res.json(professor);
  });

  app.patch("/api/professors/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const result = insertProfessorSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const professor = await storage.updateProfessor(idParam.data, result.data);
      res.json(professor);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/professors/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await storage.deleteProfessor(idParam.data);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  // Classes routes
  app.get("/api/classes", async (_req, res) => {
    const classes = await storage.getClasses();
    res.json(classes);
  });

  app.post("/api/classes", async (req, res) => {
    const result = insertClassSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const class_ = await storage.createClass(result.data);
    res.json(class_);
  });

  app.patch("/api/classes/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const result = insertClassSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const class_ = await storage.updateClass(idParam.data, result.data);
      res.json(class_);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      console.error('Invalid class ID:', req.params.id);
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await storage.deleteClass(idParam.data);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(404).json({ error: (error as Error).message });
    }
  });

  // Rooms routes
  app.get("/api/rooms", async (_req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.post("/api/rooms", async (req, res) => {
    const result = insertRoomSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const room = await storage.createRoom(result.data);
    res.json(room);
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const result = insertRoomSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const room = await storage.updateRoom(idParam.data, result.data);
      res.json(room);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await storage.deleteRoom(idParam.data);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  // Schedule events routes
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    const result = insertEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const event = await storage.createEvent(result.data);
    res.json(event);
  });

  app.patch("/api/events/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const result = insertEventSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const event = await storage.updateEvent(idParam.data, result.data);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const idParam = z.coerce.number().safeParse(req.params.id);
    if (!idParam.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await storage.deleteEvent(idParam.data);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}