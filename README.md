# Embedded Customer Portal demo

Stands in for a provider's own app: mints an embed token server-side, then loads the GUIDEcx Customer Portal 2.0 in an iframe.

The flow a provider implements is three steps:

1. Their backend calls `POST /api/v3/members/embed-token` with their API token and the customer's email, and gets back `{ data: { embedToken, projects[] } }`. The embed token is valid for **one minute**, so it is minted right before the iframe loads.
2. Their frontend points an iframe at the SSO exchange:

   ```
   {APP_URL}/embed/customer-login/sso?token=…&projectId=…&email=…&page=today
   ```

3. The app exchanges the token for a session and redirects into the portal at `/embed/portal/{projectId}/{page}`.

In this demo, step 1 is [src/app/api/embed-token/route.ts](src/app/api/embed-token/route.ts) and steps 2-3 are [src/app/demo.tsx](src/app/demo.tsx). Everything that differs between the 2.0 and legacy 1.0 portals is in [src/lib/versions.ts](src/lib/versions.ts).

## Getting started

```bash
cp .env.example .env   # then fill in the values
npm install
npm run dev
```

The dev server listens on port 8787, but do not open `http://localhost:8787` directly - see the next section.

## Serve the demo over HTTPS, same-site with the app

The portal session cookie is only kept by the browser when the page hosting the iframe is *schemefully same-site* with your GUIDEcx app URL:

- same registrable domain, so a subdomain of the app's domain
- same scheme, both `https`

Break either and the browser silently discards the session cookie, the portal request bounces to the login page, and because that page refuses to be framed the iframe shows "refused to connect". `http://localhost:8787` fails on the scheme alone, so point a local HTTPS host at port 8787 and open that instead.

Embedding from an unrelated domain is not supported yet.

## The legacy 1.0 portal

The demo can also embed the legacy Compass 1.0 portal, to compare the two side by side. Set the optional `GUIDECX_LEGACY_*` variables in `.env` and the page grows a 1.0 panel and a version toggle.

The two versions are not interchangeable:

|  | 2.0 | 1.0 |
| --- | --- | --- |
| endpoint | `POST /api/v3/members/embed-token` | `POST /api/v2/users/embed-token` |
| API token | workspace-member API token | legacy Open API token |
| response | `{ data: { embedToken, projects } }` | `{ embedToken, projects }` |
| SSO route | `/embed/customer-login/sso` | `/auth/customer-login/sso` |
| landing | `/embed/portal/{projectId}/{page}` | `/customer/{page}/{projectId}` |
| pages | `today`, `overview`, `messages`, `attachments` | `today`, `notes`, `attachments` |

A legacy token against the v3 API returns `401 Invalid Token`. Project ids are not shared either: the same customer comes back with a different project list per version, which is why each panel has its own picker. The page picker offers one provider-facing name per version and shows the translation, e.g. `messages → notes` on 1.0.

The two panels do not interfere with each other: the 2.0 embed session lives in its own cookie (`SameSite=None; Secure; Partitioned`), separate from the cookie a normal login or the 1.0 exchange writes.

## Troubleshooting

The demo prints the upstream error instead of hiding it.

| what you see | cause |
| --- | --- |
| `GUIDEcx 401: Invalid Token` | legacy token against the v3 API, or wrong environment |
| `No projects are shared with …` | the customer is not on any project in that API version |
| `customer user cannot belong to multiple accounts` | the email exists in more than one workspace |
| iframe shows "refused to connect" | not same-site/HTTPS (see above), or an expired token |
| blank iframe after a minute | the embed token expired, hit Reload to mint a new one |

## Documentation

- [GUIDEcx Embed](https://help.guidecx.com/en/articles/9006763-embedded-onboarding-portal#h_1cb69ecfbf)
- [GUIDEcx API v2](https://api.guidecx.com/api/v2/docs#post-/users/embed-token)
