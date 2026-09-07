import React, { useState } from 'react';
import { List, Calendar, Shield, Info, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useParental } from '@/contexts/ParentalContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { playlist, isLoading, loadPlaylist, playlistUrl } = usePlaylist();
  const { settings, updateEpgUrl } = useSettings();
  const {
    isParentalEnabled,
    enableParental,
    disableParental,
    changePin,
    validatePin,
  } = useParental();
  const { toast } = useToast();

  const [playlistInput, setPlaylistInput] = useState(playlistUrl);
  const [epgInput, setEpgInput] = useState(settings.epgUrl);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLoadPlaylist = async () => {
    if (!playlistInput.trim()) {
      toast({
        title: 'Erro',
        description: 'URL da playlist não pode estar vazia',
        variant: 'destructive',
      });
      return;
    }

    try {
      await loadPlaylist(playlistInput.trim());
      toast({
        title: 'Sucesso',
        description: 'Playlist carregada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar playlist. Verifique a URL.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEpg = () => {
    updateEpgUrl(epgInput.trim());
    toast({
      title: 'Sucesso',
      description: 'URL do EPG atualizada!',
    });
  };

  const handleToggleParental = () => {
    if (isParentalEnabled) {
      const pin = prompt('Digite o PIN atual para desativar:');
      if (pin && disableParental(pin)) {
        toast({
          title: 'Controle Parental',
          description: 'Controle parental desativado',
        });
      } else if (pin) {
        toast({
          title: 'Erro',
          description: 'PIN incorreto',
          variant: 'destructive',
        });
      }
    } else {
      enableParental();
      toast({
        title: 'Controle Parental',
        description: 'Controle parental ativado',
      });
    }
  };

  const handleChangePin = () => {
    setPinError('');

    if (!validatePin(currentPin)) {
      setPinError('PIN atual incorreto');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('O novo PIN deve ter entre 4 e 6 dígitos');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Os PINs não coincidem');
      return;
    }

    if (changePin(currentPin, newPin)) {
      toast({
        title: 'Sucesso',
        description: 'PIN alterado com sucesso!',
      });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinError('Erro ao alterar PIN');
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Configurações" size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Playlist Configuration */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <List className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Playlist</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="playlist-url">URL da Lista M3U</Label>
              <Input
                id="playlist-url"
                type="url"
                placeholder="http://example.com/playlist.m3u"
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleLoadPlaylist}
              disabled={isLoading}
              className="w-full btn-primary-gradient"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Lista
                </>
              )}
            </Button>
          </div>
        </section>

        <Separator />

        {/* EPG Configuration */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">EPG (Guia de Programação)</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="epg-url">URL do EPG (opcional)</Label>
              <Input
                id="epg-url"
                type="url"
                placeholder="http://example.com/epg.xml"
                value={epgInput}
                onChange={(e) => setEpgInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleUpdateEpg} variant="outline" className="w-full">
              Atualizar EPG
            </Button>
          </div>
        </section>

        <Separator />

        {/* Parental Control */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Controle Parental</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="parental-toggle">Controle Parental</Label>
              <Switch
                id="parental-toggle"
                checked={isParentalEnabled}
                onCheckedChange={handleToggleParental}
              />
            </div>

            {isParentalEnabled && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">Alterar Senha:</p>
                <div>
                  <Label htmlFor="current-pin">Senha Atual</Label>
                  <Input
                    id="current-pin"
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-pin">Nova Senha</Label>
                  <Input
                    id="new-pin"
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-pin">Confirmar Senha</Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="mt-1"
                  />
                </div>
                {pinError && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
                <Button onClick={handleChangePin} variant="outline" className="w-full">
                  Salvar Nova Senha
                </Button>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Information */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canais carregados:</span>
              <span className="font-medium">
                {playlist?.liveTV.length.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Séries:</span>
              <span className="font-medium">
                {playlist?.series.length.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filmes:</span>
              <span className="font-medium">
                {playlist?.movies.length.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última atualização:</span>
              <span className="font-medium">
                {formatDate(settings.lastUpdated)}
              </span>
            </div>
          </div>
        </section>

        {/* Legal Disclaimer */}
        <div className="p-3 bg-secondary rounded-lg text-xs text-muted-foreground">
          <strong>AVISO:</strong> Este aplicativo é um player de mídia. Não fornecemos,
          hospedamos ou distribuímos conteúdo. O usuário é responsável por utilizar
          apenas listas M3U de provedores legítimos e autorizados.
        </div>

        <Button onClick={onClose} variant="outline" className="w-full">
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
