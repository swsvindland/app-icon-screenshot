"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Layout, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ScreenshotUploadProps {
  projectId: Id<"projects">;
  selectedPlatform: { id: string; name: string; aspect: string };
  screenshots: any[];
  project: any;
}

export function ScreenshotUpload({ projectId, selectedPlatform, screenshots, project }: ScreenshotUploadProps) {
  function SortableItem({ id, children }: { id: Id<"screenshots">; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;
    return (
      <div ref={setNodeRef} style={style} className="space-y-2 p-2 border rounded-lg bg-card" {...attributes} {...listeners}>
        {children}
      </div>
    );
  }
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const addScreenshot = useMutation(api.projects.addScreenshot);
  const deleteScreenshot = useMutation(api.projects.deleteScreenshot);
    const reorderScreenshots = useMutation(api.projects.reorderScreenshots);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const platformItems = useMemo(
      () => screenshots.filter(s => s.platform === selectedPlatform.id).sort((a,b) => a.order - b.order),
      [screenshots, selectedPlatform.id]
    );
    const [orderedIds, setOrderedIds] = useState<Id<"screenshots">[]>(platformItems.map(s => s._id));
    useEffect(() => {
      const newIds = platformItems.map(s => s._id);
      // Only update if the order or set of IDs has actually changed
      // to avoid unnecessary re-renders when server data confirms our optimistic update
      setOrderedIds(prev => {
        if (prev.length !== newIds.length) return newIds;
        const hasChanged = newIds.some((id, i) => id !== prev[i]);
        return hasChanged ? newIds : prev;
      });
    }, [platformItems]);

    const idToScreenshot = useMemo(() => {
      const map = new Map<Id<"screenshots">, any>();
      for (const s of platformItems) map.set(s._id, s);
      return map;
    }, [platformItems]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const platformScreenshots = screenshots?.filter(s => s.platform === selectedPlatform.id) || [];
    if (platformScreenshots.length + files.length > 10) {
      toast.error("Maximum 10 screenshots per platform");
      return;
    }

    setIsUploading(true);
    try {
      let currentOrder = platformScreenshots.length;
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
          platform: selectedPlatform.id,
          storageId,
          order: currentOrder,
        });
        currentOrder++;
      }
      toast.success("Uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload screenshots");
    } finally {
      setIsUploading(false);
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

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrder);
    try {
      await reorderScreenshots({ projectId, platform: selectedPlatform.id, orderedIds: newOrder });
      toast.success("Order updated");
    } catch (e) {
      toast.error("Failed to update order");
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{selectedPlatform.name} Screenshots</CardTitle>
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
            disabled={isUploading || (screenshots.filter(s => s.platform === selectedPlatform.id).length >= 10)}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className={`grid gap-4 ${
          selectedPlatform.aspect === "16/9" ||
          selectedPlatform.aspect === "4/3"
            ? "grid-cols-1" 
            : "grid-cols-2"
        }`}>
          {orderedIds.map((id, index) => {
            const screenshot = idToScreenshot.get(id);
            if (!screenshot) return null;
              return (
                <SortableItem key={id} id={id}>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-muted-foreground font-medium">Slot {index + 1}</div>
                    <div className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  </div>
                  <div 
                    className="relative group rounded-md overflow-hidden border bg-muted flex items-center justify-center mx-auto"
                    style={{ 
                      aspectRatio: selectedPlatform.aspect || "9/16",
                    }}
                  >
                    <div className="relative w-full h-full rounded-sm overflow-hidden">
                      <div className="w-full h-full flex flex-col items-center p-2">
                        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full scale-[0.8] flex items-center justify-center pointer-events-none">
                              {screenshot.url && (
                                <img
                                  src={screenshot.url}
                                  alt="Screenshot"
                                  className="w-full h-full object-cover"
                                />
                              )}
                          </div>
                        </div>
                      </div>
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
                </SortableItem>
              );
            })}
          {platformItems.length === 0 && (
            <div className="col-span-full py-8 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Layout className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm text-center">No screenshots uploaded</p>
            </div>
          )}
        </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
