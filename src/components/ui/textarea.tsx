import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, id, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        {...props}
        className={cn('havk-field min-h-28 resize-y px-3 py-2.5 text-sm', className)}
      />
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
