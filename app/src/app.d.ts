import type { Rol } from '$lib/shared/state';

declare global {
  namespace App {
    interface Locals {
      /** Gezet door hooks.server.ts uit het sessiecookie. */
      rol: Rol;
      spelerId: number | null;
    }
  }
}

export {};
