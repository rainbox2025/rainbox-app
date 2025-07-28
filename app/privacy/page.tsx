import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Rainbox",
  description: "Read the privacy policy for the Rainbox application.",
};

const PrivacyPolicyPage = () => {
  return (
    <div className="w-full bg-background font-sans">
      <main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 text-left">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-muted-foreground">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Effective Date: June 1, 2025
            </p>
          </div>

          <p className="text-muted-foreground">
            At Rainbox, your privacy is paramount. We are committed to
            protecting your privacy and ensuring a secure and user-friendly
            experience with Rainbox. This Privacy Policy outlines how we
            collect, use, and protect your personal information when you use our
            app and services. By using Rainbox, you agree to the terms of this
            Privacy Policy.
          </p>

          {/* Section 1: Information We Collect */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground">
              We collect the following types of information to provide and
              improve our services:
            </p>
            <div className="space-y-3 pl-4">
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  a. Personal Information
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>
                    Name, email address, and other contact details when you sign
                    up or interact with our platform.
                  </li>
                  <li>
                    Payment information, processed securely via a third-party
                    payment provider.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  b. Usage Data
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>
                    Logs, including timestamps, IP addresses, and actions
                    performed on the platform.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  c. Third-Party API Data
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>
                    <strong className="font-semibold">Google API:</strong> We use Google APIs to access
                    and manage data, such as Gmail filters, labels, and
                    messages, with your explicit consent.
                  </li>
                  <li>
                    <strong className="font-semibold">Microsoft Outlook API:</strong> We access Outlook
                    data with your authorization to provide enhanced
                    functionality.
                  </li>
                  <li>
                    <strong className="font-semibold">Google Gemini API:</strong> We process text and
                    queries sent to the Google Gemini API to generate summaries
                    or insights.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: How We Use Your Information */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>To provide, maintain, and improve the Rainbox platform.</li>
              <li>To authenticate and personalize your experience.</li>
              <li>To analyze usage trends and improve functionality.</li>
              <li>
                To communicate with you, including sending notifications,
                updates, or support messages.
              </li>
              <li>
                To comply with applicable legal obligations, including data
                protection and privacy laws.
              </li>
            </ul>
          </div>

          {/* Section 3: How We Share Your Information */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              3. How We Share Your Information
            </h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. However, we may share
              information under the following circumstances:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold">With Service Providers:</strong> We share data with
                third-party services such as Google, Microsoft, and Google
                Gemini to provide core functionalities.
              </li>
              <li>
                <strong className="font-semibold">For Legal Compliance:</strong> We may disclose
                information if required by law or to protect the rights and
                safety of our users or the public.
              </li>
              <li>
                <strong className="font-semibold">App Store Platforms:</strong> When you use Rainbox
                through platforms such as Apple App Store or Google Play Store,
                relevant information may be shared with those platforms as
                required by their terms of service and privacy policies.
              </li>
            </ul>
          </div>

          {/* Section 4: Third-Party Services and APIs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              4. Third-Party Services and APIs
            </h2>
            <p className="text-muted-foreground">
              Rainbox integrates with several third-party services. These
              services have their own privacy policies, and we encourage you to
              review them:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-muted"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://privacy.microsoft.com/en-us/privacystatement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-muted"
                >
                  Microsoft Privacy Statement
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy" // Note: Gemini API falls under Google's main policy
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-muted"
                >
                  Google Gemini Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.apple.com/legal/privacy/en-ww/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-muted"
                >
                  Apple Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy" // Note: Google Play falls under Google's main policy
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-muted"
                >
                  Google Play Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Section 5: Data Storage and Security */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              5. Data Storage and Security
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold">Hosting and Database:</strong> Your data is stored
                securely on our infrastructure, complying with industry
                security standards.
              </li>
              <li>
                <strong className="font-semibold">Encryption:</strong> We use encryption protocols to
                protect data in transit and at rest.
              </li>
              <li>
                <strong className="font-semibold">Access Control:</strong> Access to your data is
                restricted to authorized personnel who require it for
                operational purposes.
              </li>
            </ul>
          </div>

          {/* Section 6: Your Data Rights (GDPR Compliance) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              6. Your Data Rights (GDPR Compliance)
            </h2>
            <p className="text-muted-foreground">
              If you are located in the European Economic Area (EEA), you have
              the following rights under the General Data Protection Regulation
              (GDPR):
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>The right to access and update your personal information.</li>
              <li>
                The right to request deletion of your data ("right to be
                forgotten").
              </li>
              <li>
                The right to restrict or object to the processing of your
                information.
              </li>
              <li>The right to data portability.</li>
              <li>The right to withdraw consent at any time.</li>
              <li>
                The right to lodge a complaint with a data protection
                authority.
              </li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, please contact us at{" "}
              <a
                href="mailto:team@rainbox.app"
                className="underline hover:text-muted"
              >
                team@rainbox.app
              </a>
              .
            </p>
          </div>

          {/* Section 7: Data Retention */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              7. Data Retention
            </h2>
            <p className="text-muted-foreground">
              We retain your data for as long as necessary to provide our
              services or as required by law. Upon request, we will delete your
              personal data unless it is required to comply with legal
              obligations.
            </p>
          </div>

          {/* Section 8: Cookies and Tracking Technologies */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              8. Cookies and Tracking Technologies
            </h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to enhance your experience
              and analyze usage patterns. You can manage your cookie
              preferences through your browser settings. Where required by law,
              we obtain your consent before setting cookies.
            </p>
          </div>

          {/* Section 9: Children's Privacy */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              9. Children's Privacy
            </h2>
            <p className="text-muted-foreground">
              Rainbox is not intended for use by individuals under the age of
              13. We do not knowingly collect personal information from
              children. If we become aware of such data, we will take steps to
              delete it.
            </p>
          </div>

          {/* Section 10: Changes to This Privacy Policy */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated effective date. Continued
              use of Rainbox after changes constitutes acceptance of the revised
              policy.
            </p>
          </div>

          {/* Section 11: Contact Us */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground">
              If you have any questions or concerns about this Privacy Policy or
              our practices, please contact us at:
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
            We are committed to protecting your privacy and ensuring a secure
            and user-friendly experience with Rainbox.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;