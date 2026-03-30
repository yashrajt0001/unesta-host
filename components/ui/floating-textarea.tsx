import * as React from 'react';
import { cn } from '@/lib/utils';

interface FloatingTextareaProps extends React.ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        <div className="relative">
          <textarea
            ref={ref}
            placeholder=" "
            data-slot="textarea"
            aria-invalid={!!error || undefined}
            className={cn(
              'peer min-h-[7rem] w-full rounded-lg border border-input bg-transparent px-3.5 pt-6 pb-2 text-base shadow-xs transition-all duration-200 outline-none placeholder:text-transparent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
              'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
              className,
            )}
            {...props}
          />
          <label
            className={cn(
              'pointer-events-none absolute left-3.5 top-4 text-sm text-muted-foreground transition-all duration-200',
              'peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium',
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
FloatingTextarea.displayName = 'FloatingTextarea';

export { FloatingTextarea };
