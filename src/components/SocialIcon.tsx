import React from 'react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SocialLink {
  icon: any;
  href: string;
  label: string;
  color: string;
  /** Logical key used to detect phone/email which open a popover instead of href. */
  kind?: 'linkedin' | 'youtube' | 'whatsapp' | 'phone' | 'email';
}

interface Props {
  link: SocialLink;
  /** Tailwind sizing classes for the wrapper button. */
  wrapperClassName: string;
  /** Tailwind sizing classes for the icon itself. */
  iconClassName: string;
}

const SocialIcon: React.FC<Props> = ({ link, wrapperClassName, iconClassName }) => {
  const Icon = link.icon;

  const isPhone = link.kind === 'phone';
  const isEmail = link.kind === 'email';

  if (isPhone || isEmail) {
    const displayValue = (link.href || '')
      .replace(isPhone ? /^tel:\s*/i : /^mailto:\s*/i, '')
      .trim();

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${wrapperClassName} group`}
            title={link.label}
            aria-label={link.label}
          >
            <Icon className={`${iconClassName} ${link.color} group-hover:text-primary-foreground transition-colors`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs p-3 text-sm">
          {isPhone ? (
            <p>
              Want to connect. Call us at{' '}
              <a
                href={`tel:${displayValue.replace(/\s+/g, '')}`}
                className="font-semibold text-primary hover:underline"
              >
                {displayValue}
              </a>
              .
            </p>
          ) : (
            <p>
              Want to connect.{' '}
              <Link
                to="/contact#contact-form"
                className="font-semibold text-primary hover:underline"
              >
                Send
              </Link>{' '}
              us a mail at <span className="font-semibold">{displayValue}</span>.
            </p>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  if (!link.href) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${wrapperClassName} group`}
            title={link.label}
            aria-label={link.label}
          >
            <Icon className={`${iconClassName} ${link.color} group-hover:text-primary-foreground transition-colors`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs p-3 text-sm">
          <p>No {link.label} link has been added yet.</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <a
      href={link.href}
      target={link.href.startsWith('http') ? '_blank' : '_self'}
      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={`${wrapperClassName} group`}
      title={link.label}
    >
      <Icon className={`${iconClassName} ${link.color} group-hover:text-primary-foreground transition-colors`} />
    </a>
  );
};

export default SocialIcon;
