# PWA Setup Guide for GETEDIL

This guide walks you through setting up Progressive Web App (PWA) features including offline support, installability, and push notifications.

## ✅ Completed Setup

Your VAPID keys have been configured:
- **Public Key**: `BEfCob16WENoZIbYf6j34K9wlWZBcyYiI6Ue9pvnqIk1pr9NMouZxoeC1et7yJMmfTO-jbSXPQiIEMysc29rJ3s`
- **Private Key**: `wsUOLyT73mC7By3mEl48VZJiaP7Y_1hgR3z1yZirvtg`

## 📋 Prerequisites

1. Node.js 18+ installed
2. Backend server capable of handling API routes
3. HTTPS enabled in production (required for service workers)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

Required packages (already in package.json):
- `vite-plugin-pwa`
- `workbox-window`
- `web-push` (for backend)

### 2. Environment Variables

Create a `.env` file in `apps/web/`:

```bash
cp .env.example .env
```

The `.env.example` already contains your VAPID keys. Update the subject email:

```env
VAPID_PUBLIC_KEY="BEfCob16WENoZIbYf6j34K9wlWZBcyYiI6Ue9pvnqIk1pr9NMouZxoeC1et7yJMmfTO-jbSXPQiIEMysc29rJ3s"
VAPID_PRIVATE_KEY="wsUOLyT73mC7By3mEl48VZJiaP7Y_1hgR3z1yZirvtg"
VAPID_SUBJECT="mailto:your-email@example.com"
```

### 3. Replace Placeholder Icons (Optional)

SVG icons have been created as placeholders. For production, replace with PNG files:

```
apps/web/public/icons/icon-192x192.png
apps/web/public/icons/icon-512x512.png
```

Recommended tools:
- [Figma](https://figma.com) for design
- [RealFaviconGenerator](https://realfavicongenerator.net) for generation

### 4. Build and Run

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

## 🔔 Push Notifications Backend Setup

### Option A: Express.js

1. Install dependencies:
```bash
npm install express web-push mongoose cors body-parser
```

2. Create `server.js`:
```javascript
import express from 'express';
import webPush from 'web-push';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Configure VAPID
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions in memory (use database in production)
let subscriptions = [];

app.post('/api/notifications/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ success: true });
});

app.delete('/api/notifications/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  res.json({ success: true });
});

app.post('/api/notifications/send', async (req, res) => {
  const { title, body, url } = req.body;
  
  const payload = JSON.stringify({ title, body, url });
  
  const results = await Promise.allSettled(
    subscriptions.map(sub => 
      webPush.sendNotification(sub, payload)
    )
  );
  
  res.json({ success: true, sent: results.length });
});

app.listen(3001, () => console.log('Server running on port 3001'));
```

### Option B: Next.js API Routes

Create these files in your Next.js project:

**`app/api/notifications/subscribe/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PushSubscription } from 'web-push';

export async function POST(request: NextRequest) {
  const subscription: PushSubscription = await request.json();
  
  // Save to database
  // await db.pushSubscription.create({ data: subscription });
  
  return NextResponse.json({ success: true });
}
```

**`app/api/notifications/unsubscribe/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json();
  
  // Remove from database
  // await db.pushSubscription.deleteMany({ where: { endpoint } });
  
  return NextResponse.json({ success: true });
}
```

**`app/api/notifications/send/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  const { title, body, url } = await request.json();
  
  // Fetch subscriptions from database
  // const subscriptions = await db.pushSubscription.findMany();
  
  const payload = JSON.stringify({ title, body, url });
  
  // Send notifications
  // await Promise.all(subscriptions.map(sub => 
  //   webPush.sendNotification(sub, payload)
  // ));
  
  return NextResponse.json({ success: true });
}
```

## 🧪 Testing PWA Features

### 1. Install Prompt
1. Open your app in Chrome/Edge
2. Look for the install icon in the address bar
3. Click "Install" to add to home screen
4. The app should open in a standalone window

### 2. Offline Support
1. Open DevTools → Network tab
2. Check "Offline"
3. Refresh the page
4. You should see the offline page

### 3. Push Notifications
1. Click "Enable Notifications" in the app
2. Grant permission when prompted
3. Use your backend to send a test notification:

```bash
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello from PWA!","url":"/"}'
```

### 4. Lighthouse Audit
1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Run audit
4. Aim for 100% score

## 📱 Mobile Testing

### iOS Safari
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Note: Push notifications require iOS 16.4+

### Android Chrome
1. Open app in Chrome
2. Tap menu (⋮) → "Install app"
3. Or wait for install prompt to appear

## 🔧 Troubleshooting

### Service Worker Not Registering
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Clear service worker cache: DevTools → Application → Service Workers → Unregister

### Push Notifications Not Working
- Verify VAPID keys match between frontend and backend
- Check browser permission status
- Ensure backend is sending correct payload format
- Test with [web-push-testing-service](https://github.com/WebPushFCM/web-push-testing-service)

### Install Prompt Not Showing
- User must interact with site first (click, scroll, etc.)
- Must be served over HTTPS
- Manifest must meet requirements (icons, name, start_url)
- Check `beforeinstallprompt` event in console

### Icons Not Displaying
- Ensure icons are accessible at specified paths
- Use PNG format for best compatibility
- Minimum size: 192x192 and 512x512
- Check manifest.json icon paths

## 📚 Additional Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Push API Spec](https://w3c.github.io/push-api/)

## 🎯 Next Steps

1. Implement database persistence for subscriptions
2. Add user authentication for targeted notifications
3. Create notification preferences UI
4. Set up analytics for notification engagement
5. Implement background sync for offline actions
6. Add periodic background sync (where supported)

---

**Need Help?** Check the browser console and network tab for debugging information.
