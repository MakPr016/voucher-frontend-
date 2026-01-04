# Git Voucher Dashboard (Frontend)

---

![GitPay Badges](https://img.shields.io/badge/GitPay-3%20Contributions-brightgreen?style=flat-square&logo=solana)

---

The **Git Voucher Dashboard** is a Next.js application that serves as the central hub for the Git Voucher ecosystem. It allows users to link their GitHub accounts with Solana wallets, view received vouchers, and claim crypto rewards.

## 🚀 Features

- **User Authentication:** Secure sign-in via [Clerk](https://clerk.com/).
- **Wallet Integration:** Link Solana wallets (Phantom) to GitHub identities.
- **Voucher Claiming:** Dedicated claim pages (`/claim/[id]`) for recipients to withdraw funds.
- **Dashboard:** View active vouchers, balance, and transaction history.
- **API Endpoints:** Backend routes for the Chrome extension to verify auth and create vouchers.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide React
- **Auth:** Clerk
- **Blockchain:** @coral-xyz/anchor, @solana/web3.js

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd makpr016-voucher-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup:**
   Create a `.env.local` file with the following keys (get these from Clerk dashboard):
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔗 Extension Integration

This dashboard is designed to work alongside the **Git Voucher Chrome Extension**. The extension communicates with this app via `localhost:3000` (or your deployed URL) to check user authentication status before signing transactions.
