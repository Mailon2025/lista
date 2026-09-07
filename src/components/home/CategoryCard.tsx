import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  href: string;
  gradient?: string;
}

export function CategoryCard({
  title,
  count,
  icon: Icon,
  href,
  gradient,
}: CategoryCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        'category-card group relative overflow-hidden',
        gradient
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
      </div>

      {/* Icon */}
      <div className="relative p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
      </div>

      {/* Title */}
      <h3 className="relative text-xl md:text-2xl font-bold text-foreground text-center">
        {title}
      </h3>

      {/* Count */}
      <p className="relative text-sm text-muted-foreground">
        {count.toLocaleString()} {count === 1 ? 'item' : 'itens'}
      </p>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </Link>
  );
}
