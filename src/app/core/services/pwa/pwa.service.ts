import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Reactive state signals
  readonly canInstall = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly updateAvailable = signal<boolean>(false);
  readonly isIos = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initInstallState();
      this.initUpdateChecker();
    }
  }

  private initInstallState(): void {
    // Check if already in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    this.isInstalled.set(Boolean(isStandalone));

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !isStandalone;
    this.isIos.set(isIosDevice);

    // Listen for the PWA install prompt event
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    // Listen for completed installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  private initUpdateChecker(): void {
    if (!this.swUpdate?.isEnabled) {
      return;
    }

    // Listen for new version downloaded and ready
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable.set(true);
      });
  }

  /**
   * Triggers the native installation prompt
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      const accepted = choice.outcome === 'accepted';
      this.deferredPrompt = null;
      this.canInstall.set(false);
      return accepted;
    } catch {
      return false;
    }
  }

  /**
   * Reloads the application to activate the newly downloaded version
   */
  async activateUpdate(): Promise<void> {
    if (this.swUpdate?.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }
}
