import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.HommieCare.app',
  appName: 'HommieCare',
  webDir: 'dist',
  server: {
    url: 'https://HommieCare.vercel.app/',
    cleartext: true
  }
};

export default config;