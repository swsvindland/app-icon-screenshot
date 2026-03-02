"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Loader2, Download } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import Image from "next/image";

interface IconUploadProps {
  projectId: Id<"projects">;
  currentIconUrl?: string | null;
}

const ICON_SIZES = [1024, 512, 192, 64];

export function IconUpload({ projectId, currentIconUrl }: IconUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentIconUrl || null);
  const [resizedIcons, setResizedIcons] = useState<{ size: number; url: string }[]>([]);
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
      ICON_SIZES.map(async (size) => {
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

  const downloadIcon = (url: string, size: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `icon-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generated Sizes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {resizedIcons.map((icon) => (
              <div key={icon.size} className="bg-white dark:bg-zinc-900 border rounded-xl p-4 flex flex-col items-center gap-4">
                <div 
                  className="relative rounded-2xl overflow-hidden shadow-md border bg-zinc-50 flex items-center justify-center"
                  style={{ width: 128, height: 128 }}
                >
                  <img
                    src={icon.url}
                    alt={`${icon.size}x${icon.size}`}
                    style={{ 
                      width: icon.size > 128 ? '100%' : icon.size,
                      height: icon.size > 128 ? '100%' : icon.size,
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div className="text-center w-full">
                  <p className="text-sm font-medium">{icon.size}x{icon.size}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => downloadIcon(icon.url, icon.size)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
