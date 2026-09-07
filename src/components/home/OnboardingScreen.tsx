import { useState, useEffect } from 'react';
import { Play, Loader2, Lightbulb, Settings, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useToast } from '@/hooks/use-toast';

export function OnboardingScreen() {
  const { loadPlaylist, isLoading, playlistUrl: savedPlaylistUrl } = usePlaylist();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'connect' | 'configure'>(savedPlaylistUrl ? 'connect' : 'configure');
  const [playlistUrl, setPlaylistUrl] = useState(savedPlaylistUrl || '');
  const [epgUrl, setEpgUrl] = useState('');

  // Update local state if saved url changes (unlikely here but good practice)
  useEffect(() => {
    if (savedPlaylistUrl) {
      setPlaylistUrl(savedPlaylistUrl);
      if (mode === 'configure' && !playlistUrl) {
          // If we are in configure mode but have no url typed, and a saved one appears, use it? 
          // Actually, let's just respect the saved one for initialization.
      }
    }
  }, [savedPlaylistUrl]);

  const handleConnect = async () => {
    if (!savedPlaylistUrl) return;
    
    try {
      await loadPlaylist(savedPlaylistUrl);
      toast({
        title: 'Sucesso!',
        description: 'Sua lista foi carregada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar lista',
        description: 'Verifique a conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playlistUrl.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira a URL da lista M3U',
        variant: 'destructive',
      });
      return;
    }

    try {
      await loadPlaylist(playlistUrl.trim());
      toast({
        title: 'Sucesso!',
        description: 'Sua lista foi carregada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar lista',
        description: 'Verifique a URL e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and welcome */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary animate-pulse-glow">
              <Play className="w-8 h-8 text-primary-foreground fill-current" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao <span className="text-gradient">StreamPlay</span>!
          </h1>
          <p className="text-muted-foreground">
            {mode === 'connect' ? 'Sua lista está pronta para conectar' : 'Para começar, configure sua lista IPTV'}
          </p>
        </div>

        {mode === 'connect' ? (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
               <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {savedPlaylistUrl}
                  </p>
               </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full h-12 text-lg btn-primary-gradient"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar a Lista'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setMode('configure')}
              disabled={isLoading}
              className="w-full h-12 text-lg border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configuração da Lista
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-url">URL da Lista M3U</Label>
                <Input
                  id="playlist-url"
                  type="url"
                  placeholder="http://example.com/playlist.m3u"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="epg-url">
                  URL do EPG (opcional)
                </Label>
                <Input
                  id="epg-url"
                  type="url"
                  placeholder="http://example.com/epg.xml"
                  value={epgUrl}
                  onChange={(e) => setEpgUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading || !playlistUrl.trim()}
                className="w-full h-12 text-lg btn-primary-gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Conectar'
                )}
              </Button>
              
              {savedPlaylistUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('connect')}
                  className="w-full"
                >
                  Voltar
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Tip */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Dica:</strong> Cole a URL M3U
              fornecida pelo seu provedor de IPTV. A URL geralmente termina com
              .m3u ou .m3u8
            </p>
          </div>
        </div>

        {/* Legal */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Este aplicativo é um player de mídia. O usuário é responsável por
          utilizar apenas listas M3U de provedores legítimos.
        </p>
      </div>
    </div>
  );
}
