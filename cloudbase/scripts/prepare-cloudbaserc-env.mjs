/**
 * Writes envVariables into cloudbaserc.deploy.json from keys + admin credentials.
 * Run: node scripts/prepare-cloudbaserc-env.mjs
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rcPath = path.join(root, "cloudbaserc.json");
const privatePem = fs.readFileSync(path.join(root, "keys/private.pem"), "utf8");
const secretsPath = path.join(root, "secrets.local.json");

let secrets = {};
if (fs.existsSync(secretsPath)) {
  secrets = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
}

if (!secrets.ADMIN_SECRET) {
  secrets.ADMIN_SECRET = crypto.randomBytes(24).toString("hex");
}
if (!secrets.ADMIN_USERNAME) {
  secrets.ADMIN_USERNAME = "admin";
}
if (!secrets.ADMIN_PASSWORD) {
  secrets.ADMIN_PASSWORD = crypto.randomBytes(12).toString("base64url");
  console.log(`Created admin credentials in secrets.local.json (username: ${secrets.ADMIN_USERNAME})`);
}

fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2) + "\n");

const jwtPrivateKey = privatePem.replace(/\r?\n/g, "\\n");
const rc = JSON.parse(fs.readFileSync(rcPath, "utf8"));
const deployPath = path.join(root, "cloudbaserc.deploy.json");

for (const fn of rc.functions) {
  if (fn.name === "auth-login") {
    fn.envVariables = {
      JWT_PRIVATE_KEY: jwtPrivateKey,
      ADMIN_SECRET: secrets.ADMIN_SECRET,
      LICENSE_EXPIRY_YEARS: "10",
    };
  }
  if (fn.name === "auth-admin") {
    fn.envVariables = {
      ADMIN_SECRET: secrets.ADMIN_SECRET,
      ADMIN_USERNAME: secrets.ADMIN_USERNAME,
      ADMIN_PASSWORD: secrets.ADMIN_PASSWORD,
    };
  }
}

fs.writeFileSync(deployPath, JSON.stringify(rc, null, 2) + "\n");
console.log("cloudbaserc.deploy.json envVariables updated (use for deploy only)");
