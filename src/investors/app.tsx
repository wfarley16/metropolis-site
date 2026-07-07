import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ThemeProvider,
} from "@polis/ui-kit";
import {
  GatedHub,
  useGatedHub,
} from "@polis/marketing-site-kit";
import { metropolisBrand } from "../brand";
import { ContactForm } from "../components/contact-form";
import { MetropolisMark } from "../components/chrome";
import { createMetropolisGatedHubSource } from "./gated-hub-source";

/** The "request access" aside beside the gate, for investors without a passphrase. */
function RequestAccessAside(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Investor? Let's connect
        </div>
        <CardTitle>Share your interest</CardTitle>
        <CardDescription>
          Don't have a passphrase? Tell us a little about you and we'll follow up
          — and send access if it's a fit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ContactForm
          subject="Metropolis — investor interest"
          submitLabel="Share interest"
          fields={[
            { name: "name", label: "Your name", required: true },
            { name: "email", label: "you@email.com", type: "email", required: true },
            { name: "firm", label: "Firm / fund (optional)" },
            { name: "about", label: "A little about you and your interest", textarea: true },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function InvestorsApp(): React.JSX.Element {
  // The source (decrypt/auth seam) must be stable across renders.
  const source = React.useMemo(() => createMetropolisGatedHubSource(), []);
  const controls = useGatedHub(source, {
    failureMessage: "Incorrect passphrase. Try again.",
  });
  const unlocked = controls.status === "unlocked";

  return (
    <ThemeProvider brand={metropolisBrand}>
      {!unlocked ? (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <MetropolisMark />
            <a
              href="index.html"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Home
            </a>
          </div>
        </header>
      ) : null}

      <div className={unlocked ? "" : "mx-auto w-full max-w-4xl px-6 py-4"}>
        <GatedHub
          {...controls}
          className={unlocked ? "h-[100dvh]" : undefined}
          brandMark={
            <span>
              metropolis <span className="text-muted-foreground">· investor materials</span>
            </span>
          }
          gateAside={!unlocked ? <RequestAccessAside /> : undefined}
          copy={{
            eyebrow: "For investors",
            title: "Investor materials",
            description:
              "Enter the access passphrase to open the full plan, economics, and platform references. Don't have one? Share your interest in the form beside this and we'll be in touch.",
            passphrasePlaceholder: "Access passphrase",
            unlockLabel: "Unlock",
            lockLabel: "Lock",
            note: "Everything is encrypted; it decrypts in your browser only with the correct passphrase. Figures are illustrative placeholders pending a full financial model.",
            emptyTitle: "Select a document",
            emptyMessage: "Pick a document from the list to open it.",
            draftMessage: "Draft in progress — this reference is coming soon.",
          }}
        />
      </div>
    </ThemeProvider>
  );
}
