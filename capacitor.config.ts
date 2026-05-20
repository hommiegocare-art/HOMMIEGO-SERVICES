import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hommiego.app',
  appName: 'HommieGo',
  webDir: 'dist',
  server: {
    url: 'https://hommiego.vercel.app/',
    cleartext: true
  }
};

export default config;