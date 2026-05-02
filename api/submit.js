const crypto = require("node:crypto");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(privateKey) {
  return privateKey.replace(/\\n/g, "\n");
}

function createJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(normalizePrivateKey(getEnv("GOOGLE_PRIVATE_KEY")));

  return `${unsignedToken}.${base64Url(signature)}`;
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: createJwt(),
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Google auth failed:", details);
    throw new Error("Could not authorize with Google");
  }

  const data = await response.json();
  return data.access_token;
}

function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getRequestPayload(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  return request.body || {};
}

async function appendToSheet(payload) {
  const sheetId = getEnv("GOOGLE_SHEET_ID");
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:H";
  const accessToken = await getAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      sheetRange,
    )}:append`,
  );

  url.searchParams.set("valueInputOption", "USER_ENTERED");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [
        [
          new Date().toISOString(),
          cleanValue(payload.email),
          cleanValue(payload.name),
          cleanValue(payload.currentThought),
          cleanValue(payload.favouriteColour),
          cleanValue(payload.anxious),
          cleanValue(payload.ghosts),
          cleanValue(payload.luckyNumber),
        ],
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Google Sheets append failed:", details);
    throw new Error("Could not append row to Google Sheet");
  }
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = getRequestPayload(request);
    const email = cleanValue(payload.email);

    if (!isValidEmail(email)) {
      response.status(400).json({ error: "Invalid email" });
      return;
    }

    await appendToSheet({
      ...payload,
      email,
    });

    response.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: error.message || "Could not save submission" });
  }
};
