"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, Tablet, Monitor, Tv, Glasses, Globe } from "lucide-react";
import { ScreenshotUpload } from "./ScreenshotUpload";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { ScreenshotSettings } from "./ScreenshotSettings";

interface ScreenshotGeneratorProps {
  projectId: Id<"projects">;
}

const PLATFORMS = [
  { id: "iphone", name: "iPhone", icon: Smartphone, aspect: "9/19.5" }, // Modern iPhones are taller
  { id: "ipad", name: "iPad", icon: Tablet, aspect: "3/4" },
  { id: "macos", name: "macOS", icon: Monitor, aspect: "16/9" },
  { id: "tvos", name: "tvOS", icon: Tv, aspect: "16/9" },
  { id: "visionos", name: "visionOS", icon: Glasses, aspect: "4/3" },
  { id: "android", name: "Android", icon: Smartphone, aspect: "9/16" },
  { id: "android7", name: "Android 7\"", icon: Tablet, aspect: "3/4" },
  { id: "android10", name: "Android 10\"", icon: Tablet, aspect: "3/4" },
  { id: "androidtv", name: "Android TV", icon: Tv, aspect: "16/9" },
  { id: "web", name: "Web", icon: Globe, aspect: "16/9" },
];

export function ScreenshotGenerator({ projectId }: ScreenshotGeneratorProps) {
  const screenshots = useQuery(api.projects.getScreenshots, { projectId });
  const project = useQuery(api.projects.getProject, { projectId });

  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(PLATFORMS[0].id);

  if (screenshots === undefined || project === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedPlatform = PLATFORMS.find(p => p.id === selectedPlatformId)!;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Platforms</CardTitle>
              <CardDescription>Select a platform to manage screenshots</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const count = screenshots.filter(s => s.platform === platform.id).length;
                  return (
                    <Button
                      key={platform.id}
                      variant={selectedPlatformId === platform.id ? "secondary" : "ghost"}
                      className="justify-between"
                      onClick={() => setSelectedPlatformId(platform.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {platform.name}
                      </div>
                      <span className="text-xs text-muted-foreground">{count}/10</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <ScreenshotUpload 
            projectId={projectId} 
            selectedPlatform={selectedPlatform}
            screenshots={screenshots}
            project={project}
          />
        </div>

        <div className="md:col-span-1">
          <ScreenshotSettings 
            projectId={projectId}
            project={project}
          />
        </div>
      </div>

      <ScreenshotPreview 
        screenshots={screenshots}
        project={project}
        platforms={PLATFORMS}
      />
    </div>
  );
}
