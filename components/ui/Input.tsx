import React, { forwardRef } from 'react';

export type InputProps =
  | (React.InputHTMLAttributes<HTMLInputElement> & { as?: 'input' })
  | (React.TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' });

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (props, ref) => {
    // ⭐ CRÍTICO: text-foreground DEBE estar aquí para que el texto sea visible
    const baseClasses = `
      flex h-10 w-full rounded-md 
      border border-input 
      bg-background 
      px-3 py-2 
      text-sm text-foreground
      ring-offset-background 
      file:border-0 file:bg-transparent file:text-sm file:font-medium 
      placeholder:text-muted-foreground 
      focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:cursor-not-allowed disabled:opacity-50
    `.replace(/\s+/g, ' ').trim();
    
    if (props.as === 'textarea') {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          {...props}
          className={`${baseClasses} min-h-[80px] ${props.className || ''}`}
        />
      );
    }
    
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        {...props}
        className={`${baseClasses} ${props.className || ''}`}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };