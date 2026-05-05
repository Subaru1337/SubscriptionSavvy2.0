const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageNumber, Footer, VerticalAlign
} = require('docx');
const fs = require('fs');

const TEAL = "0D7377";
const LIGHT_TEAL = "E8F4F4";
const GRAY = "F5F5F5";
const DARK = "1A1A1A";
const MUTED = "6B6B6B";

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 6 } },
        children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: TEAL })]
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
        children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: DARK })]
    });
}

function h3(text) {
    return new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: TEAL })]
    });
}

function p(text, opts = {}) {
    return new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text, font: "Arial", size: 22, color: opts.muted ? MUTED : DARK, italics: opts.italic || false })]
    });
}

function bullet(text, level = 0) {
    return new Paragraph({
        numbering: { reference: "bullets", level },
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, font: "Arial", size: 22, color: DARK })]
    });
}

function spacer(lines = 1) {
    return Array.from({ length: lines }, () =>
        new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] })
    );
}

function makeTable(headers, rows, colWidths) {
    const headerRow = new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
            borders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { fill: TEAL, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({
                children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: "FFFFFF" })]
            })]
        }))
    });

    const dataRows = rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
            borders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { fill: ri % 2 === 0 ? "FFFFFF" : GRAY, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [new Paragraph({
                children: [new TextRun({ text: cell, font: "Arial", size: 20, color: DARK })]
            })]
        }))
    }));

    return new Table({
        width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
        columnWidths: colWidths,
        rows: [headerRow, ...dataRows]
    });
}

function statusBadge(label, color) {
    return new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
            new TextRun({ text: "  " + label + "  ", font: "Arial", size: 18, bold: true, color: "FFFFFF", highlight: undefined }),
            new TextRun({ text: "   ", font: "Arial", size: 18 }),
        ]
    });
}

