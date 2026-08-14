import { NextResponse } from "next/server";
import type { EmbedTokenResponse, PortalVersion } from "@/lib/versions";

/**
 * Mints an embed token for the customer. This runs on the server because the
 * GUIDEcx API token must never reach the browser; the browser only ever sees
 * the short-lived embed token (valid for one minute).
 *
 * The two portal versions are not interchangeable - each has its own endpoint,
 * its own kind of API token, and its own project ids:
 *
 *   2.0  POST /api/v3/members/embed-token  -> { data: { embedToken, projects } }
 *        needs a workspace-member API token
 *   1.0  POST /api/v2/users/embed-token    -> { embedToken, projects }
 *        needs the legacy Open API token from GUIDEcx Admin Settings
 */

type UpstreamPayload = {
  embedToken?: string;
  projects?: { id: string; name: string }[];
};

const APIS: Record<
  PortalVersion,
  {
    url?: string;
    token?: string;
    env: string;
    unwrap: (body: unknown) => UpstreamPayload | undefined;
  }
> = {
  "2": {
    url: process.env.GUIDECX_API_URL,
    token: process.env.GUIDECX_API_TOKEN,
    env: "GUIDECX_API_URL / GUIDECX_API_TOKEN",
    // the v3 API wraps every response in a `data` envelope
    unwrap: (body) => (body as { data?: UpstreamPayload }).data,
  },
  "1": {
    url: process.env.GUIDECX_LEGACY_API_URL,
    token: process.env.GUIDECX_LEGACY_API_TOKEN,
    env: "GUIDECX_LEGACY_API_URL / GUIDECX_LEGACY_API_TOKEN",
    unwrap: (body) => body as UpstreamPayload,
  },
};

export async function POST(request: Request) {
  const { version = "2" } = (await request
    .json()
    .catch(() => ({}))) as { version?: string };

  const api = APIS[version as PortalVersion];
  const email = process.env.GUIDECX_CUSTOMER_EMAIL;

  if (!api) {
    return NextResponse.json(
      { error: `Unknown portal version "${version}". Use "2" or "1".` },
      { status: 400 },
    );
  }

  if (!api.url || !api.token || !email) {
    return NextResponse.json(
      { error: `Missing configuration. Set ${api.env} and GUIDECX_CUSTOMER_EMAIL in .env.` },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(api.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${api.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerUserEmail: email }),
    });

    const body = await response.text();

    // Surface upstream failures verbatim: GUIDEcx answers with messages a
    // provider can act on ("Invalid Token", "customer user cannot belong to
    // multiple accounts"), and a generic 500 would hide them.
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `GUIDEcx ${response.status}: ${body.slice(0, 500)}`,
          hint:
            response.status === 401 && version === "2"
              ? "2.0 needs a workspace-member API token. A legacy Open API token authenticates against the v2 API only."
              : undefined,
        },
        { status: response.status },
      );
    }

    const payload = api.unwrap(JSON.parse(body));

    if (!payload?.embedToken) {
      return NextResponse.json(
        { error: "No embedToken in the GUIDEcx response." },
        { status: 502 },
      );
    }

    // A customer with no projects is a valid response, not an upstream error.
    if (!payload.projects?.length) {
      return NextResponse.json(
        { error: `No projects are shared with ${email}. Invite the customer to a project first.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      embedToken: payload.embedToken,
      projectId: payload.projects[0].id,
      projects: payload.projects.map(({ id, name }) => ({ id, name })),
    } satisfies EmbedTokenResponse);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
