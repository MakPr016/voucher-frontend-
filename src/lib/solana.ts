import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import idl from "./idl.json";

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet" 
  ? "https://api.mainnet-beta.solana.com"
  : "https://api.devnet.solana.com";

export function getConnection() {
  return new Connection(NETWORK, "confirmed");
}

export function getProgram(wallet: any) {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(PROGRAM_ID, provider, idl as any);
}

export function getOrgPDA(orgGithubId: bigint) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(orgGithubId, 0);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), buffer],
    PROGRAM_ID
  );
  return pda;
}

export function getVoucherPDA(voucherId: string) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("voucher"), Buffer.from(voucherId)],
    PROGRAM_ID
  );
  return pda;
}

export async function createVoucher(
  wallet: any,
  orgGithubId: bigint,
  recipientGithubId: bigint,
  amount: number,
  voucherId: string,
  metadata: string
) {
  const program = getProgram(wallet);
  const orgPDA = getOrgPDA(orgGithubId);
  const voucherPDA = getVoucherPDA(voucherId);

  const amountBN = new anchor.BN(amount * 1_000_000_000); // Convert SOL to lamports
  const recipientBN = new anchor.BN(recipientGithubId.toString());

  const tx = await program.methods
    .createVoucher(voucherId, recipientBN, amountBN, metadata)
    .accounts({
      organization: orgPDA,
      voucher: voucherPDA,
      maintainer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function claimVoucher(wallet: any, voucherId: string) {
  const program = getProgram(wallet);
  const voucherPDA = getVoucherPDA(voucherId);

  const tx = await program.methods
    .claimVoucher()
    .accounts({
      voucher: voucherPDA,
      recipient: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