function infoBox(text) {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
            children: [new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 4, color: TEAL }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }, left: { style: BorderStyle.SINGLE, size: 12, color: TEAL }, right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
                shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 200, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, color: DARK, italics: true })] })]
            })]
        })]
    });
}

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "bullets",
                levels: [{
                    level: 0, format: LevelFormat.BULLET, text: "\u2022",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }, {
                    level: 1, format: LevelFormat.BULLET, text: "\u25E6",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
                }]
            },
            {
                reference: "numbers",
                levels: [{
                    level: 0, format: LevelFormat.DECIMAL, text: "%1.",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }
        ]
    },
    styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, font: "Arial", color: TEAL },
                paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 26, bold: true, font: "Arial", color: DARK },
                paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 }
            },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "SubscriptionSavvy PRD  |  Page ", font: "Arial", size: 18, color: MUTED }),
                        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: MUTED }),
                        new TextRun({ text: " of ", font: "Arial", size: 18, color: MUTED }),
                        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: MUTED }),
                    ]
                })]
            })
        },
        children: [

            // Title block
            new Paragraph({
                spacing: { before: 0, after: 120 },
                children: [new TextRun({ text: "SubscriptionSavvy", font: "Arial", size: 56, bold: true, color: TEAL })]
            }),
            new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: "Product Requirements Document", font: "Arial", size: 36, color: DARK })]
            }),
            new Paragraph({
                spacing: { before: 0, after: 400 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 8 } },
                children: [new TextRun({ text: "Version 2.0  |  May 2026  |  Status: Active Development", font: "Arial", size: 20, color: MUTED, italics: true })]
            }),

            // Section 1
            h1("1. Product Overview"),
            h2("1.1 Product Summary"),
            p("SubscriptionSavvy is a full-stack personal finance web application that helps users track all their recurring subscriptions in one place. It provides payment reminders, spending analytics, trial tracking, and budget awareness — turning subscription chaos into total clarity."),
            ...spacer(1),
            h2("1.2 Problem Statement"),
            p("The average person subscribes to 8–12 services monthly and loses track of renewal dates, accumulates forgotten trials that convert to paid, and has no clear picture of total subscription spend. SubscriptionSavvy solves this by giving users a single dashboard to see everything, get reminded before payments hit, and understand where their money goes."),
            ...spacer(1),
            h2("1.3 Target Users"),
            bullet("Individuals paying for multiple SaaS tools, streaming, or cloud services"),
            bullet("Students managing education and entertainment subscriptions on a budget"),
            bullet("Freelancers and developers tracking professional tool subscriptions"),
            bullet("Anyone who has ever been surprised by an unexpected renewal charge"),
            ...spacer(1),
            h2("1.4 Core Value Proposition"),
            infoBox('"Never be surprised by a subscription charge again."'),
            ...spacer(1),

            // Section 2
            h1("2. Tech Stack"),
            makeTable(
                ["Layer", "Technology", "Notes"],
                [
                    ["Frontend", "Next.js 14 (App Router)", "File-based routing, server components"],
                    ["Styling", "Tailwind CSS + shadcn/ui", "Component library on top of Tailwind"],
                    ["Charts", "Recharts", "Spending analytics visualizations"],
                    ["HTTP Client", "Axios", "JWT interceptor for auth headers"],
                    ["Backend", "Next.js API Routes", "Serverless functions — no separate server"],
                    ["ORM", "Prisma", "Type-safe database access"],
                    ["Database", "PostgreSQL on Neon", "Serverless PostgreSQL, free tier"],
                    ["Auth", "JWT via jose", "httpOnly cookie storage"],
                    ["Email", "Resend", "Transactional email, 3k free/month"],
                    ["Deployment", "Vercel", "Single deploy for frontend + API"],
                ],
                [2800, 3200, 3360]
            ),
            ...spacer(1),

            // Section 3
            h1("3. Design System"),
            h2("3.1 Color Palette"),
            makeTable(
                ["Token", "Hex Value", "Usage"],
                [
                    ["Background", "#FAF7F2", "App background — warm cream"],
                    ["Card", "#FFFFFF", "Card surfaces"],
                    ["Accent", "#0D7377", "Primary CTA, links, highlights"],
                    ["Text Primary", "#1A1A1A", "Headings and body text"],
                    ["Text Muted", "#6B6B6B", "Labels and secondary info"],
                    ["Overdue", "#C0544A", "Overdue payment status"],
                    ["Due Today", "#D97706", "Due today status"],
                    ["Due Tomorrow", "#B45309", "Due tomorrow status"],
                    ["This Week", "#0D7377", "Within 7 days status"],
                    ["Upcoming", "#4A7C59", "Future payments status"],
                ],
                [2400, 2400, 4560]
            ),
            ...spacer(1),
            h2("3.2 Typography"),
            makeTable(
                ["Use", "Font", "Notes"],
                [
                    ["Headings", "Space Grotesk Bold", "Strong, modern, distinctive"],
                    ["Body text", "Inter Regular", "Clean, highly readable"],
                    ["Numbers / Amounts", "DM Mono", "Monospace for financial figures"],
                ],
                [2400, 3000, 3960]
            ),
            ...spacer(1),
            h2("3.3 Design Principles"),
            bullet("Light mode as default — warm cream base feels premium and calm"),
            bullet("Minimal decoration — every element earns its place"),
            bullet("Status badges as muted colored pills — informative not alarming"),
            bullet("Monospace font for all currency amounts — looks precise and trustworthy"),
            bullet("Currency symbol ₹ configurable per user"),
            ...spacer(1),

            // Section 4
            h1("4. Data Models"),
            h2("4.1 User"),
            makeTable(
                ["Field", "Type", "Notes"],
                [
                    ["id", "String (UUID)", "Primary key"],
                    ["email", "String", "Unique"],
                    ["password_hash", "String", "Bcrypt hashed"],
                    ["base_currency", "String", "Default: INR"],
                    ["monthly_budget", "Decimal", "Optional spending cap"],
                    ["created_at", "DateTime", "Auto-generated"],
                ],
                [2400, 2800, 4160]
            ),
            ...spacer(1),
            h2("4.2 Subscription"),
            makeTable(
                ["Field", "Type", "Notes"],
                [
                    ["id", "String (UUID)", "Primary key"],
                    ["user_id", "String", "Foreign key to User"],
                    ["name", "String", "Service name e.g. Netflix"],
                    ["cost", "Decimal (10,2)", "Amount charged"],
                    ["currency", "String", "USD, INR, EUR etc."],
                    ["category", "Enum", "Entertainment, Productivity, Health, Education, Finance, Shopping, Other"],
                    ["billing_cycle", "Enum", "monthly or yearly"],
                    ["next_payment", "Date", "Upcoming due date"],
                    ["status", "Enum", "active, trial, paused, cancelled"],
                    ["trial_ends_on", "Date", "Optional — for free trials"],
                    ["notes", "String", "Optional user notes"],
                    ["created_at", "DateTime", "Auto-generated"],
                ],
                [2400, 2400, 4560]
            ),
            ...spacer(1),
            h2("4.3 PaymentHistory"),
            makeTable(
                ["Field", "Type", "Notes"],
                [
                    ["id", "String (UUID)", "Primary key"],
                    ["subscription_id", "String", "Foreign key to Subscription"],
                    ["user_id", "String", "Foreign key to User"],
                    ["amount", "Decimal", "Amount at time of payment"],
                    ["currency", "String", "Currency at time of payment"],
                    ["paid_at", "DateTime", "When mark-as-paid was triggered"],
                ],
                [2400, 2400, 4560]
            ),
            ...spacer(1),

            // Section 5
            h1("5. Feature Specifications"),

            h2("5.1 Authentication"),
            h3("User Registration"),
            bullet("Fields: email, password, confirm password"),
            bullet("Validation: email format, password minimum 8 characters, passwords match"),
            bullet("Prevents duplicate email registration"),
            bullet("Returns JWT on success — stored in httpOnly cookie"),
            ...spacer(1),
            h3("User Login"),
            bullet("Verifies password hash via bcrypt"),
            bullet("JWT stored in httpOnly cookie (not localStorage — security improvement over v1)"),
            bullet("Protected routes redirect unauthenticated users to /auth"),
            ...spacer(1),
            h3("API Endpoints"),
            makeTable(
                ["Method", "Endpoint", "Description"],
                [
                    ["POST", "/api/auth/register", "Create new user account"],
                    ["POST", "/api/auth/login", "Authenticate and receive token"],
                    ["POST", "/api/auth/logout", "Clear session cookie"],
                    ["GET", "/api/auth/me", "Get current user profile"],
                ],
                [1200, 3200, 4960]
            ),
            ...spacer(1),

            h2("5.2 Subscription CRUD"),
            h3("Payment Status Logic"),
            makeTable(
                ["Status", "Condition", "Badge Color"],
                [
                    ["Overdue", "next_payment is in the past", "#C0544A (Terracotta)"],
                    ["Due Today", "next_payment is today", "#D97706 (Amber)"],
                    ["Due Tomorrow", "next_payment is tomorrow", "#B45309 (Brown)"],
                    ["This Week", "next_payment within 7 days", "#0D7377 (Teal)"],
                    ["Upcoming", "next_payment beyond 7 days", "#4A7C59 (Sage)"],
                ],
                [2000, 3200, 4160]
            ),
            ...spacer(1),
            h3("Mark as Paid"),
            bullet("Only available when next_payment is today or overdue"),
            bullet("Monthly subscriptions: advances next_payment by 1 month"),
            bullet("Yearly subscriptions: advances next_payment by 1 year"),
            bullet("Logs entry to PaymentHistory table on every successful pay action"),
            bullet("Rejects request if payment is not yet due"),
            ...spacer(1),

            h2("5.3 Trial Tracker"),
            infoBox("Many subscriptions start as free trials that silently convert to paid. This feature surfaces expiring trials before they charge."),
            ...spacer(1),
            bullet("trial_ends_on optional field on every subscription"),
            bullet("Subscriptions in trial show amber 'Trial' badge on all cards"),
            bullet("Dedicated 'Trials Expiring Soon' section at top of Reminders page"),
            bullet("Shows trials expiring within 7 days with days remaining countdown"),
            bullet("Email reminder sent 3 days before trial ends"),
            bullet("On trial end user can convert to active or cancel"),
            ...spacer(1),

            h2("5.4 Multi-Currency Support"),
            bullet("Each subscription stores its own currency field"),
            bullet("User sets a base currency in profile settings"),
            bullet("Dashboard totals convert all amounts to base currency using live rates"),
            bullet("Exchange rates cached for 24 hours to avoid excessive API calls"),
            bullet("Per-subscription amounts shown in original currency"),
            bullet("Dashboard totals labeled: '₹6,457/month (converted)'"),
            ...spacer(1),
            h3("Supported Currencies (initial release)"),
            p("INR, USD, EUR, GBP, AUD, CAD, SGD, AED"),
            ...spacer(1),

            h2("5.5 Budget Alerts"),
            bullet("User sets optional monthly_budget in profile settings"),
            bullet("Dashboard shows budget progress bar when budget is configured"),
            bullet("Progress bar color states: green (under 70%), amber (70–90%), red (over 90%)"),
            bullet("Over-budget warning banner shown on dashboard"),
            bullet("Label: '₹2,400 of ₹3,000 monthly budget used (80%)'"),
            ...spacer(1),

            h2("5.6 Subscription Templates"),
            p("Pre-filled common services to reduce friction on add. User can override any value."),
            ...spacer(1),
            makeTable(
                ["Service", "Default Cost", "Cycle", "Category"],
                [
                    ["Netflix", "₹649", "Monthly", "Entertainment"],
                    ["Spotify", "₹119", "Monthly", "Entertainment"],
                    ["YouTube Premium", "₹139", "Monthly", "Entertainment"],
                    ["ChatGPT Plus", "₹1,650", "Monthly", "Productivity"],
                    ["Adobe Creative Cloud", "₹1,675", "Monthly", "Productivity"],
                    ["Amazon Prime", "₹1,499", "Yearly", "Shopping"],
                    ["Hotstar", "₹299", "Monthly", "Entertainment"],
                    ["Apple iCloud", "₹75", "Monthly", "Productivity"],
                    ["Notion", "₹800", "Yearly", "Productivity"],
                    ["Coursera Plus", "₹3,399", "Yearly", "Education"],
                    ["Headspace", "₹450", "Yearly", "Health"],
                    ["AWS", "Custom", "Monthly", "Productivity"],
                ],
                [2500, 1800, 1800, 3260]
            ),
            ...spacer(1),

            h2("5.7 Calendar View"),
            bullet("Monthly calendar grid showing payment dates"),
            bullet("Each day cell shows subscription icons due that day"),
            bullet("Multiple payments shown as stacked icons with overflow count"),
            bullet("Click a day to expand full payment list for that date"),
            bullet("Toggle between List view and Calendar view on Subscriptions page"),
            bullet("Today highlighted with teal accent border"),
            ...spacer(1),

            h2("5.8 Email Reminders"),
            h3("Email Types"),
            makeTable(
                ["Email", "Trigger", "Subject Line"],
                [
                    ["Payment reminder", "3 days before next_payment", "⏰ [Service] payment due in 3 days"],
                    ["Trial expiry", "3 days before trial_ends_on", "⚠️ Your [Service] trial ends in 3 days"],
                    ["Monthly digest", "1st of every month", "📅 Your subscriptions this month — ₹X total"],
                ],
                [2400, 3000, 3960]
            ),
            ...spacer(1),
            h3("Implementation"),
            bullet("Vercel Cron job runs daily at 9:00 AM IST"),
            bullet("Checks subscriptions due in exactly 3 days across all users"),
            bullet("Sends via Resend API (3,000 free emails/month)"),
            bullet("Logs sent emails to prevent duplicate sends"),
            bullet("User can toggle each notification type in settings"),
            bullet("Every email includes unsubscribe link"),
            ...spacer(1),

            h2("5.9 Analytics Dashboard"),
            h3("Summary Stats"),
            bullet("Monthly total spend (converted to base currency)"),
            bullet("Annual total spend"),
            bullet("Active subscription count"),
            bullet("Budget progress bar (if budget configured)"),
            bullet("Highest spend category callout"),
            ...spacer(1),
            h3("Spending Trends (new in v2)"),
            bullet("Line chart showing monthly spend over last 6 months"),
            bullet("Data sourced from PaymentHistory table — real historical data"),
            bullet("Trend indicator: 'Up 12% vs last month'"),
            bullet("Category breakdown over time as stacked area chart"),
            ...spacer(1),

            h2("5.10 Cancellation and Status Tracking"),
            makeTable(
                ["Status", "Meaning", "Shown in default filter"],
                [
                    ["active", "Currently subscribed and paying", "Yes"],
                    ["trial", "In free trial period", "Yes"],
                    ["paused", "Temporarily not paying", "No — toggle to show"],
                    ["cancelled", "No longer subscribed", "No — toggle to show"],
                ],
                [1800, 4000, 3560]
            ),
            ...spacer(1),
            bullet("Cancelled subscriptions shown with strikethrough styling"),
            bullet("Historical spend from cancelled subs still included in trend data"),
            bullet("Reactivate option available on cancelled subscriptions"),
            bullet("No hard delete in normal user flow — data always preserved"),
            ...spacer(1),

            h2("5.11 Export and Import"),
            h3("CSV Export"),
            bullet("All active subscriptions exported"),
            bullet("Columns: name, cost, currency, category, billing_cycle, next_payment, status, notes"),
            ...spacer(1),
            h3("PDF Export"),
            bullet("Text report grouped by category"),
            bullet("Total spend summary at top"),
            ...spacer(1),
            h3("Import from CSV"),
            bullet("User uploads CSV file"),
            bullet("App maps columns to subscription fields"),
            bullet("Preview table shown before confirming import"),
            bullet("Validates and skips malformed rows with error report"),
            ...spacer(1),

            // Section 6
            h1("6. Pages and Navigation"),
            makeTable(
                ["Route", "Page", "Auth Required"],
                [
                    ["/auth", "Login / Register", "No"],
                    ["/dashboard", "Main dashboard with KPIs and charts", "Yes"],
                    ["/subscriptions", "Subscription list + calendar view", "Yes"],
                    ["/reminders", "Payment and trial reminders", "Yes"],
                    ["/analytics", "Spending trends and category breakdown", "Yes"],
                    ["/settings", "Profile, currency, budget, notifications", "Yes"],
                ],
                [1800, 4400, 3160]
            ),
            ...spacer(1),

            // Section 7
            h1("7. Complete API Surface"),
            makeTable(
                ["Method", "Endpoint", "Description"],
                [
                    ["POST", "/api/auth/register", "Create new user"],
                    ["POST", "/api/auth/login", "Login and receive token"],
                    ["POST", "/api/auth/logout", "Clear session"],
                    ["GET", "/api/auth/me", "Current user profile"],
                    ["GET", "/api/subscriptions", "List all subscriptions"],
                    ["POST", "/api/subscriptions", "Create subscription"],
                    ["PUT", "/api/subscriptions/[id]", "Update subscription"],
                    ["DELETE", "/api/subscriptions/[id]", "Delete subscription"],
                    ["POST", "/api/subscriptions/[id]/pay", "Mark as paid"],
                    ["GET", "/api/subscriptions/calendar", "Calendar view data"],
                    ["GET", "/api/analytics/summary", "KPI totals"],
                    ["GET", "/api/analytics/category-breakdown", "Spend by category"],
                    ["GET", "/api/analytics/trends", "Historical spend trends"],
                    ["GET", "/api/reminders/upcoming", "Upcoming payments"],
                    ["GET", "/api/reminders/trials", "Expiring trials"],
                    ["GET", "/api/export/csv", "Download CSV"],
                    ["GET", "/api/export/pdf", "Download PDF"],
                    ["POST", "/api/import/csv", "Import from CSV"],
                    ["GET", "/api/user/settings", "Get user settings"],
                    ["PUT", "/api/user/settings", "Update user settings"],
                    ["GET", "/api/currencies/rates", "Get exchange rates"],
                    ["POST", "/api/cron/reminders", "Daily cron trigger (internal)"],
                ],
                [1000, 3400, 4960]
            ),
            ...spacer(1),

            // Section 8
            h1("8. Non-Functional Requirements"),
            h2("Security"),
            bullet("Passwords hashed with bcrypt (minimum 12 rounds)"),
            bullet("JWT stored in httpOnly cookie — not localStorage"),
            bullet("Every API route validates JWT before accessing data"),
            bullet("All queries scoped to authenticated user_id — no cross-user data access"),
            bullet("Input validation on all endpoints using Zod schemas"),
            ...spacer(1),
            h2("Performance"),
            bullet("Dashboard loads within 2 seconds on first paint"),
            bullet("API responses under 500ms for typical queries"),
            bullet("Exchange rates cached 24 hours to minimize external calls"),
            bullet("Static assets served via Vercel edge CDN"),
            ...spacer(1),
            h2("Accessibility"),
            bullet("Semantic HTML throughout all pages"),
            bullet("Keyboard navigable — all interactive elements reachable via Tab"),
            bullet("Color is never the only status indicator — always paired with text or icon"),
            bullet("Minimum contrast ratio 4.5:1 for all text"),
            ...spacer(1),

            // Section 9
            h1("9. Development Phases"),
            makeTable(
                ["Phase", "Features", "Goal"],
                [
                    ["Phase 1 — MVP", "Auth, CRUD, Mark as Paid, Dashboard, CSV/PDF export, Deployment", "Working deployed app"],
                    ["Phase 2 — Smart", "Trial tracker, Email reminders, Budget alerts, Spending trends, Cancellation tracking", "Actually useful daily"],
                    ["Phase 3 — Polish", "Multi-currency, Templates, Calendar view, CSV import, PWA", "Portfolio-ready"],
                    ["Phase 4 — Growth", "Push notifications, Bank statement parsing, AI subscription detection", "Future roadmap"],
                ],
                [2000, 4600, 2760]
            ),
            ...spacer(1),

            // Section 10
            h1("10. Success Metrics"),
            makeTable(
                ["Metric", "Target"],
                [
                    ["Subscriptions added in first session", "At least 5 per user"],
                    ["7-day user retention", "60% or higher"],
                    ["Email reminder open rate", "40% or higher"],
                    ["Export feature usage", "30% of active users"],
                    ["PWA install rate", "Track and improve over time"],
                    ["Zero surprise renewals", "Primary qualitative success indicator"],
                ],
                [4500, 4860]
            ),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('SubscriptionSavvy_PRD.docx', buffer);
    console.log('Done');
});