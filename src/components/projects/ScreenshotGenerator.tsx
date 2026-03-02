"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Smartphone, Tablet, Monitor, Tv, Glasses, Globe, Layout, Palette, Type, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

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
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const addScreenshot = useMutation(api.projects.addScreenshot);
  const deleteScreenshot = useMutation(api.projects.deleteScreenshot);
  const updateScreenshotSettings = useMutation(api.projects.updateScreenshotSettings);
  const updateProject = useMutation(api.projects.updateProject);

  const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(PLATFORMS[0].id);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const platformScreenshots = screenshots?.filter(s => s.platform === selectedPlatform) || [];
    if (platformScreenshots.length + files.length > 10) {
      toast.error("Maximum 10 screenshots per platform");
      return;
    }

    setUploadingPlatform(selectedPlatform);
    try {
      for (const file of files) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error("Upload failed");

        const { storageId } = await result.json();
        await addScreenshot({
          projectId,
          platform: selectedPlatform,
          storageId,
          order: platformScreenshots.length,
        });
      }
      toast.success("Uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload screenshots");
    } finally {
      setUploadingPlatform(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (screenshotId: Id<"screenshots">) => {
    try {
      await deleteScreenshot({ screenshotId });
      toast.success("Deleted screenshot");
    } catch (error) {
      toast.error("Failed to delete screenshot");
    }
  };

  const handleUpdateSettings = async (index: number, settings: { title?: string, backgroundColor?: string, foregroundColor?: string, frame?: string }) => {
    try {
      await updateScreenshotSettings({ projectId, index, settings });
    } catch (error) {
      toast.error("Failed to update screenshot settings");
    }
  };

  if (screenshots === undefined || project === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                      variant={selectedPlatform === platform.id ? "secondary" : "ghost"}
                      className="justify-between"
                      onClick={() => setSelectedPlatform(platform.id)}
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

        <Card className="md:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{PLATFORMS.find(p => p.id === selectedPlatform)?.name} Screenshots</CardTitle>
              <CardDescription>Upload up to 10 screenshots</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleUpload}
              />
              <Button
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPlatform !== null || (screenshots.filter(s => s.platform === selectedPlatform).length >= 10)}
              >
                {uploadingPlatform === selectedPlatform ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${
              PLATFORMS.find(p => p.id === selectedPlatform)?.aspect === "16/9" ||
              PLATFORMS.find(p => p.id === selectedPlatform)?.aspect === "4/3"
                ? "grid-cols-1" 
                : "grid-cols-2"
            }`}>
              {screenshots
                .filter(s => s.platform === selectedPlatform)
                .sort((a, b) => a.order - b.order)
                .map((screenshot) => {
                  return (
                    <div key={screenshot._id} className="space-y-2 p-2 border rounded-lg bg-card">
                      <div 
                        className="relative group rounded-md overflow-hidden border bg-muted flex items-center justify-center mx-auto"
                        style={{ 
                          aspectRatio: PLATFORMS.find(p => p.id === selectedPlatform)?.aspect || "9/16",
                        }}
                      >
                        <div className="relative w-full h-full rounded-sm overflow-hidden">
                          {screenshot.url && (
                            <img
                              src={screenshot.url}
                              alt="Screenshot"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleDelete(screenshot._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-muted-foreground font-medium">
                        Slot {screenshot.order + 1}
                      </div>
                    </div>
                  );
                })}
              {screenshots.filter(s => s.platform === selectedPlatform).length === 0 && (
                <div className="col-span-full py-8 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                  <Layout className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm text-center">No screenshots uploaded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 h-fit">
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
      </div>

      {screenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SmartphoneIcon className="w-5 h-5" />
              Device Previews
            </CardTitle>
            <CardDescription>All screenshots across all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 justify-center">
              {screenshots
                .sort((a, b) => {
                  if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
                  return a.order - b.order;
                })
                .map((screenshot) => {
                  const platform = PLATFORMS.find(p => p.id === screenshot.platform);
                  const settings = project?.screenshotSettings?.[screenshot.order] || {};
                  const backgroundColor = settings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";
                  const foregroundColor = settings.foregroundColor || project.defaultScreenshotForegroundColor || getContrastColor(backgroundColor);

                  return (
                    <div key={screenshot._id} className="space-y-2">
                      <div 
                        className="relative rounded-xl overflow-hidden border shadow-sm flex items-center justify-center"
                        style={{ 
                          width: platform?.aspect === "16/9" ? "240px" : platform?.aspect === "4/3" ? "200px" : "140px",
                          aspectRatio: platform?.aspect || "9/16",
                          backgroundColor: backgroundColor
                        }}
                      >
                        {settings.title && (
                          <div className="absolute top-[8%] left-0 right-0 text-center px-2 z-10">
                            <p className="text-[10px] font-bold truncate" style={{ color: foregroundColor }}>
                              {settings.title}
                            </p>
                          </div>
                        )}
                        
                        <div className={`relative w-[85%] h-[85%] mt-auto mb-[10%] rounded-md overflow-hidden border-2 ${project.defaultScreenshotFrame === 'black' ? 'border-black' : project.defaultScreenshotFrame === 'silver' ? 'border-slate-300' : 'border-transparent'}`}>
                          {screenshot.url && (
                            <img
                              src={screenshot.url}
                              alt="Screenshot"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">{platform?.name} ({screenshot.order + 1})</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getContrastColor(hexcolor: string) {
  if (!hexcolor) return "black";
  // If a name like 'none' or 'transparent' is passed (shouldn't happen with current UI)
  if (hexcolor.startsWith('#')) {
    hexcolor = hexcolor.replace("#", "");
  } else {
    return "black";
  }
  
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}
