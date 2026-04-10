import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || "https://auth.saillant.cc";
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || "electro_life";
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eda-web";
const REDIRECT_URI = `${window.location.origin}/`;
const AUTHORITY = `${KEYCLOAK_URL}/realms/${REALM}`;

export const userManager = new UserManager({
  authority: AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
});

export async function getAccessToken(): Promise<string | null> {
  try {
    const user = await userManager.getUser();
    if (!user || user.expired) return null;
    return user.access_token;
  } catch {
    return null;
  }
}

export async function login(): Promise<void> {
  await userManager.signinRedirect();
}

export async function logout(): Promise<void> {
  await userManager.signoutRedirect();
}

export async function handleCallback(): Promise<User> {
  return userManager.signinRedirectCallback();
}

export type { User };
