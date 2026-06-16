'use client';

type EventHandler = (...args: any[]) => void;

class BrowserEventEmitter {
  private listeners: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(event, handlers.filter(h => h !== handler));
  }

  emit(event: string, ...args: any[]) {
    (this.listeners.get(event) ?? []).forEach(h => h(...args));
  }
}

export const errorEmitter = new BrowserEventEmitter();
