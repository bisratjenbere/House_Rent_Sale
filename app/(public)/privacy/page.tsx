import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - HouseHub",
  description: "HouseHub's privacy policy and how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: January 2025
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            1. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you use HouseHub, we collect information to provide and improve
            our services:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Account Information:</strong> Name, email address, phone
              number, and password
            </li>
            <li>
              <strong>Property Listings:</strong> Property details, images, and
              location data you provide
            </li>
            <li>
              <strong>Messages:</strong> Communications between users through our
              messaging system
            </li>
            <li>
              <strong>Usage Data:</strong> How you interact with our platform,
              including search queries and viewed properties
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide and maintain our services</li>
            <li>Process and display your property listings</li>
            <li>Facilitate communication between users</li>
            <li>Send you important updates about your account and listings</li>
            <li>Improve our platform and develop new features</li>
            <li>Prevent fraud and ensure platform security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            3. Information Sharing
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We do not sell your personal information. We may share your information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>With Other Users:</strong> Your name, contact details, and
              property information are visible to users when you list a property
            </li>
            <li>
              <strong>Service Providers:</strong> We work with third-party services
              (email, cloud storage, analytics) who help us operate our platform
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect our rights and users' safety
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            4. Data Security
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement appropriate technical and organizational measures to
            protect your personal information. This includes encryption of sensitive
            data, secure authentication, and regular security assessments. However,
            no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            5. Your Rights
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Access and update your personal information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of promotional emails</li>
            <li>Request a copy of your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            6. Cookies
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies and similar technologies to maintain your session, remember
            your preferences, and analyze platform usage. You can control cookie
            settings through your browser.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            7. Children's Privacy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            HouseHub is not intended for users under 18 years of age. We do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            8. Changes to This Policy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this privacy policy from time to time. We will notify you
            of significant changes by email or through a notice on our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            9. Contact Us
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this privacy policy or how we handle your
            data, please contact us through our{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
