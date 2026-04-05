import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import type { Props, ExtendedEnv } from "../types/index.js";
import { checkUserIsAllowed, getAuthDeniedResponse } from "../config/allowed-users.js";
import {
  clientIdAlreadyApproved,
  parseRedirectApproval,
  renderApprovalDialog,
  getUpstreamAuthorizeUrl,
} from "./oauth-utils.js";

const app = new Hono<{ Bindings: ExtendedEnv }>();

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const { clientId } = oauthReqInfo;
  if (!clientId) {
    return c.text("Invalid request", 400);
  }

  if (
    await clientIdAlreadyApproved(
      c.req.raw,
      oauthReqInfo.clientId,
      (c.env as any).COOKIE_ENCRYPTION_KEY
    )
  ) {
    return redirectToGoogle(c.req.raw, oauthReqInfo, c.env, {});
  }

  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    server: {
      description:
        "This is a Recipe Manager MCP Server using Google for authentication.",
      logo: "https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png",
      name: "Recipe Manager MCP Server",
    },
    state: { oauthReqInfo },
  });
});

app.post("/authorize", async (c) => {
  const { state, headers } = await parseRedirectApproval(
    c.req.raw,
    (c.env as any).COOKIE_ENCRYPTION_KEY
  );
  if (!state.oauthReqInfo) {
    return c.text("Invalid request", 400);
  }

  return redirectToGoogle(c.req.raw, state.oauthReqInfo, c.env, headers);
});

async function redirectToGoogle(
  request: Request,
  oauthReqInfo: AuthRequest,
  env: ExtendedEnv,
  headers: Record<string, string> = {}
) {
  return new Response(null, {
    headers: {
      ...headers,
      location: getUpstreamAuthorizeUrl({
        client_id: (env as any).GOOGLE_CLIENT_ID,
        redirect_uri: new URL("/callback", request.url).href,
        scope: "openid email profile",
        state: btoa(JSON.stringify(oauthReqInfo)),
        upstream_url: "https://accounts.google.com/o/oauth2/v2/auth",
      }),
    },
    status: 302,
  });
}

/**
 * OAuth Callback Endpoint
 *
 * Handles the callback from Google after user authentication.
 * Exchanges the temporary code for an access token, fetches user
 * information, and stores it as part of the 'props' on the token.
 */
app.get("/callback", async (c) => {
  const oauthReqInfo = JSON.parse(atob(c.req.query("state") as string)) as AuthRequest;
  if (!oauthReqInfo.clientId) {
    return c.text("Invalid state", 400);
  }

  const [accessToken, errResponse] = await fetchGoogleAccessToken({
    client_id: (c.env as any).GOOGLE_CLIENT_ID,
    client_secret: (c.env as any).GOOGLE_CLIENT_SECRET,
    code: c.req.query("code"),
    redirect_uri: new URL("/callback", c.req.url).href,
  });
  if (errResponse) return errResponse;

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    console.error("Failed to fetch user info from Google");
    return new Response("Failed to fetch user info", { status: 500 });
  }

  const userData = (await userResponse.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email?: boolean;
  };

  const login = userData.email.split("@")[0];

  if (!checkUserIsAllowed(login)) {
    return getAuthDeniedResponse(login);
  }

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    metadata: {
      label: userData.name || login,
    },
    props: {
      accessToken,
      email: userData.email,
      login,
      name: userData.name || login,
    } as Props,
    request: oauthReqInfo,
    scope: oauthReqInfo.scope,
    userId: userData.email,
  });

  return Response.redirect(redirectTo);
});

async function fetchGoogleAccessToken({
  client_id,
  client_secret,
  code,
  redirect_uri,
}: {
  client_id: string;
  client_secret: string;
  code: string | undefined;
  redirect_uri: string;
}): Promise<[string, null] | [null, Response]> {
  if (!code) {
    return [null, new Response("Missing authorization code", { status: 400 })];
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    console.error("Failed to exchange token with Google");
    return [null, new Response("Failed to exchange authorization code", { status: 500 })];
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  return [tokenData.access_token, null];
}

export const GoogleHandler = app;
