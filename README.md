# Cluckingham Guard 🐔

TypeScript full-stack app for streaming Tapo camera video to the web, using an Express server and a SvelteKit client. MediaMTX acts as an intermediary to restream the camera feed.

## Structure

- **server/** – Express + TypeScript API (stream endpoint, health check)  
- **client/** – SvelteKit + TypeScript UI  

## Development

in one terminal:

```bash
cd server
npm install
npm run dev
