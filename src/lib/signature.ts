
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  timingSafeEqual,
} from "crypto";

import { readFileSync } from "fs";
import path from "path";

export interface TeamRegistrationData {
  teamRecordId: number;
  status: "REGISTERED_COMPLETE" | "REGISTERED_INCOMPLETE";
  mentorCode: string | null;
  members: {
    srn: string;
    studentName: string;
    email: string;
    departmentCode: string;
  }[];
}

export interface TeamSignatureResult {
  payloadHash: string;
  signatureValue: string;
}

// Read the private key. This function must only be used on the server.
function getPrivateKey() {
  const keyPath = path.resolve(
    process.cwd(),
    process.env.ED25519_PRIVATE_KEY_PATH || "./keys/private.pem"
  );

  const privateKey = readFileSync(keyPath, "utf8");

  return createPrivateKey(privateKey);
}

// Read the public key for signature verification.
function getPublicKey() {
  const keyPath = path.resolve(
    process.cwd(),
    process.env.ED25519_PUBLIC_KEY_PATH || "./keys/public.pem"
  );

  const publicKey = readFileSync(keyPath, "utf8");

  return createPublicKey(publicKey);
}

// Generate a consistent representation of team registration data.
export function createCanonicalPayload(
  team: TeamRegistrationData
): string {
  const canonicalData = {
    teamRecordId: team.teamRecordId,
    status: team.status,
    mentorCode: team.mentorCode,
    members: [...team.members]
      .map((member) => ({
        srn: member.srn,
        studentName: member.studentName,
        email: member.email,
        departmentCode: member.departmentCode,
      }))
      .sort((a, b) => a.srn.localeCompare(b.srn)),
  };

  return JSON.stringify(canonicalData);
}

// Generate a SHA-256 digest of the canonical registration data.
export function generatePayloadHash(payload: string): string {
  return createHash("sha256")
    .update(payload, "utf8")
    .digest("hex");
}

// Create a digital signature for a completed team registration.
export function createTeamRegistrationSignature(
  team: TeamRegistrationData
): TeamSignatureResult {
  if (team.status !== "REGISTERED_COMPLETE") {
    throw new Error(
      "A digital certificate can only be issued for a completed team."
    );
  }

  if (!team.mentorCode || team.members.length !== 4) {
    throw new Error(
      "A completed registration must have four members and an assigned mentor."
    );
  }

  const canonicalPayload = createCanonicalPayload(team);

  const payloadHash = generatePayloadHash(canonicalPayload);

  const privateKey = getPrivateKey();

  // Ed25519 signs the SHA-256 digest bytes.
  const signature = cryptoSign(
    null,
    Buffer.from(payloadHash, "hex"),
    privateKey
  );

  return {
    payloadHash,
    signatureValue: signature.toString("base64"),
  };
}

// Verify both the registration data and its digital signature.
export function verifyTeamRegistrationSignature(
  team: TeamRegistrationData,
  storedHash: string,
  storedSignature: string
): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(storedHash)) {
    return false;
  }

  const canonicalPayload = createCanonicalPayload(team);

  const currentHash = generatePayloadHash(canonicalPayload);

  const currentHashBuffer = Buffer.from(currentHash, "hex");
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  // First check whether the registration data has changed.
  if (!timingSafeEqual(currentHashBuffer, storedHashBuffer)) {
    return false;
  }

  const publicKey = getPublicKey();

  const signatureBuffer = Buffer.from(storedSignature, "base64");

  // Then verify the Ed25519 signature.
  return cryptoVerify(
    null,
    Buffer.from(storedHash, "hex"),
    publicKey,
    signatureBuffer
  );
}
