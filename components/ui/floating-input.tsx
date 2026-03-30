import * as React from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            placeholder=" "
            data-slot="input"
            aria-invalid={!!error || undefined}
            className={cn(
              'peer h-[3.25rem] w-full min-w-0 rounded-lg border border-input bg-transparent px-3.5 pt-5 pb-1.5 text-base shadow-xs transition-all duration-200 outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
              className,
            )}
            {...props}
          />
          <label
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200',
              'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium',
              error && 'peer-focus:text-destructive peer-[:not(:placeholder-shown)]:text-destructive',
            )}
          >
            {label}
          </label>
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
