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
import { Calendar, Users, BookOpen, Building2 } from "lucide-react";
import { Term } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: terms } = useQuery<Term[]>({
    queryKey: ["/api/terms"],
  });

  const isAdmin = user?.role === "admin";

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Quick Actions */}
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

      {/* Terms Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Academic Terms</h2>
          {isAdmin && (
            <Button>
              Create New Term
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terms?.map((term) => (
            <Card key={term.id}>
              <CardHeader>
                <CardTitle>{term.name}</CardTitle>
                <CardDescription>
                  {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/calendar?term=${term.id}`}>
                    View Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
