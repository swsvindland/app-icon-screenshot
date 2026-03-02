import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProjects = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      return null;
    }
    
    let iconUrl = null;
    if (project.iconStorageId) {
      iconUrl = await ctx.storage.getUrl(project.iconStorageId);
    }
    
    return { ...project, iconUrl };
  },
});

export const createProject = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      userId: identity.subject,
    });
    return projectId;
  },
});

export const updateProject = mutation({
  args: { 
    projectId: v.id("projects"), 
    name: v.optional(v.string()), 
    iconStorageId: v.optional(v.id("_storage")),
    backgroundColor: v.optional(v.string()),
    foregroundColor: v.optional(v.string()),
    padding: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }
    
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.iconStorageId !== undefined) patch.iconStorageId = args.iconStorageId;
    if (args.backgroundColor !== undefined) patch.backgroundColor = args.backgroundColor;
    if (args.foregroundColor !== undefined) patch.foregroundColor = args.foregroundColor;
    if (args.padding !== undefined) patch.padding = args.padding;
    
    await ctx.db.patch(args.projectId, patch);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }
    await ctx.db.delete(args.projectId);
  },
});
