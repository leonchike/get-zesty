import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pageBg-light dark:bg-pageBg-dark text-textColor-light dark:text-textColor-dark px-4">
      {/* Emoji */}
      <div className="text-6xl mb-4">😞</div>
      {/* Heading */}
      <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
      {/* Description */}
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      {/* CTA Button */}
      <Link
        href="/"
        className="inline-block px-5 py-2 rounded-md bg-primary-light dark:bg-primary-dark text-white font-semibold hover:bg-primary-light/80 dark:hover:bg-primary-dark/80 transition-colors duration-200"
      >
        Return Home
      </Link>
    </div>
  );
}
