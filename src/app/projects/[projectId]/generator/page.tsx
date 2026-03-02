"use client";

import { useParams } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import { IconGenerator } from "@/components/projects/IconGenerator";

export default function GeneratorPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  return <IconGenerator projectId={projectId} />;
}
