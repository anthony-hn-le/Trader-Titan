import { Globe, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";

const LINKS = [
  { href: "https://anthony-le.vercel.app/", icon: <Globe size={18} />, label: "Portfolio" },
  { href: "https://www.linkedin.com/in/anthony-hn-le/", icon: <LinkedinIcon size={18} />, label: "LinkedIn" },
  { href: "https://github.com/anthony-hn-le", icon: <GithubIcon size={18} />, label: "GitHub" },
  { href: "mailto:anthony.hn.le@gmail.com", icon: <Mail size={18} />, label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-muted/20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
        <div>
          <span className="font-mono text-base font-bold text-cyan-500 dark:text-cyan-400">Anthony Le</span>
          <p className="mt-1 text-xs text-muted-foreground">© {year} · Trader Titan</p>
        </div>

        <div className="flex gap-4">
          {LINKS.map(({ href, icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex items-center text-muted-foreground transition-colors hover:text-cyan-500 dark:hover:text-cyan-400"
            >
              {icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
