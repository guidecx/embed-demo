/**
 * Everything that differs between the two portal versions lives here.
 *
 * A provider picks the version by picking the SSO path; the query parameters
 * are identical:
 *
 *   2.0  /embed/customer-login/sso  -> lands on /embed/portal/{projectId}/{page}
 *   1.0  /auth/customer-login/sso   -> lands on /customer/{page}/{projectId}
 */

export type PortalVersion = "2" | "1";

/** Page names the provider can ask for, in the order shown in the picker. */
export const PAGES = [
  "today",
  "overview",
  "messages",
  "attachments",
] as const;

export type PageName = (typeof PAGES)[number];

export type VersionConfig = {
  id: PortalVersion;
  label: string;
  name: string;
  ssoPath: string;
  /** Provider-facing page name -> the page name this version understands. */
  pages: Record<PageName, string>;
};

export const VERSIONS: Record<PortalVersion, VersionConfig> = {
  "2": {
    id: "2",
    label: "2.0",
    name: "Customer Portal 2.0",
    ssoPath: "/embed/customer-login/sso",
    pages: {
      today: "today",
      overview: "overview",
      messages: "messages",
      attachments: "attachments",
    },
  },
  "1": {
    id: "1",
    label: "1.0",
    name: "Compass 1.0",
    ssoPath: "/auth/customer-login/sso",
    // 1.0 has no overview page, and calls messages "notes".
    pages: {
      today: "today",
      overview: "today",
      messages: "notes",
      attachments: "attachments",
    },
  },
};

/** What our /api/embed-token route returns to the browser. */
export type EmbedTokenResponse = {
  embedToken: string;
  projectId: string;
  projects: { id: string; name: string }[];
};

/** The iframe src: the SSO exchange logs the customer in and redirects into the portal. */
export function buildSsoUrl(
  config: VersionConfig,
  appUrl: string,
  params: { embedToken: string; projectId: string; email: string; page: PageName },
): string {
  const url = new URL(config.ssoPath, appUrl);

  url.searchParams.set("token", params.embedToken);
  url.searchParams.set("projectId", params.projectId);
  url.searchParams.set("email", params.email);
  url.searchParams.set("page", config.pages[params.page]);

  return url.toString();
}
