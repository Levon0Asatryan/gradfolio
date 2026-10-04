import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * The Auth0 client (SDK v4). Domain, client id and secret, the cookie secret
 * and APP_BASE_URL come from the environment (.env.example).
 *
 * - `audience` and `scope` are passed explicitly: v4 does not read
 *   AUTH0_AUDIENCE/AUTH0_SCOPE itself. The audience makes Auth0 issue access
 *   tokens for gradfolio-api.
 * - `enableAccessTokenEndpoint: false`: the SDK would otherwise serve the
 *   access token as JSON at /auth/access-token to any script in the page. The
 *   API is called from this app's server only (Q11), so the browser never needs
 *   it.
 * - `tokenRefreshBuffer`: refresh an access token a minute before it expires,
 *   so a token never expires on its way to the API.
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
  enableAccessTokenEndpoint: false,
  tokenRefreshBuffer: 60,
});
