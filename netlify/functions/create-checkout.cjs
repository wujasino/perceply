const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


module.exports.handler = async (event) => {
  // Obsługa tylko POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: 'Method Not Allowed',
      }),
    };
  }

  try {
    // Sprawdzenie klucza Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    // Parsowanie body
    const body = JSON.parse(event.body || '{}');

    const { priceId, userId, userEmail } = body;

    // Walidacja danych
    if (!priceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Missing priceId',
        }),
      };
    }

    // Pobranie origin
    let origin = 'https://bitbrew.pl';

    try {
      origin =
        event.headers?.origin ||
        (event.headers?.referer
          ? new URL(event.headers.referer).origin
          : null) ||
        process.env.URL ||
        origin;
    } catch (e) {
      console.warn('Could not parse origin');
    }

    // Tworzenie sesji Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      payment_method_types: ['card'],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: userEmail || undefined,

      metadata: {
        userId: userId || '',
        priceId,
      },

      success_url: `${origin}/cennik?success=true&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${origin}/cennik?canceled=true`,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message || 'Internal Server Error',
      }),
    };
  }
};