"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface IconGeneratorProps {
  projectId: Id<"projects">;
}

export function IconGenerator({ projectId }: IconGeneratorProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>AI Icon Generator</CardTitle>
        <CardDescription>
          Generate professional app icons using AI. Coming soon!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
          <p className="text-sm text-muted-foreground italic">
            Icon generation interface will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
