'use client';

import { Phone, MessageSquare, Mail } from 'lucide-react';

interface ContactActionsProps {
  phone?: string;
  email?: string;
  size?: 'sm' | 'md';
}

export function ContactActions({ phone, email, size = 'md' }: ContactActionsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnSize = size === 'sm'
    ? 'w-9 h-9 rounded-xl'
    : 'w-11 h-11 rounded-2xl';

  return (
    <div className="flex items-center gap-1.5">
      {phone && (
        <>
          <a
            href={`tel:${phone}`}
            className={`${btnSize} flex items-center justify-center bg-emerald-500/10 text-emerald-400 active:bg-emerald-500/20 transition-colors`}
            onClick={e => e.stopPropagation()}
            aria-label="Call"
          >
            <Phone className={iconSize} />
          </a>
          <a
            href={`sms:${phone}`}
            className={`${btnSize} flex items-center justify-center bg-blue-500/10 text-blue-400 active:bg-blue-500/20 transition-colors`}
            onClick={e => e.stopPropagation()}
            aria-label="Text"
          >
            <MessageSquare className={iconSize} />
          </a>
        </>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={`${btnSize} flex items-center justify-center bg-purple-500/10 text-purple-400 active:bg-purple-500/20 transition-colors`}
          onClick={e => e.stopPropagation()}
          aria-label="Email"
        >
          <Mail className={iconSize} />
        </a>
      )}
    </div>
  );
}
