import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Professor } from "@shared/schema";

interface AssignProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (professorId: number) => void;
}

export function AssignProfessorDialog({
  open,
  onOpenChange,
  onAssign,
}: AssignProfessorDialogProps) {
  const [search, setSearch] = useState("");

  const { data: professors = [], isLoading } = useQuery<Professor[]>({
    queryKey: ["/api/professors"],
  });

  const filteredProfessors = professors.filter((professor) =>
    professor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Professor</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search professors..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[300px] mt-4 rounded-md border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Loading professors...
            </div>
          ) : filteredProfessors.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No professors found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProfessors.map((professor) => (
                <Button
                  key={professor.id}
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {
                    onAssign(professor.id);
                    onOpenChange(false);
                  }}
                >
                  {professor.name}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
