import { Resend } from "resend";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { format } from "date-fns";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "");
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://subscriptionsavvy.app";
const FROM_EMAIL = "SubscriptionSavvy <noreply@subscriptionsavvy.app>";

export async function sendPaymentReminderEmail(
  to: string,
  subscriptionName: string,
  amount: number,
  currency: string,
  renewalDate: Date
) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedAmount = `${symbol}${amount.toLocaleString()}`;
  const formattedDate = format(renewalDate, "dd MMMM yyyy");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reminder: ${subscriptionName} renews in 3 days`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; background: #FAF7F2; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #E8E2D9; padding: 32px;">
          <div style="color: #0D7377; font-size: 20px; font-weight: 700; margin-bottom: 24px;">
            SubscriptionSavvy
          </div>
          <h2 style="color: #1A1A1A; margin: 0 0 16px;">Payment Reminder</h2>
          <p style="color: #6B6560; margin: 0 0 24px;">
            Your <strong style="color: #1A1A1A;">${subscriptionName}</strong> subscription is renewing soon.
          </p>
          <div style="background: #EEF7F7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #6B6560; font-size: 13px; margin-bottom: 4px;">Amount</div>
            <div style="color: #0D7377; font-size: 24px; font-weight: 700; font-family: monospace;">${formattedAmount}</div>
            <div style="color: #6B6560; font-size: 13px; margin-top: 8px;">Renewal Date: <strong style="color: #1A1A1A;">${formattedDate}</strong></div>
          </div>
          <a href="${APP_URL}/subscriptions" style="background: #0D7377; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            View Subscriptions
          </a>
          <p style="color: #A0A0A0; font-size: 12px; margin-top: 24px;">
            You're receiving this because you have email reminders enabled in SubscriptionSavvy.
          </p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendTrialExpiryEmail(
  to: string,
  subscriptionName: string,
  trialEndDate: Date
) {
  const formattedDate = format(trialEndDate, "dd MMMM yyyy");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ${subscriptionName} trial ends in 3 days`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; background: #FAF7F2; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #E8E2D9; padding: 32px;">
          <div style="color: #0D7377; font-size: 20px; font-weight: 700; margin-bottom: 24px;">
            SubscriptionSavvy
          </div>
          <h2 style="color: #1A1A1A; margin: 0 0 16px;">Trial Ending Soon</h2>
          <p style="color: #6B6560; margin: 0 0 24px;">
            Your free trial of <strong style="color: #1A1A1A;">${subscriptionName}</strong> is ending soon.
          </p>
          <div style="background: rgba(224, 92, 92, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid rgba(224, 92, 92, 0.2);">
            <div style="color: #E05C5C; font-weight: 600;">Trial ends: ${formattedDate}</div>
          </div>
          <a href="${APP_URL}/subscriptions" style="background: #0D7377; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Manage Subscriptions
          </a>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendBudgetAlertEmail(
  to: string,
  monthlyTotal: number,
  budget: number,
  currency: string
) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const percent = Math.round((monthlyTotal / budget) * 100);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're close to your subscription budget for this month`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; background: #FAF7F2; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #E8E2D9; padding: 32px;">
          <div style="color: #0D7377; font-size: 20px; font-weight: 700; margin-bottom: 24px;">
            SubscriptionSavvy
          </div>
          <h2 style="color: #1A1A1A; margin: 0 0 16px;">Budget Alert</h2>
          <p style="color: #6B6560; margin: 0 0 24px;">
            You've used <strong style="color: #E05C5C;">${percent}%</strong> of your monthly subscription budget.
          </p>
          <div style="background: rgba(224, 92, 92, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6B6560;">Current spend</span>
              <span style="color: #1A1A1A; font-weight: 600; font-family: monospace;">${symbol}${monthlyTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B6560;">Monthly budget</span>
              <span style="color: #1A1A1A; font-weight: 600; font-family: monospace;">${symbol}${budget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <a href="${APP_URL}/dashboard" style="background: #0D7377; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Review Dashboard
          </a>
        </div>
      </body>
      </html>
    `,
  });
}
