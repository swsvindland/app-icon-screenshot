import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    userId: v.string(),
    iconStorageId: v.optional(v.id("_storage")),
    backgroundColor: v.optional(v.string()),
    foregroundColor: v.optional(v.string()),
    padding: v.optional(v.number()),
    defaultScreenshotBackgroundColor: v.optional(v.string()),
    defaultScreenshotForegroundColor: v.optional(v.string()),
    defaultScreenshotFrame: v.optional(v.string()),
    screenshotTitles: v.optional(v.array(v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.string()),
    }))),
    screenshotOverrides: v.optional(v.array(v.object({
      backgroundColor: v.optional(v.string()),
      foregroundColor: v.optional(v.string()),
    }))),
  }).index("by_userId", ["userId"]),
  screenshots: defineTable({
    projectId: v.id("projects"),
    platform: v.string(), // iphone, ipad, macos, tvos, visionos, android, android7, android10, androidtv, web
    storageId: v.id("_storage"),
    order: v.number(),
    userId: v.string(),
  })
    .index("by_project_platform", ["projectId", "platform"])
    .index("by_userId", ["userId"]),
});
