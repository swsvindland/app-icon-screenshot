"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Edit2, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hammer, Sparkles, Layout } from "lucide-react";

export default function ProjectDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.getProject, { projectId });
  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const currentTab = pathname.split("/").pop() || "resizer";

  if (project === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return;
    try {
      await updateProject({ projectId, name: editName });
      setIsEditing(false);
      toast.success("Project updated");
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject({ projectId });
      router.push("/");
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <header className="border-b bg-white dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setEditName(project.name);
                  setIsEditing(true);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Name
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={currentTab} onValueChange={(value) => router.push(`/projects/${projectId}/${value}`)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="resizer" className="gap-2">
              <Hammer className="w-4 h-4" />
              Icon Resizer
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Icon Generator
            </TabsTrigger>
            <TabsTrigger value="screenshots" className="gap-2">
              <Layout className="w-4 h-4" />
              Screenshot Generator
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {children}
          </div>
        </Tabs>
      </main>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project Name</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
