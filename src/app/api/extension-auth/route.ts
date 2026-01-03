import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const githubAccount = user.externalAccounts.find(acc => acc.provider === "oauth_github");

  const userData = {
    username: user.username,
    clerkId: user.id,
    githubId: githubAccount?.externalId,
    wallet: (user.publicMetadata.wallets as any)?.solana || null,
    timestamp: Date.now()
  };

  const token = btoa(JSON.stringify(userData));

  return NextResponse.json({ token }, { status: 200 });
}
