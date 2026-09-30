import type { Rol } from '$lib/shared/state';

declare global {
  namespace App {
    interface Locals {
      /** Gezet door hooks.server.ts uit het sessiecookie. */
      rol: Rol;
      spelerId: number | null;
      /** Het apparaat: het sessiecookie, of binnen een proefrit het apparaat uit de adresregel. */
      token: string;
      /** De proefrit waar dit verzoek bij hoort, of null voor de echte avond. */
      proef: string | null;
    }
  }
}

export {};
