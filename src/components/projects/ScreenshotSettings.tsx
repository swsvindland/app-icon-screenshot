"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getContrastColor } from "./DeviceFrame";

interface ScreenshotSettingsProps {
  projectId: Id<"projects">;
  project: any;
}

export function ScreenshotSettings({ projectId, project }: ScreenshotSettingsProps) {
  const updateScreenshotSettings = useMutation(api.projects.updateScreenshotSettings);
  const updateProject = useMutation(api.projects.updateProject);

  const handleUpdateSettings = async (index: number, settings: { title?: string, backgroundColor?: string, foregroundColor?: string, frame?: string }) => {
    try {
      await updateScreenshotSettings({ projectId, index, settings });
    } catch (error) {
      toast.error("Failed to update screenshot settings");
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Global Styles
        </CardTitle>
        <CardDescription>Settings for each screenshot slot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
          <div className="space-y-3 pb-6 border-b">
            <Label className="text-sm font-bold">Global Defaults</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-1">
                  <Input 
                    type="color"
                    className="w-8 h-8 p-0 border-none overflow-hidden"
                    value={project.defaultScreenshotBackgroundColor || "#f3f4f6"}
                    onChange={(e) => updateProject({ projectId, defaultScreenshotBackgroundColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Foreground</Label>
                <div className="flex gap-1">
                  <Input 
                    type="color"
                    className="w-8 h-8 p-0 border-none overflow-hidden"
                    value={project.defaultScreenshotForegroundColor || (project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000")}
                    onChange={(e) => updateProject({ projectId, defaultScreenshotForegroundColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Frame</Label>
                <select 
                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  value={project.defaultScreenshotFrame || "none"}
                  onChange={(e) => updateProject({ projectId, defaultScreenshotFrame: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="black">Black</option>
                  <option value="silver">Silver</option>
                </select>
              </div>
            </div>
          </div>

          {[...Array(10)].map((_, i) => {
            const settings = project?.screenshotSettings?.[i] || {};

            return (
              <div key={i} className="space-y-3 pt-4 first:pt-0 border-t first:border-0">
                <Label className="text-sm font-bold">Screenshot {i + 1}</Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      placeholder="App Title..."
                      className="h-8 text-sm"
                      value={settings.title || ""}
                      onChange={(e) => handleUpdateSettings(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Background</Label>
                      <div className="flex gap-1">
                        <Input 
                          type="color"
                          className="w-8 h-8 p-0 border-none overflow-hidden"
                          value={settings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6"}
                          onChange={(e) => handleUpdateSettings(i, { backgroundColor: e.target.value })}
                        />
                        {settings.backgroundColor && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleUpdateSettings(i, { backgroundColor: undefined })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Foreground</Label>
                      <div className="flex gap-1">
                        <Input 
                          type="color"
                          className="w-8 h-8 p-0 border-none overflow-hidden"
                          value={settings.foregroundColor || project.defaultScreenshotForegroundColor || (settings.backgroundColor ? getContrastColor(settings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000")}
                          onChange={(e) => handleUpdateSettings(i, { foregroundColor: e.target.value })}
                        />
                        {settings.foregroundColor && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => handleUpdateSettings(i, { foregroundColor: undefined })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
    </Card>
  );
}
