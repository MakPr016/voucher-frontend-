import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";

  let isAllowed = false;

  if (
    origin.startsWith("chrome-extension://") ||
    origin === "http://localhost:5173" ||
    origin === "https://github.com"
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

export async function GET(req: Request) {
  const headers = getCorsHeaders(req);
  const url = new URL(req.url);
  const authToken = url.searchParams.get('token');

  if (authToken) {
    try {
      const decoded = JSON.parse(atob(authToken));
      return NextResponse.json({
        authenticated: true,
        username: decoded.username,
        clerkId: decoded.clerkId,
        githubId: decoded.githubId,
        wallet: decoded.wallet
      }, { status: 200, headers });
    } catch (error) {
      return NextResponse.json({ authenticated: false }, { status: 401, headers });
    }
  }

  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers });
  }

  const githubAccount = user.externalAccounts.find(acc => acc.provider === "oauth_github");

  return NextResponse.json({
    authenticated: true,
    username: user.username,
    clerkId: user.id,
    githubId: githubAccount?.externalId,
    wallet: (user.publicMetadata.wallets as any)?.solana || null
  }, { status: 200, headers });
}
