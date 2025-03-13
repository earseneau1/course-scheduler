import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertProfessorSchema, insertClassSchema } from "@shared/schema";
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
