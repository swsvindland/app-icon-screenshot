"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartphoneIcon, Download, Loader2, Eye } from "lucide-react";
import { DeviceFrame, getContrastColor } from "./DeviceFrame";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { toPng, toCanvas } from "html-to-image";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScreenshotPreviewProps {
  screenshots: any[];
  project: any;
  platforms: any[];
}

const EXPORT_SIZES: Record<string, { width: number, height: number, store: "apple" | "google" }> = {
  iphone: { width: 1290, height: 2796, store: "apple" }, // iPhone 15 Pro Max
  ipad: { width: 2048, height: 2732, store: "apple" },   // 12.9" iPad Pro
  macos: { width: 2880, height: 1800, store: "apple" },
  tvos: { width: 3840, height: 2160, store: "apple" },
  visionos: { width: 3840, height: 2160, store: "apple" },
  android: { width: 1080, height: 1920, store: "google" },
  android7: { width: 1200, height: 1920, store: "google" },
  android10: { width: 1600, height: 2560, store: "google" },
  androidtv: { width: 3840, height: 2160, store: "google" },
  web: { width: 1920, height: 1080, store: "google" },
};

export function ScreenshotPreview({ screenshots, project, platforms }: ScreenshotPreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [debugExport, setDebugExport] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  if (screenshots.length === 0) return null;

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setDebugExport(true);
    const zip = new JSZip();

    try {
      const sortedScreenshots = [...screenshots].sort((a, b) => {
        if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
        return a.order - b.order;
      });

      toast.info("Generating screenshots...");

      for (const screenshot of sortedScreenshots) {
        const platform = platforms.find(p => p.id === screenshot.platform);
        if (!platform) continue;

        const size = EXPORT_SIZES[platform.id] || { width: 1080, height: 1920, store: "google" };
        
        // Get the background color for this screenshot to pass to toPng
        const colorSettings = project?.screenshotOverrides?.[screenshot.order] || {};
        const backgroundColor = colorSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";

        // Find the element for this screenshot
        const element = document.getElementById(`highres-export-${screenshot._id}`);
        if (!element) continue;

          // Add a small trick to "force" visibility if needed, though position: absolute off-screen should work
          element.style.visibility = 'visible';
          element.style.opacity = '1';

          // Ensure the element is visible and positioned
          if (debugExport) {
            element.scrollIntoView({ block: 'center' });
          }

          console.log(element)
          console.log("Exporting screenshot:", screenshot.url);
          
          const dataUrl = await toPng(element, {
            width: size.width,
            height: size.height,
            canvasWidth: size.width,
            canvasHeight: size.height,
            backgroundColor: backgroundColor,
            imagePlaceholder: screenshot.url,
            skipAutoScale: true,
            cacheBust: true,
            pixelRatio: 1,
            preferredFontFormat: 'woff2',
          });
        const base64Data = dataUrl.split(',')[1];
        const folderName = `${size.store}/${platform.id}`;
        zip.file(`${folderName}/screenshot-${screenshot.order + 1}.png`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name || "project"}-screenshots.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Screenshots exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export screenshots");
    } finally {
      setIsExporting(false);
      setDebugExport(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <SmartphoneIcon className="w-5 h-5" />
            Device Previews
          </CardTitle>
          <CardDescription>All screenshots across all platforms</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                Debug View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
              <DialogHeader className="p-6 pb-2 border-b">
                <DialogTitle>High-Resolution Export Targets (Debug View)</DialogTitle>
                <DialogDescription>
                  This is exactly what the browser will try to capture during export. Use this to verify rendering.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-6 bg-muted/30">
                <div className="flex flex-col items-center gap-12">
                  {screenshots.map((screenshot) => {
                    const platform = platforms.find(p => p.id === screenshot.platform);
                    const size = EXPORT_SIZES[screenshot.platform] || { width: 1080, height: 1920 };
                    const titleSettings = project?.screenshotTitles?.[screenshot.order] || {};
                    const colorSettings = project?.screenshotOverrides?.[screenshot.order] || {};
                    
                    const backgroundColor = colorSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";
                    const foregroundColor = colorSettings.foregroundColor || project.defaultScreenshotForegroundColor || (colorSettings.backgroundColor ? getContrastColor(colorSettings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000");

                    const isLandscape = platform?.aspect === "16/9";
                    const baseWidth = isLandscape ? 240 : (platform?.aspect === "4/3" ? 200 : 160);
                    const scale = size.width / baseWidth;
                    
                    const [aspectW, aspectH] = (platform?.aspect || "9/16").split('/').map(Number);
                    const aspectRatioValue = aspectW / aspectH;

                    const padding = 16 * scale;
                    const titleMargin = 16 * scale;
                    const titleFontSize = 12 * scale;
                    const minTitleHeight = 24 * scale;
                    
                    const screenContainerHeight = size.height - (padding * 2) - titleMargin - minTitleHeight;
                    const screenContainerWidth = screenContainerHeight * aspectRatioValue;

                    const finalWidth = Math.min(screenContainerWidth, size.width - (padding * 2));
                    const finalHeight = finalWidth / aspectRatioValue;

                    return (
                      <div key={`debug-${screenshot._id}`} className="space-y-4 flex flex-col items-center">
                        <div className="text-sm font-medium px-3 py-1 bg-white rounded-full border shadow-sm">
                          {platform?.name} - {size.width}x{size.height}
                        </div>
                        <div 
                          className="shadow-2xl origin-top"
                          style={{ 
                            width: `${size.width}px`, 
                            height: `${size.height}px`,
                            backgroundColor: backgroundColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: `${padding}px`,
                            overflow: 'hidden',
                            position: 'relative',
                            transform: 'scale(0.2)', // Scale down for viewing in dialog
                            marginBottom: `-${size.height * 0.8}px` // Adjust for scale
                          }}
                        >
                          <div style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            marginBottom: `${titleMargin}px`, 
                            zIndex: 10,
                            minHeight: `${minTitleHeight}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <p style={{ 
                              color: foregroundColor,
                              fontSize: `${titleFontSize}px`,
                              fontWeight: 'bold',
                              lineHeight: '1.2',
                              maxWidth: '100%',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {titleSettings.title || " "}
                            </p>
                          </div>
                          
                          <div style={{ 
                            position: 'relative',
                            flex: 1,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{ 
                              height: `${finalHeight}px`,
                              width: `${finalWidth}px`,
                              overflow: 'hidden'
                            }}>
                              <DeviceFrame 
                                platform={screenshot.platform} 
                                frameColor={project.defaultScreenshotFrame}
                              >
                                {screenshot.url && (
                                  <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: 'white' }}>
                                    <img
                                      src={screenshot.url}
                                      alt="Screenshot"
                                      crossOrigin="anonymous"
                                      style={{ 
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'top'
                                      }}
                                    />
                                  </div>
                                )}
                              </DeviceFrame>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting..." : "Export All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6 justify-center">
          {screenshots
            .sort((a, b) => {
              if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
              return a.order - b.order;
            })
            .map((screenshot) => {
              const platform = platforms.find(p => p.id === screenshot.platform);
              const titleSettings = project?.screenshotTitles?.[screenshot.order] || {};
              const colorSettings = project?.screenshotOverrides?.[screenshot.order] || {};
              
              const backgroundColor = colorSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";
              const foregroundColor = colorSettings.foregroundColor || project.defaultScreenshotForegroundColor || (colorSettings.backgroundColor ? getContrastColor(colorSettings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000");

              return (
                <div key={screenshot._id} className="space-y-2">
                  <div 
                    id={`export-${screenshot._id}`}
                    className="relative overflow-hidden border shadow-xl flex flex-col items-center p-4 transition-all hover:shadow-2xl hover:-translate-y-1"
                    style={{ 
                      width: platform?.aspect === "16/9" ? "240px" : platform?.aspect === "4/3" ? "200px" : "160px",
                      aspectRatio: platform?.aspect || "9/16",
                      backgroundColor: backgroundColor
                    }}
                  >
                    <div className="w-full text-center mb-4 z-10 min-h-6 flex flex-col justify-center">
                      <p className="text-[12px] font-bold leading-tight" style={{ color: foregroundColor }}>
                        {titleSettings.title || " "}
                      </p>
                    </div>
                    
                    <div className="relative flex-1 w-full flex items-center justify-center">
                      <div 
                        className="h-full mx-auto overflow-hidden"
                        style={{ aspectRatio: platform?.aspect || "9/16" }}
                      >
                        <DeviceFrame 
                          platform={screenshot.platform} 
                          frameColor={project.defaultScreenshotFrame}
                        >
                          {screenshot.url && (
                            <div className="relative w-full h-full">
                              <Image
                                src={screenshot.url}
                                alt="Screenshot"
                                fill
                                className="object-cover object-top"
                                unoptimized
                              />
                            </div>
                          )}
                        </DeviceFrame>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">{platform?.name} ({screenshot.order + 1})</p>
                </div>
              );
            })}
        </div>

        {/* Hidden high-res export targets - moved outside the direct path to ensure visibility/rendering */}
        <div 
          style={{ 
            position: 'fixed', 
            top: debugExport ? '50%' : '-20000px', 
            left: debugExport ? '50%' : '-20000px', 
            transform: debugExport ? 'translate(-50%, -50%) scale(0.1)' : 'none',
            width: 'auto', 
            height: 'auto', 
            overflow: 'visible', 
            opacity: 1, 
            pointerEvents: 'none',
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: debugExport ? '5px solid red' : 'none'
          }} 
          ref={exportRef}
        >
          {screenshots.map((screenshot) => {
            const platform = platforms.find(p => p.id === screenshot.platform);
            const size = EXPORT_SIZES[screenshot.platform] || { width: 1080, height: 1920 };
            const titleSettings = project?.screenshotTitles?.[screenshot.order] || {};
            const colorSettings = project?.screenshotOverrides?.[screenshot.order] || {};
            
            const backgroundColor = colorSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";
            const foregroundColor = colorSettings.foregroundColor || project.defaultScreenshotForegroundColor || (colorSettings.backgroundColor ? getContrastColor(colorSettings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000");

            // Scale factor for fonts and padding
            // We'll use a base width of 160px (default phone preview)
            const isLandscape = platform?.aspect === "16/9";
            const baseWidth = isLandscape ? 240 : (platform?.aspect === "4/3" ? 200 : 160);
            const scale = size.width / baseWidth;
            
        // Explicitly calculate layout for export target to avoid aspect-ratio issues in html-to-image
        const [aspectW, aspectH] = (platform?.aspect || "9/16").split('/').map(Number);
        const aspectRatioValue = aspectW / aspectH;

        // Padding factor: original p-4 is 16px.
        const padding = 16 * scale;
        const titleMargin = 16 * scale;
        const titleFontSize = 12 * scale;
        const minTitleHeight = 24 * scale;
        
        // Calculate screen container height: full height minus padding (top/bottom) and title space
        const screenContainerHeight = size.height - (padding * 2) - titleMargin - minTitleHeight;
        const screenContainerWidth = screenContainerHeight * aspectRatioValue;

        // Ensure the screen container is centered and doesn't overflow
        const finalWidth = Math.min(screenContainerWidth, size.width - (padding * 2));
        const finalHeight = finalWidth / aspectRatioValue;

        return (
          <div 
            key={`highres-${screenshot._id}`}
            id={`highres-export-${screenshot._id}`}
            style={{ 
              width: `${size.width}px`, 
              height: `${size.height}px`,
              backgroundColor: backgroundColor,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${padding}px`,
              overflow: 'hidden',
              position: 'relative',
              visibility: 'visible',
              opacity: 1,
              zIndex: 1 // Add a z-index to individual items to ensure they are on top of their container
            }}
          >
                 <div style={{ 
                    width: '100%', 
                    textAlign: 'center', 
                    marginBottom: `${titleMargin}px`, 
                    zIndex: 10,
                    minHeight: `${minTitleHeight}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                  <p style={{ 
                    color: foregroundColor,
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 'bold',
                    lineHeight: '1.2',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {titleSettings.title || " "}
                  </p>
                </div>
                
                <div style={{ 
                  position: 'relative',
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    height: `${finalHeight}px`,
                    width: `${finalWidth}px`,
                    overflow: 'hidden'
                  }}>
                    <DeviceFrame 
                      platform={screenshot.platform} 
                      frameColor={project.defaultScreenshotFrame}
                    >
                      {screenshot.url && (
                        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: 'white' }}>
                          <img
                            src={screenshot.url}
                            alt={`Screenshot ${screenshot._id}`}
                            key={screenshot._id}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'top'
                            }}
                          />
                        </div>
                      )}
                    </DeviceFrame>
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
