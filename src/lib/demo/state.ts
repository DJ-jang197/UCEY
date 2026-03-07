import { demoReports, demoSites } from "@/lib/demo/demo-data";
import type { SiteDetail, SiteReport, UserProject } from "@/lib/types/site";

type DemoStore = {
  sites: Map<string, SiteDetail>;
  reports: Map<string, SiteReport>;
  projectsByUser: Map<string, UserProject[]>;
  savedSitesByUser: Map<string, Set<string>>;
};

declare global {
  var __rezoneDemoStore: DemoStore | undefined;
}

function createInitialStore(): DemoStore {
  return {
    sites: new Map(demoSites.map((site) => [site.id, site])),
    reports: new Map(demoReports.map((report) => [report.siteId, report])),
    projectsByUser: new Map(),
    savedSitesByUser: new Map(),
  };
}

export function getDemoStore(): DemoStore {
  if (!globalThis.__rezoneDemoStore) {
    globalThis.__rezoneDemoStore = createInitialStore();
  }
  return globalThis.__rezoneDemoStore;
}
