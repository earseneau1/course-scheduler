import { useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ScheduleEvent, InsertEvent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ["/api/events"],
  });

  const createEvent = useMutation({
    mutationFn: async (event: InsertEvent) => {
      const res = await apiRequest("POST", "/api/events", event);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ScheduleEvent> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleEventCreate = useCallback((event: InsertEvent) => {
    createEvent.mutate(event);
  }, [createEvent]);

  const handleEventUpdate = useCallback((event: Partial<ScheduleEvent> & { id: number }) => {
    updateEvent.mutate(event);
  }, [updateEvent]);

  const handleEventDelete = useCallback((id: number) => {
    deleteEvent.mutate(id);
  }, [deleteEvent]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Faculty Schedule</h1>
      <CalendarGrid
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />
    </div>
  );
}
