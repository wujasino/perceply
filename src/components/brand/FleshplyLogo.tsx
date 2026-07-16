import { cn } from '@/lib/utils';
import { FleshplyMark } from './FleshplyMark';

interface FleshplyLogoProps {
  /** Size of the mark in px. */
  size?: number;
  /** Extra classes for the wordmark text (e.g. text size). */
  textClassName?: string;
  /** Hide the "fleshply" wordmark, showing only the mark. */
  markOnly?: boolean;
  className?: string;
}

/**
 * The fleshply brand lockup: the mark plus the "fleshply" wordmark. The mark
 * inherits the current text colour, so the lockup adapts to light/dark.
 */
export const FleshplyLogo = ({ size = 24, textClassName, markOnly = false, className }: FleshplyLogoProps) => (
  <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
    <FleshplyMark size={size} className="shrink-0" />
    {!markOnly && (
      <span className={cn('font-display font-semibold tracking-tight lowercase', textClassName)}>
        fleshply
      </span>
    )}
  </span>
);

export default FleshplyLogo;
