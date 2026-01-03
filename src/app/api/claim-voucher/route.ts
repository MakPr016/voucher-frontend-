import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { voucherId } = await req.json();

    const wallet = (user.publicMetadata.wallets as any)?.solana;
    if (!wallet) {
      return new NextResponse("Wallet not linked", { status: 400 });
    }

    // Verify the voucher belongs to this user
    const githubAccount = user.externalAccounts.find(
      (acc) => acc.provider === "oauth_github"
    );

    if (!githubAccount) {
      return new NextResponse("GitHub not connected", { status: 400 });
    }

    return NextResponse.json({
      success: true,
      voucherId,
      claimerWallet: wallet,
      githubId: githubAccount.externalId,
    });
  } catch (error) {
    console.error("Claim voucher error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
