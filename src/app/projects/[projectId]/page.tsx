"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  useEffect(() => {
    router.replace(`/projects/${projectId}/resizer`);
  }, [projectId, router]);

  return null;
}
