"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Loader2, Download, FileArchive } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import Image from "next/image";
import JSZip from "jszip";

interface IconUploadProps {
  projectId: Id<"projects">;
  currentIconUrl?: string | null;
}

const ICON_PLATFORMS = [
  {
    name: "Web & PWA",
    sizes: [
      { size: 16, name: "favicon-16x16" },
      { size: 32, name: "favicon-32x32" },
      { size: 192, name: "android-chrome-192x192" },
      { size: 512, name: "android-chrome-512x512" },
    ],
  },
  {
    name: "iOS",
    sizes: [
      { size: 120, name: "apple-touch-icon-120x120" },
      { size: 152, name: "apple-touch-icon-152x152" },
      { size: 167, name: "apple-touch-icon-167x167" },
      { size: 180, name: "apple-touch-icon-180x180" },
      { size: 1024, name: "ios-marketing-1024x1024" },
    ],
  },
  {
    name: "Android",
    sizes: [
      { size: 36, name: "android-ldpi" },
      { size: 48, name: "android-mdpi" },
      { size: 72, name: "android-hdpi" },
      { size: 96, name: "android-xhdpi" },
      { size: 144, name: "android-xxhdpi" },
      { size: 192, name: "android-xxxhdpi" },
      { size: 512, name: "playstore-512x512" },
    ],
  },
  {
    name: "MS Store",
    sizes: [
      { size: 44, name: "mstile-44x44" },
      { size: 71, name: "mstile-71x71" },
      { size: 150, name: "mstile-150x150" },
      { size: 310, name: "mstile-310x310" },
    ],
  },
];

const ALL_SIZES = Array.from(new Set(ICON_PLATFORMS.flatMap(p => p.sizes.map(s => s.size)))).sort((a, b) => b - a);

export function IconResizer({ projectId, currentIconUrl }: IconUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentIconUrl || null);
  const [resizedIcons, setResizedIcons] = useState<{ size: number; url: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const updateProject = useMutation(api.projects.updateProject);

  useEffect(() => {
    if (currentIconUrl) {
      setPreviewUrl(currentIconUrl);
      loadAndResizeFromUrl(currentIconUrl);
    }
    return () => {
      // Cleanup blob URLs
      setResizedIcons(prev => {
        prev.forEach(icon => {
          if (icon.url.startsWith('blob:')) {
            URL.revokeObjectURL(icon.url);
          }
        });
        return [];
      });
    };
  }, [currentIconUrl]);

  const loadAndResizeFromUrl = async (url: string) => {
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      // Ensure the image is fully loaded before processing
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image from URL"));
        img.src = url;
      });
      
      await processImage(img);
    } catch (error) {
      console.error("Error loading image from URL:", error);
    }
  };

  const processImage = async (img: HTMLImageElement) => {
    // Revoke old blob URLs before generating new ones
    setResizedIcons(prev => {
      prev.forEach(icon => {
        if (icon.url.startsWith('blob:')) {
          URL.revokeObjectURL(icon.url);
        }
      });
      return [];
    });

    const newResizedIcons = await Promise.all(
      ICON_PLATFORMS.flatMap(platform => platform.sizes).map(async ({ size, name }) => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        
        ctx.drawImage(img, 0, 0, size, size);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("Could not generate blob");
        
        return {
          size,
          name,
          url: URL.createObjectURL(blob)
        };
      })
    );

    setResizedIcons(newResizedIcons);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      // 3. Update project with storageId
      await updateProject({ projectId, iconStorageId: storageId });
      
      // 4. Create preview and resize
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load local image file"));
        img.src = objectUrl;
      });
      
      await processImage(img);
      
      toast.success("Icon uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload icon");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadIcon = (url: string, name: string) => {
    const a = document.body.appendChild(document.createElement("a"));
    a.href = url;
    a.download = `${name}.png`;
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (resizedIcons.length === 0) return;
    
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      
      for (const platform of ICON_PLATFORMS) {
        const platformFolder = zip.folder(platform.name);
        for (const { size, name } of platform.sizes) {
          const icon = resizedIcons.find(i => i.size === size && i.name === name);
          if (icon) {
            const response = await fetch(icon.url);
            const blob = await response.blob();
            platformFolder?.file(`${name}.png`, blob);
          }
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.body.appendChild(document.createElement("a"));
      a.href = url;
      a.download = `app-icons.zip`;
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("ZIP file generated and download started");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate ZIP file");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-colors hover:border-primary/50">
        {previewUrl ? (
          <div className="relative group">
            <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border bg-white">
              <Image
                src={previewUrl}
                alt="App Icon Preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl text-white font-medium"
            >
              Change Icon
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Upload App Icon</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Recommended size: 2048x2048px (PNG or JPG)
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </>
              )}
            </Button>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {resizedIcons.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Generated Icons</h3>
            <Button onClick={downloadAllAsZip} disabled={isGeneratingZip}>
              {isGeneratingZip ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating ZIP...
                </>
              ) : (
                <>
                  <FileArchive className="mr-2 h-4 w-4" />
                  Download All (ZIP)
                </>
              )}
            </Button>
          </div>

          <div className="space-y-12">
            {ICON_PLATFORMS.map((platform) => (
              <div key={platform.name} className="space-y-4">
                <h4 className="text-lg font-semibold border-b pb-2">{platform.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {platform.sizes.map(({ size, name }) => {
                    const icon = resizedIcons.find(i => i.size === size && i.name === name);
                    if (!icon) return null;
                    return (
                      <div key={name} className="bg-white dark:bg-zinc-900 border rounded-xl p-4 flex flex-col items-center gap-4">
                        <div 
                          className="relative rounded-2xl overflow-hidden shadow-md border bg-zinc-50 flex items-center justify-center"
                          style={{ width: 100, height: 100 }}
                        >
                          <img
                            src={icon.url}
                            alt={name}
                            style={{ 
                              width: icon.size > 100 ? '100%' : icon.size,
                              height: icon.size > 100 ? '100%' : icon.size,
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                        <div className="text-center w-full">
                          <p className="text-sm font-medium truncate" title={name}>{name}</p>
                          <p className="text-xs text-muted-foreground">{size}x{size}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={() => downloadIcon(icon.url, icon.name)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
