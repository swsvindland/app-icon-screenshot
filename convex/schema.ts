import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    userId: v.string(),
    iconStorageId: v.optional(v.id("_storage")),
  }).index("by_userId", ["userId"]),
});
