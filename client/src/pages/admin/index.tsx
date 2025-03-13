import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
import { Professor, Class, Room, User } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  
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

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const renderTable = (title: string, data: any[] | undefined, columns: string[]) => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Manage {title.toLowerCase()}</CardDescription>
          </div>
          <Button>
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
      
      {renderTable("Users", users, ["Username", "Role", "Created At"])}
      {renderTable("Professors", professors, ["Name"])}
      {renderTable("Classes", classes, ["Name", "Code"])}
      {renderTable("Rooms", rooms, ["Name", "Capacity", "Building"])}
    </div>
  );
}
