import { OAuth2Client } from "google-auth-library";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
  throw new Error(
    "Google OAuth env is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI"
  );
}

const oAuth2Client = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  googleRedirectUri
);

export async function exchangeCodeForTokens(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

export async function verifyGoogleIdToken(idToken) {
  const ticket = await oAuth2Client.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    const err = new Error("Invalid Google id_token payload");
    err.status = 401;
    throw err;
  }
  return payload;
}
