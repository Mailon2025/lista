import React, { useState } from 'react';
import { Header } from './Header';
import { SettingsModal } from '@/components/settings/SettingsModal';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MainLayout({ children, title, showBack }: MainLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={title}
        showBack={showBack}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <main className="container px-4 py-6">{children}</main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
