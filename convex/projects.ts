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
    if (args.defaultScreenshotBackgroundColor !== undefined) patch.defaultScreenshotBackgroundColor = args.defaultScreenshotBackgroundColor;
    if (args.defaultScreenshotForegroundColor !== undefined) patch.defaultScreenshotForegroundColor = args.defaultScreenshotForegroundColor;
    if (args.defaultScreenshotFrame !== undefined) patch.defaultScreenshotFrame = args.defaultScreenshotFrame;
    if (args.screenshotTitles !== undefined) patch.screenshotTitles = args.screenshotTitles;
    if (args.screenshotOverrides !== undefined) patch.screenshotOverrides = args.screenshotOverrides;
    
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

export const getScreenshots = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_project_platform", (q) => q.eq("projectId", args.projectId))
      .collect();

    const results = await Promise.all(
      screenshots.map(async (s) => ({
        ...s,
        url: await ctx.storage.getUrl(s.storageId),
      }))
    );

    return results;
  },
});

export const addScreenshot = mutation({
  args: {
    projectId: v.id("projects"),
    platform: v.string(),
    storageId: v.id("_storage"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Check limit of 10
    const existing = await ctx.db
      .query("screenshots")
      .withIndex("by_project_platform", (q) =>
        q.eq("projectId", args.projectId).eq("platform", args.platform)
      )
      .collect();

    if (existing.length >= 10) {
      throw new Error("Maximum of 10 screenshots per platform reached");
    }

    return await ctx.db.insert("screenshots", {
      projectId: args.projectId,
      platform: args.platform,
      storageId: args.storageId,
      order: args.order,
      userId: identity.subject,
    });
  },
});

export const updateScreenshotTitle = mutation({
  args: {
    projectId: v.id("projects"),
    index: v.number(),
    settings: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    const screenshotTitles = [...(project.screenshotTitles || [])];
    
    // Ensure the array is long enough
    while (screenshotTitles.length <= args.index) {
      screenshotTitles.push({});
    }

    screenshotTitles[args.index] = {
      ...screenshotTitles[args.index],
      ...args.settings,
    };

    await ctx.db.patch(args.projectId, { screenshotTitles });
  },
});

export const updateScreenshotOverride = mutation({
  args: {
    projectId: v.id("projects"),
    index: v.number(),
    settings: v.object({
      backgroundColor: v.optional(v.string()),
      foregroundColor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    const screenshotOverrides = [...(project.screenshotOverrides || [])];
    
    // Ensure the array is long enough
    while (screenshotOverrides.length <= args.index) {
      screenshotOverrides.push({});
    }

    screenshotOverrides[args.index] = {
      ...screenshotOverrides[args.index],
      ...args.settings,
    };

    await ctx.db.patch(args.projectId, { screenshotOverrides });
  },
});

export const deleteScreenshot = mutation({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const screenshot = await ctx.db.get(args.screenshotId);
    if (!screenshot || screenshot.userId !== identity.subject) {
      throw new Error("Screenshot not found or unauthorized");
    }

    await ctx.storage.delete(screenshot.storageId);
    await ctx.db.delete(args.screenshotId);
  },
});
