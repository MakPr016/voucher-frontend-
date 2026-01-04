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

  const url = new URL(req.url);
  const authToken = url.searchParams.get('token');

  if (!authToken) {
    return new NextResponse("Token required", { status: 401, headers });
  }

  try {
    const decoded = JSON.parse(atob(authToken));
    const senderGithubId = decoded.githubId;

    const { recipientUsername, amount, reason } = await req.json();

    // Fetch recipient's GitHub ID
    const ghRes = await fetch(`https://api.github.com/users/${recipientUsername}`);
    if (!ghRes.ok) {
      throw new Error(`GitHub user ${recipientUsername} not found`);
    }
    const ghUser = await ghRes.json();
    const recipientGithubId = ghUser.id;

    const voucherId = `voucher-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return NextResponse.json({
      success: true,
      voucherId,
      recipientUsername,
      recipientGithubId: recipientGithubId,
      orgGithubId: senderGithubId,
      amount: parseFloat(amount),
      reason,
      maintainerWallet: decoded.wallet,
      claimUrl: `${FRONTEND_URL}/claim/${voucherId}`,
    }, { status: 200, headers });

  } catch (error) {
    console.error("Create voucher error:", error);
    return new NextResponse("Server Error: " + (error as Error).message, { status: 500, headers });
  }
}
