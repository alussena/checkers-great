import express from 'express';
import http from 'http';
import cors from 'cors';
import { setupSocket } from './socket';
import { supabase } from './db';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

app.post('/create-checkout-session', async (req, res) => {
  const { userId } = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: 'price_...',
      quantity: 1,
    }],
    success_url: `${process.env.CLIENT_URL}/profile?pro=success`,
    cancel_url: `${process.env.CLIENT_URL}/pro`,
    client_reference_id: userId,
  });
  res.json({ url: session.url });
});

// Webhook для Stripe (упрощённо)
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await supabase.from('users').update({ is_pro: true }).eq('id', session.client_reference_id);
  }
  res.json({received: true});
});

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));