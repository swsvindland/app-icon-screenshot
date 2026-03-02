"use client";

import { useParams } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ScreenshotGenerator } from "@/components/projects/ScreenshotGenerator";

export default function ScreenshotsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  return <ScreenshotGenerator projectId={projectId} />;
}
