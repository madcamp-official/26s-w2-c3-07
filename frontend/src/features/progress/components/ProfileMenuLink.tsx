import Link from "next/link";

type ProfileMenuLinkProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

export function ProfileMenuLink({ href, icon, title, description }: ProfileMenuLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border border-brass-600/40 bg-noir-800/80 px-6 py-5 transition-colors hover:border-brass-400"
    >
      <span aria-hidden className="text-2xl">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-display text-lg text-parchment-100">{title}</p>
        <p className="mt-0.5 text-xs text-parchment-300/60">{description}</p>
      </div>
      <span aria-hidden className="text-brass-400">
        →
      </span>
    </Link>
  );
}
