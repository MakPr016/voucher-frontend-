import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const { voucherId } = await req.json();

    const wallet = (user.publicMetadata.wallets as any)?.solana;
    if (!wallet) {
      return new NextResponse("Wallet not linked", { status: 400, headers });
    }

    // Verify the voucher belongs to this user
    const githubAccount = user.externalAccounts.find(
      (acc) => acc.provider === "oauth_github"
    );

    if (!githubAccount) {
      return new NextResponse("GitHub not connected", { status: 400, headers });
    }

    return NextResponse.json({
      success: true,
      voucherId,
      claimerWallet: wallet,
      githubId: githubAccount.externalId,
    }, { status: 200, headers });
  } catch (error) {
    console.error("Claim voucher error:", error);
    return new NextResponse("Server Error", { status: 500, headers });
  }
}
