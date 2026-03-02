"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { IconResizer } from "@/components/projects/IconResizer";

export default function ResizerPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.getProject, { projectId });

  if (project === undefined) {
    return (
      <div className="animate-pulse text-muted-foreground">Loading project...</div>
    );
  }

  if (project === null) {
    return (
      <div className="text-xl font-semibold">Project not found</div>
    );
  }

  return <IconResizer projectId={projectId} currentIconUrl={project.iconUrl} />;
}
