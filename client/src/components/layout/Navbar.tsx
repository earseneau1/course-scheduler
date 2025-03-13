import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Home, LogOut, User, Settings } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Navigation links */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="link" className="text-lg font-semibold">
              <Home className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="link">
              <Calendar className="w-5 h-5 mr-2" />
              Calendar
            </Button>
          </Link>
          {isSuperAdmin && (
            <Link href="/admin">
              <Button variant="link">
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>

        {/* Right side - User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative">
              <User className="w-5 h-5 mr-2" />
              {user?.username}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}