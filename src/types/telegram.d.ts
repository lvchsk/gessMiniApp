declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready(): void;
        expand(): void;
        requestFullscreen(): void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            is_premium?: boolean;
          };
        };
      };
    };
  }
}

export {};
