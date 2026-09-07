import { useState, useEffect } from 'react';
import { Play, Loader2, Lightbulb, Settings, Link as LinkIcon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';

export function OnboardingScreen() {
  const { loadPlaylist, isLoading, playlistUrl: savedPlaylistUrl } = usePlaylist();
  const { settings, updateCustomWorkerUrl } = useSettings();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'connect' | 'configure'>(savedPlaylistUrl ? 'connect' : 'configure');
  const [playlistUrl, setPlaylistUrl] = useState(savedPlaylistUrl || '');
  const [epgUrl, setEpgUrl] = useState('');
  const [customWorkerUrl, setCustomWorkerUrl] = useState(settings.customWorkerUrl || '');

  // Update local state if saved url changes (unlikely here but good practice)
  useEffect(() => {
    if (savedPlaylistUrl) {
      setPlaylistUrl(savedPlaylistUrl);
    }
  }, [savedPlaylistUrl]);

  useEffect(() => {
    setCustomWorkerUrl(settings.customWorkerUrl || '');
  }, [settings.customWorkerUrl]);

  const workerTrim = customWorkerUrl.trim();

  const handleConnect = async () => {
    if (!savedPlaylistUrl) return;
    
    try {
      updateCustomWorkerUrl(workerTrim);
      await loadPlaylist(savedPlaylistUrl, { customWorkerUrlOverride: workerTrim });
      toast({
        title: 'Sucesso!',
        description: 'Sua lista foi carregada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar lista',
        description: error?.message || 'Verifique a conexão e tente novamente.',
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
      updateCustomWorkerUrl(workerTrim);
      await loadPlaylist(playlistUrl.trim(), { customWorkerUrlOverride: workerTrim });
      toast({
        title: 'Sucesso!',
        description: 'Sua lista foi carregada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar lista',
        description: error?.message || 'Verifique a URL e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and welcome */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="./cadene-icon.png"
              alt="Cadene"
              className="w-16 h-16 rounded-2xl object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.outerHTML = `<div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground fill-current"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg></div>`;
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao <span className="text-gradient">Cadene Filmes e Series</span>!
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

               <div className="space-y-2">
                 <Label htmlFor="worker-url-connect">
                   Proxy CORS (Cloudflare Worker)
                 </Label>
                 <div className="flex gap-2 items-start">
                   <div className="relative flex-1">
                     <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                     <Input
                       id="worker-url-connect"
                       type="url"
                       placeholder="https://seu-worker.workers.dev/"
                       value={customWorkerUrl}
                       onChange={(e) => setCustomWorkerUrl(e.target.value)}
                       className="bg-secondary border-border pl-9"
                     />
                   </div>
                 </div>
                 <p className="text-xs text-destructive">
                   Obrigatório para provedores HTTP (como p1fast.com) rodando em
                   GitHub Pages (HTTPS).
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
                <Label htmlFor="worker-url">
                  Proxy CORS (Cloudflare Worker)
                </Label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="worker-url"
                    type="url"
                    placeholder="https://seu-worker.workers.dev/"
                    value={customWorkerUrl}
                    onChange={(e) => setCustomWorkerUrl(e.target.value)}
                    className="bg-secondary border-border pl-9"
                  />
                </div>
                <p className="text-xs text-destructive">
                  Obrigatório para provedores HTTP (como p1fast.com) em GitHub
                  Pages. Ex: <span className="font-mono">https://lista.maylonsuden4.workers.dev/</span>
                </p>
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
