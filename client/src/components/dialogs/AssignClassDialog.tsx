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
import type { Class } from "@shared/schema";

interface AssignClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (classId: number) => void;
}

export function AssignClassDialog({
  open,
  onOpenChange,
  onAssign,
}: AssignClassDialogProps) {
  const [search, setSearch] = useState("");

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const filteredClasses = classes.filter(
    (class_) =>
      class_.name.toLowerCase().includes(search.toLowerCase()) ||
      class_.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Class</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search classes by name or code..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[300px] mt-4 rounded-md border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Loading classes...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No classes found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClasses.map((class_) => (
                <Button
                  key={class_.id}
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {
                    onAssign(class_.id);
                    onOpenChange(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{class_.name}</div>
                    <div className="text-sm text-gray-500">{class_.code}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
