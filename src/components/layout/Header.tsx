import { Link, useLocation } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onSettingsClick?: () => void;
}

export function Header({ title, showBack = false, onSettingsClick }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBack && !isHome && (
            <Link
              to={-1 as any}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          
          <Link to="/" className="flex items-center gap-2">
            <img
              src="./cadene-icon.png"
              alt="Cadene"
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-xl font-bold text-foreground">
              {title || 'Cadene Filmes e Series'}
            </span>
          </Link>
        </div>

        {/* Right side */}
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
