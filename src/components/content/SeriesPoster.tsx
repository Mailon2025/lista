import { useState, useEffect } from 'react';
import { fetchSeriesPoster } from '@/services/metadata';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeriesPosterProps {
  seriesName: string;
  originalLogo?: string;
  className?: string;
  alt?: string;
}

/**
 * Verifica se uma URL de logo parece ser um thumbnail de stream (inválido)
 * ao invés de um poster real
 */
function isInvalidThumbnail(url: string | undefined): boolean {
  if (!url) return true;
  
  const lowerUrl = url.toLowerCase();
  
  // URLs que indicam thumbnail de stream
  const invalidPatterns = [
    '/live/',
    '/stream/',
    '/ts/',
    '/play/',
    '.ts',
    'thumbnail',
    'thumb',
    '/movie/',  // às vezes usado para séries erroneamente
    'nixonline',
    'get.php',
    ':8080',
    ':8000',
    ':25461',
    ':80/',
  ];
  
  // Se contém algum padrão inválido
  if (invalidPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }
  
  // Se não parece ser uma URL de imagem
  const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const hasValidExtension = validImageExtensions.some(ext => 
    lowerUrl.includes(ext)
  );
  
  // URLs de APIs de imagem conhecidas são válidas
  const knownImageAPIs = [
    'tmdb.org',
    'themoviedb.org',
    'image.tmdb',
    'imdb.com',
    'amazonaws.com',
    'cloudfront.net',
    'imgur.com',
    'tvdb.com',
    'thetvdb.com',
    'fanart.tv',
  ];
  
  if (knownImageAPIs.some(api => lowerUrl.includes(api))) {
    return false; // É válido
  }
  
  // Se não tem extensão de imagem e não é de API conhecida, provavelmente é inválido
  return !hasValidExtension;
}

export function SeriesPoster({ 
  seriesName, 
  originalLogo, 
  className = '',
  alt 
}: SeriesPosterProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadPoster() {
      setIsLoading(true);
      setHasError(false);
      
      // Define o logo original como inicial (se existir)
      if (originalLogo) {
        setPosterUrl(originalLogo);
        // Não define isLoading false ainda se vamos buscar no TMDB
        // Mas se quisermos mostrar o original enquanto carrega:
        setIsLoading(false); 
      }

      // SEMPRE busca no TMDB para garantir a melhor capa (vertical)
      // A menos que o usuário tenha desativado isso (futura config)
      try {
        const tmdbPoster = await fetchSeriesPoster(seriesName);
        
        if (isMounted) {
          if (tmdbPoster) {
            setPosterUrl(tmdbPoster);
          } else if (!originalLogo) {
            // Se não achou no TMDB e não tinha original
            setPosterUrl(null);
          }
          // Se não achou no TMDB mas tinha original, mantém o original (já setado)
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          // Mantém o original em caso de erro
          setIsLoading(false);
        }
      }
    }
    
    loadPoster();
    
    return () => {
      isMounted = false;
    };
  }, [seriesName, originalLogo]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("bg-background-tertiary animate-pulse", className)}>
        <div className="w-full h-full bg-gradient-to-br from-background-secondary to-background-tertiary" />
      </div>
    );
  }

  // Sem poster (ou erro)
  if (!posterUrl || hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-background-tertiary', className)}>
        <Play className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }

  // Com poster
  return (
    <img
      src={posterUrl}
      alt={alt || seriesName}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={() => {
        setHasError(true);
        setPosterUrl(null);
      }}
    />
  );
}
