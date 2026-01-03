import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { address, signature } = await req.json();

    const messageStr = `Link Solana Wallet ${address} to GitHub user ${user.username}`;
    const messageBytes = new TextEncoder().encode(messageStr);
    
    const signatureBytes = bs58.decode(signature);
    const pubKeyBytes = new PublicKey(address).toBytes();

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes);

    if (!isValid) {
      return new NextResponse("Invalid Signature", { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
