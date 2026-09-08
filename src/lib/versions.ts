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

/** Portal themes a provider can ask for. Only 2.0 understands the param. */
export const THEMES = ["default", "dark"] as const;

export type ThemeName = (typeof THEMES)[number];

export type VersionConfig = {
  id: PortalVersion;
  label: string;
  name: string;
  ssoPath: string;
  /** Provider-facing page name -> the page name this version understands. */
  pages: Record<PageName, string>;
  /** Whether the SSO route accepts `theme`. 1.0 ignores it, so we do not send it. */
  supportsTheme: boolean;
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
    supportsTheme: true,
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
    supportsTheme: false,
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
  params: {
    embedToken: string;
    projectId: string;
    email: string;
    page: PageName;
    theme?: ThemeName;
  },
): string {
  const url = new URL(config.ssoPath, appUrl);

  url.searchParams.set("token", params.embedToken);
  url.searchParams.set("projectId", params.projectId);
  url.searchParams.set("email", params.email);
  url.searchParams.set("page", config.pages[params.page]);

  // Optional. The portal stores the value in its theme cookie, so it sticks for
  // that browser until the next exchange says otherwise. That is why `default`
  // is sent explicitly too: without it, switching back to light would not
  // undo an earlier `dark`.
  if (config.supportsTheme && params.theme) {
    url.searchParams.set("theme", params.theme);
  }

  return url.toString();
}
