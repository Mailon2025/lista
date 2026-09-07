import { AlertCircle, XCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'network';
  onRetry?: () => void;
  className?: string;
}

const icons = {
  error: XCircle,
  warning: AlertCircle,
  network: WifiOff,
};

const colors = {
  error: 'text-destructive',
  warning: 'text-warning',
  network: 'text-muted-foreground',
};

export function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  className,
}: ErrorMessageProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
    >
      <Icon className={cn('w-12 h-12', colors[type])} />
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      <p className="text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Icon className="w-16 h-16 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-md">{message}</p>
      {action}
    </div>
  );
}
