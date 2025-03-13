import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Calendar, Users, BookOpen, Building2, Download } from "lucide-react";
import { Term } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: terms } = useQuery<Term[]>({
    queryKey: ["/api/terms"],
  });

  const isAdmin = user?.role === "admin";

  const handleExport = async (termId: number) => {
    try {
      const response = await fetch(`/api/terms/${termId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-build-${termId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Quick Actions - Only visible to admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/calendar">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2" />
                <CardTitle>Schedule</CardTitle>
                <CardDescription>View and manage class schedules</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/professors">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 mb-2" />
                <CardTitle>Professors</CardTitle>
                <CardDescription>Manage faculty members</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/courses">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2" />
                <CardTitle>Courses</CardTitle>
                <CardDescription>View and edit course offerings</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/rooms">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader>
                <Building2 className="h-8 w-8 mb-2" />
                <CardTitle>Rooms</CardTitle>
                <CardDescription>Manage classroom assignments</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      )}

      {/* Terms/Builds Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Schedule Builds</h2>
          {isAdmin && (
            <Button>
              Create New Build
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms?.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>{term.name}</TableCell>
                    <TableCell>
                      {new Date(term.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(term.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="capitalize">{term.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/calendar?term=${term.id}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          View Schedule
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(term.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}