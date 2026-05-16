/**
 * Backend Implementation for Push Notification Subscription Management
 * 
 * This file provides example backend endpoints for managing push notification subscriptions.
 * Implement these endpoints in your backend server (Node.js/Express, Next.js API routes, etc.)
 */

import express from 'express';
import { PushSubscription } from 'web-push';

const router = express.Router();

// Database models would go here (MongoDB, PostgreSQL, etc.)
// Example MongoDB schema:
/*
const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: Date.now }
});
*/

/**
 * POST /api/notifications/subscribe
 * Save a new push subscription
 */
router.post('/subscribe', async (req: express.Request, res: express.Response) => {
  try {
    const subscription: PushSubscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // TODO: Implement database save logic
    // Example: await PushSubscriptionModel.findOneAndUpdate(
    //   { endpoint: subscription.endpoint },
    //   { ...subscription, lastUsed: new Date() },
    //   { upsert: true, new: true }
    // );

    console.log('Saving subscription:', subscription.endpoint);
    
    res.status(201).json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * DELETE /api/notifications/unsubscribe
 * Remove a push subscription
 */
router.delete('/unsubscribe', async (req: express.Request, res: express.Response) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    // TODO: Implement database delete logic
    // Example: await PushSubscriptionModel.deleteOne({ endpoint });

    console.log('Removing subscription:', endpoint);
    
    res.json({ success: true, message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

/**
 * GET /api/notifications/subscriptions
 * Get all subscriptions for a user (optional, for admin purposes)
 */
router.get('/subscriptions', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // TODO: Implement database query logic
    // Example: const subscriptions = await PushSubscriptionModel.find({ userId });

    res.json({ subscriptions: [] });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * POST /api/notifications/send
 * Send a push notification to subscribers
 * This should be called by your application logic when you want to send notifications
 */
router.post('/send', async (req: express.Request, res: express.Response) => {
  try {
    const { title, body, url, userId } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // TODO: Fetch subscriptions from database
    // Example: const subscriptions = await PushSubscriptionModel.find({ 
    //   userId: userId || { $exists: true } // Send to all if no userId specified
    // });

    // TODO: Use web-push library to send notifications
    // import webPush from 'web-push';
    // 
    // webPush.setVapidDetails(
    //   process.env.VAPID_SUBJECT!,
    //   process.env.VAPID_PUBLIC_KEY!,
    //   process.env.VAPID_PRIVATE_KEY!
    // );
    //
    // const payload = JSON.stringify({
    //   title,
    //   body,
    //   url: url || '/'
    // });
    //
    // const results = await Promise.allSettled(
    //   subscriptions.map(sub => 
    //     webPush.sendNotification(sub, payload)
    //   )
    // );

    console.log('Sending notification:', { title, body, url });
    
    res.json({ 
      success: true, 
      message: 'Notification sent successfully',
      sent: 0 // Replace with actual count
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install dependencies:
 *    npm install express web-push mongoose (or your preferred ORM)
 * 
 * 2. Create .env file with your VAPID keys:
 *    VAPID_PUBLIC_KEY=BEfCob16WENoZIbYf6j34K9wlWZBcyYiI6Ue9pvnqIk1pr9NMouZxoeC1et7yJMmfTO-jbSXPQiIEMysc29rJ3s
 *    VAPID_PRIVATE_KEY=wsUOLyT73mC7By3mEl48VZJiaP7Y_1hgR3z1yZirvtg
 *    VAPID_SUBJECT=mailto:your-email@example.com
 * 
 * 3. Mount the router in your Express app:
 *    import notificationRoutes from './lib/pushNotificationBackend';
 *    app.use('/api/notifications', notificationRoutes);
 * 
 * 4. Implement database operations marked with TODO comments
 * 
 * 5. Add cleanup job to remove stale subscriptions:
 *    // Run this periodically (e.g., daily cron job)
 *    const staleSubscriptions = await PushSubscriptionModel.find({
 *      lastUsed: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
 *    });
 *    // Test each subscription and remove failed ones
 */

/**
 * NEXT.JS API ROUTES ALTERNATIVE:
 * 
 * If using Next.js, create these files instead:
 * 
 * - app/api/notifications/subscribe/route.ts
 * - app/api/notifications/unsubscribe/route.ts
 * - app/api/notifications/send/route.ts
 * 
 * Each file exports GET/POST/DELETE functions following Next.js App Router conventions.
 */
