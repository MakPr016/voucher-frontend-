import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";

  let isAllowed = false;

  // Allow chrome extensions, GitHub, and frontend URL
  if (
    origin.startsWith("chrome-extension://") ||
    origin === "https://github.com" ||
    origin === FRONTEND_URL ||
    origin === "http://localhost:3000" ||
    origin === "http://localhost:5173"
  ) {
    isAllowed = true;
  }

  const headers = new Headers();
  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return headers;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = getCorsHeaders(req);
  const user = await currentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401, headers });
  }

  try {
    const { address, signature } = await req.json();

    const messageStr = `Link Solana Wallet ${address} to GitHub user ${user.username}`;
    const messageBytes = new TextEncoder().encode(messageStr);

    const signatureBytes = bs58.decode(signature);
    const pubKeyBytes = new PublicKey(address).toBytes();

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes);

    if (!isValid) {
      return new NextResponse("Invalid Signature", { status: 400, headers });
    }

    const client = await clerkClient();
    await client.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        wallets: {
          // @ts-ignore
          ...(user.publicMetadata.wallets || {}),
          solana: address
        }
      }
    });

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch (error) {
    console.error(error);
    return new NextResponse("Server Error", { status: 500, headers });
  }
}
