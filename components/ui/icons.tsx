import React from 'react';

const createIcon = (path: React.ReactNode) => {
  const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path}
    </svg>
  );
  Icon.displayName = 'Icon';
  return Icon;
};

// src/components/ui/icons.tsx (AGREGAR)

export const Settings = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ChevronLeft = createIcon(<path d="m15 18-6-6 6-6" />);
export const CheckCircle = createIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>);
export const XCircle = createIcon(<><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></>);
export const Volume2 = createIcon(<path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07" />);
export const Loader2 = createIcon(<path d="M21 12a9 9 0 1 1-6.219-8.56" />);
export const Send = createIcon(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const Mic = createIcon(<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>);
export const StopCircle = createIcon(<><circle cx="12" cy="12" r="10"/><rect width="6" height="6" x="9" y="9"/></>);
export const Sparkles = createIcon(<path d="m12 3-1.9 1.9-1.4-1.4-1.9 1.9-1.9-1.9-1.4 1.4L1.9 6.3 3 8.2l-1.4 1.4 1.9 1.9-1.9 1.9 1.4 1.4L6.3 19l1.9-1.9 1.4 1.4 1.9-1.9 1.9 1.9 1.4-1.4L19.5 15.7l1.9-1.9-1.4-1.4-1.9-1.9-1.9-1.9 1.4-1.4Z"/>);
export const GripVertical = createIcon(<><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></>);
export const Plus = createIcon(<><path d="M5 12h14"/><path d="M12 5v14"/></>);
export const Trash2 = createIcon(<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>);
