import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Professor, Class, Room } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingProfessor, setIsCreatingProfessor] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Only super-admin can access this page
  if (user?.role !== "super-admin") {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-4">You do not have permission to access this page.</p>
      </div>
    );
  }

  const { data: professors } = useQuery<Professor[]>({
    queryKey: ["/api/professors"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Mutations for creating new items
  const createProfessorMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to create professor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      setIsCreatingProfessor(false);
      toast({ title: "Professor created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create professor", 
        variant: "destructive",
        description: error.message 
      });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      if (!response.ok) throw new Error("Failed to create class");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsCreatingClass(false);
      toast({ title: "Class created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create class", 
        variant: "destructive",
        description: error.message 
      });
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async ({ name, capacity, building }: { name: string; capacity: number; building: string }) => {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity, building }),
      });
      if (!response.ok) throw new Error("Failed to create room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setIsCreatingRoom(false);
      toast({ title: "Room created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create room", 
        variant: "destructive",
        description: error.message 
      });
    },
  });

  // Component for creating a new professor
  const CreateProfessorDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      if (name) createProfessorMutation.mutate(name);
    };

    return (
      <Dialog open={isCreatingProfessor} onOpenChange={setIsCreatingProfessor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Professor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Professor Name" required />
            <Button type="submit">Create Professor</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Component for creating a new class
  const CreateClassDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const code = formData.get("code") as string;
      if (name && code) createClassMutation.mutate({ name, code });
    };

    return (
      <Dialog open={isCreatingClass} onOpenChange={setIsCreatingClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Class Name" required />
            <Input name="code" placeholder="Class Code" required />
            <Button type="submit">Create Class</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Component for creating a new room
  const CreateRoomDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const capacity = parseInt(formData.get("capacity") as string);
      const building = formData.get("building") as string;
      if (name && capacity && building) {
        createRoomMutation.mutate({ name, capacity, building });
      }
    };

    return (
      <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Room Name" required />
            <Input name="capacity" type="number" placeholder="Capacity" required />
            <Input name="building" placeholder="Building" required />
            <Button type="submit">Create Room</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const renderTable = (title: string, data: any[] | undefined, columns: string[]) => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Manage {title.toLowerCase()}</CardDescription>
          </div>
          <Button onClick={() => {
            if (title === "Professors") setIsCreatingProfessor(true);
            if (title === "Classes") setIsCreatingClass(true);
            if (title === "Rooms") setIsCreatingRoom(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col}>{item[col.toLowerCase()]}</TableCell>
                ))}
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {renderTable("Professors", professors, ["Name"])}
      {renderTable("Classes", classes, ["Name", "Code"])}
      {renderTable("Rooms", rooms, ["Name", "Capacity", "Building"])}

      <CreateProfessorDialog />
      <CreateClassDialog />
      <CreateRoomDialog />
    </div>
  );
}