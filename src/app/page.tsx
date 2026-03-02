"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  const projects = useQuery(api.projects.getProjects);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <header className="border-b bg-white dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">IconShot</h1>
          <UserButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Your Projects</h2>
            <p className="text-muted-foreground">Manage and view your app screenshot projects.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects?.map((project) => (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <Card className="cursor-pointer hover:border-primary transition-colors h-full flex flex-col min-h-[150px]">
                  <CardHeader className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            <CreateProjectModal />
            {projects === undefined && (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse min-h-[150px] bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
