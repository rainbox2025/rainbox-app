import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Rainbox",
  description: "Read the terms of use for the Rainbox application.",
};

export default function TermsPage() {
  return (
    <div className="w-full bg-background font-sans">
      <main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 text-left">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-muted-foreground">
              Terms of Use
            </h1>
            <p className="text-lg text-muted-foreground">
              Effective Date: June 1, 2025
            </p>
          </div>

          <p className="text-muted-foreground">
            Welcome to Rainbox! These Terms of Use ("Terms") govern your access
            to and use of the Rainbox application and related services
            ("Services"). By accessing or using our Services, you agree to be
            bound by these Terms and our Privacy Policy. If you do not agree,
            please refrain from using our Services.
          </p>

          {/* Section 1: Account Registration and Security */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              1. Account Registration and Security
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold">Eligibility:</strong> You
                must be at least 13 years old to use Rainbox.
              </li>
              <li>
                <strong className="font-semibold">Account Information:</strong>{" "}
                You agree to provide accurate and complete information during
                registration and to keep this information up to date.
              </li>
              <li>
                <strong className="font-semibold">Security:</strong> You are
                responsible for maintaining the confidentiality of your account
                credentials and for all activities under your account.
              </li>
            </ul>
          </div>

          {/* Section 2: Subscription Plans and Billing */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              2. Subscription Plans and Billing
            </h2>
            <div className="space-y-3 pl-4">
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  a. Free Trial
                </h3>
                <p className="text-muted-foreground">
                  Rainbox offers a 30-day free trial for new users. After the
                  trial period, access to premium features requires a paid
                  subscription.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  b. Paid Plans
                </h3>
                <p className="text-muted-foreground">
                  We offer the following subscription options:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>
                    <strong className="font-semibold">
                      Monthly Subscription:
                    </strong>{" "}
                    Billed monthly.
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Annual Subscription:
                    </strong>{" "}
                    Billed annually at a discounted rate.
                  </li>
                  <li>
                    <strong className="font-semibold">
                      One-Time Purchase (Lifetime Deal):
                    </strong>{" "}
                    A single payment for lifetime access.
                  </li>
                  <li>
                    <strong className="font-semibold">Gifting Option:</strong>{" "}
                    Purchase a subscription as a gift for another user.
                  </li>
                </ul>
                <p className="pt-2 text-muted-foreground">
                  All fees are exclusive of taxes, which will be added where
                  applicable.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  c. Payment Processing
                </h3>
                <p className="text-muted-foreground">
                  Payments are processed through secure third-party payment
                  gateways. By subscribing, you authorize us to charge your
                  payment method for the applicable fees.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  d. Automatic Renewal
                </h3>
                <p className="text-muted-foreground">
                  Subscriptions automatically renew at the end of each billing
                  cycle unless canceled prior to renewal. You can manage or
                  cancel your subscription through Settings menu.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Refund Policy */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              3. Refund Policy
            </h2>
            <p className="text-muted-foreground">
              All purchases are final. We do not offer refunds except in cases
              where:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                A technical issue, attributable to Rainbox, prevents you from
                using the Services.
              </li>
              <li>
                We are unable to resolve the issue within a reasonable timeframe
                after you have contacted our support team.
              </li>
            </ul>
            <p className="text-muted-foreground">
              To request a refund under these conditions, please contact{" "}
              <a
                href="mailto:team@rainbox.app"
                className="underline hover:text-muted"
              >
                team@rainbox.app
              </a>
            </p>
          </div>

          {/* Section 4: Acceptable Use */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Use the Services for any unlawful purpose or in violation of any
                applicable laws.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Services.
              </li>
              <li>
                Attempt to gain unauthorized access to the Services or related
                systems.
              </li>
              <li>Transmit any viruses or malicious code.</li>
              <li>
                Use the Services to transmit unsolicited communications or
                spam.
              </li>
            </ul>
          </div>

          {/* Section 5: Intellectual Property */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              5. Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              All content, trademarks, and data on Rainbox, including but not
              limited to software, databases, text, graphics, icons, and
              hyperlinks are the property of or licensed to Rainbox and are
              protected from infringement by local and international
              legislation.
            </p>
          </div>

          {/* Section 6: Third-Party Integrations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              6. Third-Party Integrations
            </h2>
            <p className="text-muted-foreground">
              Rainbox integrates with third-party services such as Gmail,
              Outlook, and OpenAI to provide enhanced functionalities. By using
              these integrations, you agree to comply with the terms and
              policies of these third-party services. Rainbox is not responsible
              for the practices or content of these third-party services.
            </p>
          </div>

          {/* Section 7: Termination */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              7. Termination
            </h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your access to the
              Services at our discretion, without notice, for conduct that we
              believe violates these Terms or is harmful to other users of the
              Services, us, or third parties, or for any other reason.
            </p>
          </div>

          {/* Section 8: Disclaimers and Limitation of Liability */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              8. Disclaimers and Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              <strong className="font-semibold">Disclaimers:</strong> The
              Services are provided "as is" without warranties of any kind,
              either express or implied.
            </p>
            <p className="text-muted-foreground">
              <strong className="font-semibold">
                Limitation of Liability:
              </strong>{" "}
              To the maximum extent permitted by law, Rainbox shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits or revenues.
            </p>
          </div>

          {/* Section 9: Pay Once / Lifetime Deal Limitations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              9. Pay Once / Lifetime Deal Limitations
            </h2>
            <p className="text-muted-foreground">
              Rainbox offers a Lifetime Plan ("Pay Once") which grants users
              access to the premium features of the app for the duration of the
              app's operational life. We reserve the right to update, modify,
              enhance, or discontinue any part of the Rainbox service or
              features at our sole discretion and without prior notice. While we
              strive to maintain and improve the app continuously, we do not
              guarantee the availability of any specific features indefinitely.
            </p>
            <div className="space-y-3 pl-4">
              <h3 className="font-semibold text-muted-foreground">
                Conditions of Use
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  The Lifetime Plan is strictly for personal, non-commercial,
                  and non-transferable use.
                </li>
                <li>
                  Sharing your account credentials, sublicensing, or reselling
                  access under this plan is strictly prohibited.
                </li>
                <li>
                  Any violation of these terms may result in immediate
                  termination of your access without notice and without
                  eligibility for a refund.
                </li>
              </ul>
              <h3 className="font-semibold text-muted-foreground">
                If Rainbox Discontinues Operations
              </h3>
              <p className="text-muted-foreground">
                In the unlikely event that Rainbox is shut down, the following
                conditions will apply:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  <strong className="font-semibold">Advance Notice:</strong> We
                  will make every reasonable effort to provide users with at
                  least 30 days' notice before the shutdown.
                </li>
                <li>
                  <strong className="font-semibold">Data Portability:</strong>{" "}
                  During this notice period, users will have the ability to
                  export their saved data, highlights, and notes.
                </li>
                <li>
                  <strong className="font-semibold">No Refunds:</strong> The
                  Lifetime Plan is a one-time payment and is non-refundable,
                  including in the event of app discontinuation.
                </li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              By purchasing the Lifetime Plan, you acknowledge and agree to
              these terms as part of your use of the Rainbox platform.
            </p>
          </div>

          {/* ... Add other sections 10 to 21 following the same pattern ... */}

          {/* Section 21: Contact Us */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              21. Contact Us
            </h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="text-muted-foreground">
              <p className="font-semibold">Rainbox Support</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:team@rainbox.app"
                  className="underline hover:text-muted"
                >
                  team@rainbox.app
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="pt-4 text-muted-foreground">
            By using Rainbox, you acknowledge that you have read, understood,
            and agree to be bound by these Terms of Use.
          </p>
        </div>
      </main>
    </div>
  );
};
