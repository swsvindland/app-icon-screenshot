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
  }).index("by_userId", ["userId"]),
});
