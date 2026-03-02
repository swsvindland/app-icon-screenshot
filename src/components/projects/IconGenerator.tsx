"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Upload, Download, Loader2, FileArchive, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface IconGeneratorProps {
  projectId: Id<"projects">;
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
];

const RN_ICON_TYPES = [
  { name: "Standard", suffix: "" },
  { name: "Mono", suffix: "-mono", filter: "grayscale(100%) brightness(0) invert(1)" },
  { name: "Light", suffix: "-light", filter: "brightness(1.2)" },
  { name: "Dark", suffix: "-dark", filter: "brightness(0.5)" },
];

export function IconGenerator({ projectId }: IconGeneratorProps) {
  const project = useQuery(api.projects.getProject, { projectId });
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const updateProject = useMutation(api.projects.updateProject);

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bgColor, setBgColor] = useState("#6366f1");
  const [foregroundColor, setForegroundColor] = useState("#ffffff");
  const [padding, setPadding] = useState(20);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [resizedIcons, setResizedIcons] = useState<{ size: number; url: string; name: string; type?: string }[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rnIcons, setRnIcons] = useState<{ name: string; url: string; suffix: string }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      if (project.iconUrl && !svgContent) {
        fetch(project.iconUrl)
          .then(res => res.text())
          .then(text => setSvgContent(text))
          .catch(err => console.error("Failed to fetch existing SVG:", err));
      }
      if (project.backgroundColor) setBgColor(project.backgroundColor);
      if (project.foregroundColor) setForegroundColor(project.foregroundColor);
      if (project.padding !== undefined) setPadding(project.padding);
    }
  }, [project, svgContent]);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs on unmount
      resizedIcons.forEach(icon => URL.revokeObjectURL(icon.url));
      rnIcons.forEach(icon => URL.revokeObjectURL(icon.url));
    };
  }, []);

  useEffect(() => {
    if (svgContent) {
      generatePreview();
    }
  }, [svgContent, bgColor, foregroundColor, padding]);

  const updateColors = async (bg: string, fg: string) => {
    try {
      await updateProject({
        projectId,
        backgroundColor: bg,
        foregroundColor: fg,
      });
    } catch (error) {
      console.error("Failed to update colors:", error);
    }
  };

  const updatePadding = async (p: number) => {
    try {
      await updateProject({
        projectId,
        padding: p,
      });
    } catch (error) {
      console.error("Failed to update padding:", error);
    }
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBgColor(newColor);
    updateColors(newColor, foregroundColor);
  };

  const handleFgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setForegroundColor(newColor);
    updateColors(bgColor, newColor);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/svg+xml") {
      toast.error("Please upload an SVG file");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setSvgContent(content);

      try {
        // Upload to Convex
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        
        // Update project
        await updateProject({
          projectId,
          iconStorageId: storageId,
        });
        toast.success("SVG saved successfully");
      } catch (error) {
        console.error("Failed to save SVG:", error);
        toast.error("SVG uploaded but failed to save to project");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const generatePreview = async () => {
    if (!svgContent) return;

    try {
      const url = await renderToDataUrl(svgContent, 512, bgColor, foregroundColor, padding);
      setPreviewUrl(url);
      
      // Clear old icons
      setResizedIcons(prev => {
        prev.forEach(icon => URL.revokeObjectURL(icon.url));
        return [];
      });
      
      // Generate all sizes for the preview list (only standard ones for UI performance)
      const newIcons = await Promise.all(
        ICON_PLATFORMS[0].sizes.map(async ({ size, name }) => {
          const iconUrl = await renderToDataUrl(svgContent, size, bgColor, foregroundColor, padding);
          const response = await fetch(iconUrl);
          const blob = await response.blob();
          return {
            size,
            name,
            url: URL.createObjectURL(blob)
          };
        })
      );
      setResizedIcons(newIcons);

      // Generate RN icons
      const newRnIcons = await Promise.all(
        RN_ICON_TYPES.map(async (type) => {
          const iconUrl = await renderToDataUrl(svgContent, 1024, bgColor, foregroundColor, padding, type.filter);
          const response = await fetch(iconUrl);
          const blob = await response.blob();
          return {
            name: type.name,
            suffix: type.suffix,
            url: URL.createObjectURL(blob)
          };
        })
      );
      setRnIcons(newRnIcons);

    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    }
  };

  const renderToDataUrl = (svg: string, size: number, bg: string, fg: string, padPercent: number, filter?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not found");

      // Draw background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      const img = new Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const paddingAmount = (size * padPercent) / 100;
        const drawSize = size - paddingAmount * 2;
        
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return reject("Temp canvas context not found");

        if (filter) {
          tempCtx.filter = filter;
        }
        
        tempCtx.drawImage(img, paddingAmount, paddingAmount, drawSize, drawSize);
        
        // Apply foreground color
        tempCtx.globalCompositeOperation = "source-in";
        tempCtx.fillStyle = fg;
        tempCtx.fillRect(0, 0, size, size);
        
        ctx.drawImage(tempCanvas, 0, 0);
        
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Failed to load SVG");
      };
      img.src = url;
    });
  };

  const downloadAllAsZip = async () => {
    if (!svgContent) return;
    
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      
      toast.info("Generating icons...");

      for (const platform of ICON_PLATFORMS) {
        const platformFolder = zip.folder(platform.name);
        for (const { size, name } of platform.sizes) {
          // Standard icon
          const dataUrl = await renderToDataUrl(svgContent, size, bgColor, foregroundColor, padding);
          const base64Data = dataUrl.split(',')[1];
          platformFolder?.file(`${name}.png`, base64Data, { base64: true });
        }
      }

      // React Native specific icons
      const rnFolder = zip.folder("React Native");
      for (const type of RN_ICON_TYPES) {
        const dataUrl = await renderToDataUrl(svgContent, 1024, bgColor, foregroundColor, padding, type.filter);
        const base64Data = dataUrl.split(',')[1];
        rnFolder?.file(`icon${type.suffix}.png`, base64Data, { base64: true });
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.body.appendChild(document.createElement("a"));
      a.href = url;
      a.download = `app-icons-generated.zip`;
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Icons generated and downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate ZIP");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Icon Generator</CardTitle>
          <CardDescription>
            Upload an SVG and customize your app icon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Foreground SVG</Label>
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {isUploading ? "Uploading..." : (svgContent ? "Change SVG" : "Upload SVG")}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".svg" 
                className="hidden" 
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex gap-2">
                <Input 
                  id="bg-color" 
                  type="color" 
                  value={bgColor} 
                  onChange={handleBgColorChange}
                  className="w-12 p-1 h-9"
                />
                <Input 
                  type="text" 
                  value={bgColor} 
                  onChange={handleBgColorChange}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fg-color">Foreground Color</Label>
              <div className="flex gap-2">
                <Input 
                  id="fg-color" 
                  type="color" 
                  value={foregroundColor} 
                  onChange={handleFgColorChange}
                  className="w-12 p-1 h-9"
                />
                <Input 
                  type="text" 
                  value={foregroundColor} 
                  onChange={handleFgColorChange}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="padding">Padding ({padding}%)</Label>
              </div>
              <input 
                id="padding"
                type="range" 
                min="0" 
                max="45" 
                value={padding} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPadding(val);
                  updatePadding(val);
                }}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            disabled={!svgContent || isGeneratingZip}
            onClick={downloadAllAsZip}
          >
            {isGeneratingZip ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <FileArchive className="w-4 h-4 mr-2" />
            )}
            Generate & Download All
          </Button>
        </CardFooter>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg min-h-[400px]">
            {previewUrl ? (
              <div className="space-y-8 flex flex-col items-center">
                <div 
                  className="rounded-[22%] shadow-2xl overflow-hidden"
                  style={{ width: 200, height: 200 }}
                >
                  <img src={previewUrl} alt="Icon Preview" className="w-full h-full" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[48, 64, 96, 128].map(s => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <div 
                        className="rounded-[22%] shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
                        style={{ width: s, height: s }}
                      >
                        <img src={previewUrl} alt={`Preview ${s}`} className="w-full h-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s}x{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground">Upload an SVG to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>

        {svgContent && (
          <Card>
            <CardHeader>
              <CardTitle>React Native Variants</CardTitle>
              <CardDescription>Generated automatically for React Native apps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {rnIcons.map((type) => (
                  <div key={type.name} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                    <div 
                      className="rounded-[22%] shadow-md overflow-hidden bg-white"
                      style={{ width: 64, height: 64 }}
                    >
                      <img src={type.url} alt={type.name} className="w-full h-full" />
                    </div>
                    <span className="text-xs font-medium">{type.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
