import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          This Privacy Policy explains how we collect, use, and protect your
          personal information when you use our recipe management application.
          We are committed to ensuring the privacy and security of your data
          while providing you with a seamless cooking and meal planning
          experience.
        </p>
        <p className="mb-4">Last updated: December 28, 2024</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
        <div className="mb-4">
          <h3 className="text-xl font-medium mb-2">Account Information</h3>
          <p className="mb-2">When you create an account, we collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Name (optional)</li>
            <li className="mb-2">Email address</li>
            <li className="mb-2">Profile image (optional)</li>
            <li className="mb-2">Authentication information</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-medium mb-2">Recipe and Grocery Data</h3>
          <p className="mb-4">
            We store information about your recipes and grocery lists,
            including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Recipes you create, favorite, or pin</li>
            <li className="mb-2">Grocery items and shopping lists</li>
            <li className="mb-2">Recipe ratings and reviews</li>
            <li className="mb-2">Dietary preferences and restrictions</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          How We Use Your Information
        </h2>
        <p className="mb-4">We use your information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">
            Provide and improve our recipe management services
          </li>
          <li className="mb-2">
            Personalize your cooking and shopping experience
          </li>
          <li className="mb-2">
            Send important notifications about your account
          </li>
          <li className="mb-2">Analyze app usage to improve our features</li>
          <li className="mb-2">Ensure the security of your account</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Data Storage and Security
        </h2>
        <p className="mb-4">
          Your data is stored securely in our PostgreSQL database hosted on AWS.
          We implement industry-standard security measures, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Encrypted data transmission using HTTPS</li>
          <li className="mb-2">Secure password hashing</li>
          <li className="mb-2">Regular security audits and updates</li>
          <li className="mb-2">Access controls and authentication</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
        <p className="mb-4">We use the following third-party services:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">NextAuth.js for authentication</li>
          <li className="mb-2">Google Analytics for usage analytics</li>
          <li className="mb-2">Sentry for error tracking and monitoring</li>
        </ul>
        <p className="mb-4">
          These services may collect additional data according to their own
          privacy policies, which we encourage you to review.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Access your personal data</li>
          <li className="mb-2">Correct inaccurate data</li>
          <li className="mb-2">Request deletion of your data</li>
          <li className="mb-2">Export your recipe and grocery data</li>
          <li className="mb-2">Opt-out of analytics tracking</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Updates to Privacy Policy
        </h2>
        <p className="mb-4">
          We may update this Privacy Policy to reflect changes in our practices
          or for legal reasons. We will notify you of any material changes via
          email or through the application.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have questions about this Privacy Policy or your data, please
          contact us at:
        </p>
        <p className="mb-4">Email: hello@getzesty.food</p>
      </section>
    </div>
  );
}
