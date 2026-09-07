import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { PinInput } from '@/components/common/PinInput';
import { Button } from '@/components/ui/button';
import { useParental } from '@/contexts/ParentalContext';

interface ParentalLockOverlayProps {
  isOpen: boolean;
  onUnlock: () => void;
  onCancel: () => void;
}

export function ParentalLockOverlay({
  isOpen,
  onUnlock,
  onCancel,
}: ParentalLockOverlayProps) {
  const { unlock } = useParental();
  const [error, setError] = useState(false);

  const handlePinComplete = (pin: string) => {
    if (unlock(pin)) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} showCloseButton={false} size="sm">
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Conteúdo Bloqueado
          </h3>
          <p className="text-sm text-muted-foreground">
            Digite o PIN para continuar:
          </p>
        </div>

        <PinInput
          length={4}
          onComplete={handlePinComplete}
          error={error}
        />

        {error && (
          <p className="text-sm text-destructive">PIN incorreto. Tente novamente.</p>
        )}

        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancelar
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Esqueceu o PIN? Acesse as configurações para redefinir.
        </p>
      </div>
    </Modal>
  );
}

export function ParentalBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          Bloqueado
        </span>
      </div>
    </div>
  );
}
