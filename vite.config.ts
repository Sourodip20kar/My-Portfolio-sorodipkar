import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,   // Allows access from phone
    port: 4321,   // Matches your dev port
  },
});
