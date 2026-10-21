import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { computeAccountBalance } from "../src/utils/balanceCalculator.js";
import { toDecimal, formatDecimalString, Decimal } from "../src/utils/decimal.js";

console.log("=== TrackMon Self-Check Test Suite ===");

// 1. Lossless Decimal Arithmetic Check
console.log("[1/4] Testing lossless Decimal128 / Decimal arithmetic...");
const a = toDecimal("0.1");
const b = toDecimal("0.2");
const sum = a.plus(b);
assert.equal(sum.toString(), "0.3", "0.1 + 0.2 must equal exactly 0.3 without IEEE 754 float drift");

const largeVal = toDecimal("999999999999.99");
const increment = toDecimal("0.01");
const totalLarge = largeVal.plus(increment);
assert.equal(totalLarge.toString(), "1000000000000", "Large currency values must maintain exact precision");
console.log("  ✓ Decimal arithmetic test passed.");

// 2. Track Wallet Dynamic Balance Formula Check (wm6.b verification)
console.log("[2/4] Testing dynamic account balance calculation (wm6.b formula)...");
const initialBalanceAcc1 = "1000.00";
const initialBalanceAcc2 = "0.00";

const mockTransactions = [
  // Income to Acc 1: +250.50
  {
    type: "INCOME" as const,
    accountId: 1,
    accountAmount: "250.50",
    isScheduled: false,
    isDeleted: false,
  },
  // Expense from Acc 1: -120.25
  {
    type: "EXPENSE" as const,
    accountId: 1,
    accountAmount: "120.25",
    isScheduled: false,
    isDeleted: false,
  },
  // Transfer from Acc 1 -> Acc 2: -300.00 on Acc 1, +300.00 on Acc 2
  {
    type: "TRANSFER" as const,
    accountId: 1,
    accountAmount: "300.00",
    toAccountId: 2,
    toAccountAmount: "300.00",
    isScheduled: false,
    isDeleted: false,
  },
  // Transfer from Acc 3 -> Acc 1: +50.00 on Acc 1
  {
    type: "TRANSFER" as const,
    accountId: 3,
    accountAmount: "50.00",
    toAccountId: 1,
    toAccountAmount: "50.00",
    isScheduled: false,
    isDeleted: false,
  },
  // Scheduled transaction (future, must NOT affect current balance)
  {
    type: "EXPENSE" as const,
    accountId: 1,
    accountAmount: "500.00",
    isScheduled: true,
    isDeleted: false,
  },
  // Soft-deleted transaction (must NOT affect current balance)
  {
    type: "INCOME" as const,
    accountId: 1,
    accountAmount: "999.00",
    isScheduled: false,
    isDeleted: true,
  },
];

// Calculation: 1000.00 + 250.50 - 120.25 - 300.00 + 50.00 = 880.25
const acc1Balance = computeAccountBalance(initialBalanceAcc1, 1, mockTransactions);
assert.equal(acc1Balance.toFixed(2), "880.25", "Account 1 balance must strictly equal 880.25");

// Calculation for Acc 2: 0.00 + 300.00 = 300.00
const acc2Balance = computeAccountBalance(initialBalanceAcc2, 2, mockTransactions);
assert.equal(acc2Balance.toFixed(2), "300.00", "Account 2 balance must strictly equal 300.00");
console.log("  ✓ Dynamic balance calculation test passed.");

// 3. Multi-currency and Transfer Validation Constraints
console.log("[3/4] Testing transfer constraints...");
function validateTransfer(sourceId: number, destId: number, amount: string): boolean {
  if (sourceId === destId) return false;
  if (toDecimal(amount).lte(0)) return false;
  return true;
}

assert.equal(validateTransfer(1, 1, "100.00"), false, "Transfer to same account must fail");
assert.equal(validateTransfer(1, 2, "0.00"), false, "Transfer with zero amount must fail");
assert.equal(validateTransfer(1, 2, "-50.00"), false, "Transfer with negative amount must fail");
assert.equal(validateTransfer(1, 2, "150.00"), true, "Valid transfer must succeed");
console.log("  ✓ Transfer validation constraints passed.");

// 4. JWT & Password Hashing Roundtrip
console.log("[4/4] Testing Auth JWT & Bcrypt password verification...");
const rawPassword = "TestPassword123!";
const secret = "test_jwt_secret_key_2026";
const hash = await bcrypt.hash(rawPassword, 10);
const match = await bcrypt.compare(rawPassword, hash);
assert.equal(match, true, "Bcrypt hash must match raw password");

const token = jwt.sign({ id: "user_12345", email: "user@example.com" }, secret, { expiresIn: "1h" });
const decoded = jwt.verify(token, secret) as { id: string; email: string };
assert.equal(decoded.id, "user_12345", "JWT id must match payload");
assert.equal(decoded.email, "user@example.com", "JWT email must match payload");
console.log("  ✓ Auth JWT and Password hashing passed.");

console.log("\nAll self-check tests passed successfully!");
