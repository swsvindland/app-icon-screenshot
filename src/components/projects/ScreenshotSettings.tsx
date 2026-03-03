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
  const updateScreenshotTitle = useMutation(api.projects.updateScreenshotTitle);
  const updateScreenshotOverride = useMutation(api.projects.updateScreenshotOverride);
  const updateProject = useMutation(api.projects.updateProject);

  const handleUpdateTitle = async (index: number, settings: { title?: string }) => {
    try {
      await updateScreenshotTitle({ projectId, index, settings });
    } catch (error) {
      toast.error("Failed to update screenshot title");
    }
  };

  const handleUpdateOverride = async (index: number, settings: { backgroundColor?: string, foregroundColor?: string }) => {
    try {
      await updateScreenshotOverride({ projectId, index, settings });
    } catch (error) {
      toast.error("Failed to update color override");
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

          <div className="space-y-4">
            <Label className="text-sm font-bold border-b pb-2 flex justify-between items-center">
              Screenshot Settings (1-10)
              <span className="text-[10px] text-muted-foreground font-normal uppercase">Title / Colors</span>
            </Label>
            {[...Array(10)].map((_, i) => {
              const titleSettings = project?.screenshotTitles?.[i] || {};
              const overrideSettings = project?.screenshotOverrides?.[i] || {};
              
              return (
                <div key={`screenshot-settings-${i}`} className="space-y-2 pt-2 border-t first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] w-4 text-muted-foreground">{i + 1}</Label>
                    <div className="flex-1 space-y-1">
                      <Input 
                        placeholder="Title..."
                        className="h-8 text-xs"
                        value={titleSettings.title || ""}
                        onChange={(e) => handleUpdateTitle(i, { title: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="relative group">
                        <Input 
                          type="color"
                          className="w-6 h-6 p-0 border-none overflow-hidden cursor-pointer"
                          value={overrideSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6"}
                          onChange={(e) => handleUpdateOverride(i, { backgroundColor: e.target.value })}
                        />
                        {overrideSettings.backgroundColor && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-2 -right-2 w-4 h-4 bg-background border rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={() => handleUpdateOverride(i, { backgroundColor: undefined })}
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        )}
                      </div>
                      <div className="relative group">
                        <Input 
                          type="color"
                          className="w-6 h-6 p-0 border-none overflow-hidden cursor-pointer"
                          value={overrideSettings.foregroundColor || project.defaultScreenshotForegroundColor || (overrideSettings.backgroundColor ? getContrastColor(overrideSettings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000")}
                          onChange={(e) => handleUpdateOverride(i, { foregroundColor: e.target.value })}
                        />
                        {overrideSettings.foregroundColor && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-2 -right-2 w-4 h-4 bg-background border rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={() => handleUpdateOverride(i, { foregroundColor: undefined })}
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
    </Card>
  );
}
