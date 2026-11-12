
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

const { loadEnvConfig } = nextEnv;
import bcrypt from "bcryptjs";
import readline from "node:readline";

loadEnvConfig(process.cwd());

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Run this script in the VS Code interactive terminal."));
      return;
    }

    process.stdout.write(question);

    let password = "";

    const onData = (key) => {
      const char = key.toString();

      if (char === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        reject(new Error("Cancelled."));
        return;
      }

      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
        return;
      }

      if (char >= " ") {
        password += char;
      }
    };

    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.on("data", onData);
  });
}

async function main() {
  let connection;

  try {
    console.log("\n=== Create Coordinator Account ===\n");

    const email = (await ask("Coordinator email: ")).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const password = await askHidden("Coordinator password: ");
    const confirmPassword = await askHidden("Confirm password: ");

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("Password must not exceed 72 UTF-8 bytes.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    if (
      !process.env.DB_HOST ||
      !process.env.DB_USER ||
      !process.env.DB_NAME
    ) {
      throw new Error("Database environment variables are missing.");
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Check whether this email is already registered.
    const [existing] = await connection.execute(
      `SELECT User_ID, Role
       FROM APP_USER
       WHERE LOWER(Email) = ?
       LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      throw new Error(
        `This email already belongs to an account with role ${existing[0].Role}. No changes were made.`
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO APP_USER
        (Email, Password_Hash, Role, SRN, Is_Active)
       VALUES (?, ?, 'COORDINATOR', NULL, TRUE)`,
      [email, passwordHash]
    );

    console.log("\nCoordinator account created successfully.");
    console.log(`Email: ${email}`);
    console.log("Role: COORDINATOR");
    console.log("Password: securely hashed and stored.");
  } catch (error) {
    console.error("\nCoordinator creation failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
