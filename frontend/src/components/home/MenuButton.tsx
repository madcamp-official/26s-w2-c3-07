import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const MENU_BUTTON_CLASSNAME =
  "block w-full border border-brass-600/60 bg-noir-800/90 py-4 text-center font-display text-lg tracking-wide text-parchment-100 transition-colors hover:border-brass-400 hover:bg-noir-700/90";

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  href?: undefined;
};

type MenuLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string;
  href: string;
};

export function MenuButton({ label, href, className = "", ...props }: MenuButtonProps | MenuLinkProps) {
  if (href) {
    return (
      <Link href={href} className={`${MENU_BUTTON_CLASSNAME} ${className}`} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${MENU_BUTTON_CLASSNAME} ${className}`}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {label}
    </button>
  );
}
