/**
 * Pure builders and validation for robots.txt. Nothing here reads the DOM,
 * performs a network request, or writes to storage.
 */

export interface RobotsGroup {
  id: number;
  userAgent: string;
  allow: string;
  disallow: string;
}

export interface RobotsOptions {
  crawlDelay: string;
  sitemap: string;
}

export type RobotsIssueCode =
  | "EMPTY"
  | "AGENT"
  | "PATH"
  | "DELAY"
  | "SITEMAP";

export interface RobotsIssue {
  code: RobotsIssueCode;
  groupId?: number;
}

export const DEFAULT_ROBOTS_GROUPS: RobotsGroup[] = [
  { id: 1, userAgent: "*", allow: "/", disallow: "/private/" },
];

export const DEFAULT_ROBOTS_OPTIONS: RobotsOptions = {
  crawlDelay: "",
  sitemap: "",
};

export const SAMPLE_ROBOTS_GROUPS: RobotsGroup[] = [
  { id: 1, userAgent: "*", allow: "/", disallow: "/admin/\n/tmp/" },
  { id: 2, userAgent: "Googlebot", allow: "", disallow: "/search" },
];

export const SAMPLE_ROBOTS_OPTIONS: RobotsOptions = {
  crawlDelay: "10",
  sitemap: "https://example.com/sitemap.xml",
};

const AGENT_PATTERN = /^[A-Za-z0-9_*][A-Za-z0-9_.*-]*$/u;

/** Return the first actionable problem found in the current editor state. */
export function validateRobots(
  groups: RobotsGroup[],
  options: RobotsOptions,
): RobotsIssue | null {
  const usable = groups.filter((group) => group.userAgent.trim());
  if (usable.length === 0) return { code: "EMPTY" };

  for (const group of groups) {
    if (!AGENT_PATTERN.test(group.userAgent.trim())) {
      return { code: "AGENT", groupId: group.id };
    }
    for (const path of [group.allow, group.disallow]) {
      const lines = path.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.some((line) => !line.startsWith("/"))) {
        return { code: "PATH", groupId: group.id };
      }
    }
  }

  const delay = options.crawlDelay.trim();
  if (delay && !/^\d+$/u.test(delay)) return { code: "DELAY" };

  const sitemap = options.sitemap.trim();
  if (sitemap && !/^https?:\/\/\S+$/iu.test(sitemap)) return { code: "SITEMAP" };

  return null;
}

export function buildRobotsTxt(
  groups: RobotsGroup[],
  options: RobotsOptions,
): string {
  const lines: string[] = [];

  for (const group of groups) {
    const agent = group.userAgent.trim();
    if (!agent) continue;
    lines.push(`User-agent: ${agent}`);

    for (const path of group.allow.split("\n")) {
      const value = path.trim();
      if (value) lines.push(`Allow: ${value}`);
    }
    for (const path of group.disallow.split("\n")) {
      const value = path.trim();
      if (value) lines.push(`Disallow: ${value}`);
    }
    lines.push("");
  }

  const delay = options.crawlDelay.trim();
  if (delay) lines.push(`Crawl-delay: ${delay}`);
  const sitemap = options.sitemap.trim();
  if (sitemap) lines.push(`Sitemap: ${sitemap}`);

  return `${lines.join("\n").trim()}\n`;
}

export function nextGroupId(groups: RobotsGroup[]): number {
  return groups.reduce((largest, group) => Math.max(largest, group.id), 0) + 1;
}

export function makeGroup(id: number): RobotsGroup {
  return { id, userAgent: "*", allow: "", disallow: "" };
}
