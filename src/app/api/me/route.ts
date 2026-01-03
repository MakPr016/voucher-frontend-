import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const origin = req.headers.get("origin") || "";

  const allowedOrigins = [
    "chrome-extension://ibknpnbljgkbhheledddjdmcjdeaamig", 
    "http://localhost:5173"
  ];

  const headers = new Headers();
  if (allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
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
