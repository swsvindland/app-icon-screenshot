"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Smartphone, Tablet, Monitor, Tv, Glasses, Globe, Layout } from "lucide-react";
import { toast } from "sonner";
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
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const addScreenshot = useMutation(api.projects.addScreenshot);
  const deleteScreenshot = useMutation(api.projects.deleteScreenshot);

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

  if (screenshots === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="md:col-span-1 h-fit">
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

      <Card className="md:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{PLATFORMS.find(p => p.id === selectedPlatform)?.name} Screenshots</CardTitle>
            <CardDescription>Upload up to 10 screenshots for this platform</CardDescription>
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPlatform !== null || (screenshots.filter(s => s.platform === selectedPlatform).length >= 10)}
            >
              {uploadingPlatform === selectedPlatform ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${
            PLATFORMS.find(p => p.id === selectedPlatform)?.aspect === "16/9" ||
            PLATFORMS.find(p => p.id === selectedPlatform)?.aspect === "4/3"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          }`}>
            {screenshots
              .filter(s => s.platform === selectedPlatform)
              .sort((a, b) => a.order - b.order)
              .map((screenshot) => (
                <div 
                  key={screenshot._id} 
                  className="relative group rounded-lg overflow-hidden border bg-muted flex items-center justify-center"
                  style={{ 
                    aspectRatio: PLATFORMS.find(p => p.id === selectedPlatform)?.aspect || "9/16",
                    minHeight: "100px"
                  }}
                >
                  {screenshot.url && (
                    <img
                      src={screenshot.url}
                      alt="Screenshot"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(screenshot._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            {screenshots.filter(s => s.platform === selectedPlatform).length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Layout className="w-12 h-12 mb-4 opacity-20" />
                <p>No screenshots uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
