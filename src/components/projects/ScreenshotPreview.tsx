"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartphoneIcon } from "lucide-react";
import { DeviceFrame, getContrastColor } from "./DeviceFrame";

interface ScreenshotPreviewProps {
  screenshots: any[];
  project: any;
  platforms: any[];
}

export function ScreenshotPreview({ screenshots, project, platforms }: ScreenshotPreviewProps) {
  if (screenshots.length === 0) return null;

  return (
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
              const platform = platforms.find(p => p.id === screenshot.platform);
              const titleSettings = project?.screenshotTitles?.[screenshot.order] || {};
              const colorSettings = project?.screenshotOverrides?.[screenshot.order] || {};
              
              const backgroundColor = colorSettings.backgroundColor || project.defaultScreenshotBackgroundColor || "#f3f4f6";
              const foregroundColor = colorSettings.foregroundColor || project.defaultScreenshotForegroundColor || (colorSettings.backgroundColor ? getContrastColor(colorSettings.backgroundColor) : project.defaultScreenshotBackgroundColor ? getContrastColor(project.defaultScreenshotBackgroundColor) : "#000000");

              return (
                <div key={screenshot._id} className="space-y-2">
                  <div 
                    className="relative rounded-xl overflow-hidden border shadow-sm flex flex-col items-center p-4"
                    style={{ 
                      width: platform?.aspect === "16/9" ? "240px" : platform?.aspect === "4/3" ? "200px" : "160px",
                      aspectRatio: platform?.aspect || "9/16",
                      backgroundColor: backgroundColor
                    }}
                  >
                    <div className="w-full text-center mb-4 z-10 min-h-[1.5rem] flex flex-col justify-center">
                      <p className="text-[12px] font-bold leading-tight" style={{ color: foregroundColor }}>
                        {titleSettings.title || " "}
                      </p>
                    </div>
                    
                    <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                      <div 
                        className="h-full mx-auto"
                        style={{ aspectRatio: platform?.aspect || "9/16" }}
                      >
                        <DeviceFrame 
                          platform={screenshot.platform} 
                          frameColor={project.defaultScreenshotFrame}
                        >
                          {screenshot.url && (
                            <img
                              src={screenshot.url}
                              alt="Screenshot"
                              className="w-full h-full object-cover"
                            />
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
      </CardContent>
    </Card>
  );
}
