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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: number } | null>(null);

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

  // CRUD Mutations
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
    onError: (error: Error) => {
      toast({
        title: "Failed to create professor",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const updateProfessorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Professor> }) => {
      const response = await fetch(`/api/professors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update professor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      setEditingProfessor(null);
      toast({ title: "Professor updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update professor",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/professors/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete professor");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      setDeletingItem(null);
      toast({ title: "Professor deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete professor",
        variant: "destructive",
        description: error.message,
      });
      setDeletingItem(null);
    },
  });

  // Class mutations
  const createClassMutation = useMutation({
    mutationFn: async ({ name, code, prefix }: { name: string; code: string; prefix: string }) => {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, prefix }),
      });
      if (!response.ok) throw new Error("Failed to create class");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsCreatingClass(false);
      toast({ title: "Class created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create class",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Class> }) => {
      const response = await fetch(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update class");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setEditingClass(null);
      toast({ title: "Class updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update class",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/classes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete class");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setDeletingItem(null);
      toast({ title: "Class deleted successfully" });
    },
    onError: (error: Error) => {
      console.error('Delete class mutation error:', error);
      toast({
        title: "Failed to delete class",
        variant: "destructive",
        description: error.message,
      });
      setDeletingItem(null);
    },
  });

  // Room mutations
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
    onError: (error: Error) => {
      toast({
        title: "Failed to create room",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Room> }) => {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setEditingRoom(null);
      toast({ title: "Room updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update room",
        variant: "destructive",
        description: error.message,
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete room");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setDeletingItem(null);
      toast({ title: "Room deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete room",
        variant: "destructive",
        description: error.message,
      });
      setDeletingItem(null);
    },
  });

  // Delete confirmation dialog
  const DeleteConfirmationDialog = () => {
    if (!deletingItem) return null;

    const handleDelete = () => {
      switch (deletingItem.type) {
        case "professor":
          deleteProfessorMutation.mutate(deletingItem.id);
          break;
        case "class":
          deleteClassMutation.mutate(deletingItem.id);
          break;
        case "room":
          deleteRoomMutation.mutate(deletingItem.id);
          break;
      }
    };

    return (
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deletingItem.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (title === "Professors") setEditingProfessor(item);
                      if (title === "Classes") setEditingClass(item);
                      if (title === "Rooms") setEditingRoom(item);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeletingItem({ type: title.toLowerCase().slice(0, -1), id: item.id })}
                  >
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

  const EditProfessorDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingProfessor) return;

      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;

      updateProfessorMutation.mutate({
        id: editingProfessor.id,
        data: { name },
      });
    };

    return (
      <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Professor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Professor Name"
              defaultValue={editingProfessor?.name}
              required
            />
            <Button type="submit">Update Professor</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const CreateClassDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const code = formData.get("code") as string;
      const prefix = formData.get("prefix") as string;
      if (name && code && prefix) createClassMutation.mutate({ name, code, prefix });
    };

    return (
      <Dialog open={isCreatingClass} onOpenChange={setIsCreatingClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Class Name" required />
            <Input name="prefix" placeholder="Class Prefix" required />
            <Input name="code" placeholder="Class Code" required />
            <Button type="submit">Create Class</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const EditClassDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingClass) return;

      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const code = formData.get("code") as string;
      const prefix = formData.get("prefix") as string;
      const termId = parseInt(formData.get("termId") as string) || null;

      updateClassMutation.mutate({
        id: editingClass.id,
        data: { name, code, prefix, termId },
      });
    };

    return (
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Class Name"
              defaultValue={editingClass?.name}
              required
            />
            <Input
              name="prefix"
              placeholder="Class Prefix"
              defaultValue={editingClass?.prefix}
              required
            />
            <Input
              name="code"
              placeholder="Class Code"
              defaultValue={editingClass?.code}
              required
            />
            <Input
              name="termId"
              type="number"
              placeholder="Term ID (optional)"
              defaultValue={editingClass?.termId || ""}
            />
            <Button type="submit">Update Class</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

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

  const EditRoomDialog = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRoom) return;

      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const capacity = parseInt(formData.get("capacity") as string);
      const building = formData.get("building") as string;

      updateRoomMutation.mutate({
        id: editingRoom.id,
        data: { name, capacity, building },
      });
    };

    return (
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Room Name"
              defaultValue={editingRoom?.name}
              required
            />
            <Input
              name="capacity"
              type="number"
              placeholder="Capacity"
              defaultValue={editingRoom?.capacity}
              required
            />
            <Input
              name="building"
              placeholder="Building"
              defaultValue={editingRoom?.building}
              required
            />
            <Button type="submit">Update Room</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {renderTable("Professors", professors, ["Name"])}
      {renderTable("Classes", classes, ["Name", "Prefix", "Code"])}
      {renderTable("Rooms", rooms, ["Name", "Capacity", "Building"])}

      <CreateProfessorDialog />
      <CreateClassDialog />
      <CreateRoomDialog />

      <EditProfessorDialog />
      <EditClassDialog />
      <EditRoomDialog />

      <DeleteConfirmationDialog />
    </div>
  );
}