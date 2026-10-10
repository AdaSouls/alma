import cli from "../../packages/cli/package.json";
import core from "../../packages/alma-core/package.json";
import credentials from "../../packages/alma-credentials/package.json";
import manifest from "../../packages/alma-manifest/package.json";

/**
 * Facts the pages repeat. Versions are read from the packages in this
 * repository, so the site can't claim one that isn't the code next to it.
 */
export const SITE_URL = "https://alma.adasouls.io";
export const GITHUB_URL = "https://github.com/AdaSouls/alma";
export const SPEC = "alma/v1";

export const VERSIONS = {
  core: core.version,
  credentials: credentials.version,
  manifest: manifest.version,
  cli: cli.version,
};

/** When @adasouls/alma-core's current version was published to npm. Update with each release. */
export const CORE_RELEASED = "4 Oct 2026";

export const npmUrl = (name: string) => `https://www.npmjs.com/package/${name}`;
export const githubPath = (path: string) => `${GITHUB_URL}/tree/develop/${path}`;
export const editUrl = (path: string) => `${GITHUB_URL}/edit/develop/${path}`;

/** The one-line status under a page's introduction. */
export const STATUS_LINE = `Draft spec ${SPEC} · alma-core v${VERSIONS.core} · MIT`;

/** The pages that exist. Navigation, the footer and the sitemap list only these. */
export const PAGES = [
  { href: "/protocol", label: "Protocol" },
  { href: "/reputation", label: "Reputation" },
  { href: "/developers", label: "Developers" },
] as const;
