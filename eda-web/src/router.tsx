import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AppShell } from "./components/AppShell";

const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const SchematicPage = lazy(() =>
  import("./pages/schematic/SchematicPage").then((m) => ({ default: m.SchematicPage }))
);
const Model3DPage = lazy(() =>
  import("./pages/model3d/Model3DPage").then((m) => ({ default: m.Model3DPage }))
);
const BomPage = lazy(() =>
  import("./pages/bom/BomPage").then((m) => ({ default: m.BomPage }))
);
const AiAssistant = lazy(() =>
  import("./pages/ai/AiAssistant").then((m) => ({ default: m.AiAssistant }))
);
const ProjectsPage = lazy(() =>
  import("./pages/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetail = lazy(() =>
  import("./pages/projects/ProjectDetail").then((m) => ({ default: m.ProjectDetail }))
);
const SettingsPage = lazy(() =>
  import("./pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);

const suspenseFallback = (
  <div className="flex h-full items-center justify-center">
    <p className="text-text-muted animate-pulse">Loading...</p>
  </div>
);

function PageLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={suspenseFallback}>{children}</Suspense>;
}

const rootRoute = createRootRoute({ component: AppShell });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageLayout>
      <DashboardPage />
    </PageLayout>
  ),
});

const schematicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schematic",
  component: () => (
    <PageLayout>
      <SchematicPage />
    </PageLayout>
  ),
});

const model3dRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/3d",
  component: () => (
    <PageLayout>
      <Model3DPage />
    </PageLayout>
  ),
});

const bomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bom",
  component: () => (
    <PageLayout>
      <BomPage />
    </PageLayout>
  ),
});

const aiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai",
  component: () => (
    <PageLayout>
      <AiAssistant />
    </PageLayout>
  ),
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: () => (
    <PageLayout>
      <ProjectsPage />
    </PageLayout>
  ),
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$name",
  component: () => (
    <PageLayout>
      <ProjectDetail />
    </PageLayout>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <PageLayout>
      <SettingsPage />
    </PageLayout>
  ),
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  schematicRoute,
  model3dRoute,
  bomRoute,
  aiRoute,
  projectsRoute,
  projectDetailRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
