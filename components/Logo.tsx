import Link from 'next/link';
import Image from 'next/image';

/**
 * PdforO logo lockup: the uploaded logo.png icon + the PdforO serif wordmark
 * (Playfair Display, loaded in app/layout.tsx as --font-logo).
 * `variant="light"` renders the wordmark white for dark backgrounds.
 */
export default function Logo({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const color = variant === 'light' ? '#ffffff' : '#1E3A5F';

  return (
    <Link href="/" className={`inline-flex items-center gap-1 ${className}`} aria-label="PdforO home">
      <Image
        src="/logo.png"
        alt="PdforO logo"
        width={56}
        height={56}
        priority
        className="h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14"
      />
      <span
        style={{ fontFamily: 'var(--font-logo), Georgia, serif', color, letterSpacing: '-0.02em' }}
        className="-ml-0.5 font-semibold leading-none"
      >
        <span className="text-[30px] sm:text-[34px]">P</span>
        <span className="text-[22px] sm:text-[25px]">dfor</span>
        <span className="text-[30px] sm:text-[34px]">O</span>
      </span>
    </Link>
  );
}
