import { Crown } from 'lucide-react';

/**
 * User avatar that, for Pro members, gets an animated rotating gradient ring
 * + soft glow (see .pro-avatar in globals.css) and a small crown badge — so
 * it's instantly obvious who's on Pro. Free users get a plain avatar.
 */
export default function ProAvatar({
  name,
  avatarUrl,
  isPro,
  size = 32,
}: {
  name: string;
  avatarUrl?: string;
  isPro: boolean;
  size?: number;
}) {
  const inner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );

  if (!isPro) {
    return <div className="shrink-0 rounded-full ring-2 ring-white shadow-sm">{inner}</div>;
  }

  return (
    <div className="pro-avatar shrink-0">
      <div className="pro-avatar-inner">{inner}</div>
      <span
        className="absolute -bottom-1 -right-1 z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow ring-2 ring-white"
        style={{ width: Math.max(16, size * 0.5), height: Math.max(16, size * 0.5) }}
        title="Pro member"
      >
        <Crown style={{ width: size * 0.28, height: size * 0.28 }} strokeWidth={2.5} />
      </span>
    </div>
  );
}
