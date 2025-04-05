import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check if STRIPE_SECRET_KEY exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return NextResponse.json(
        { error: 'Configuration error: Missing Stripe API key' },
        { status: 500 }
      );
    }
    
    // Initialize Stripe with proper error handling
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { amount, projectId, bidId } = body;
    
    if (!amount || !projectId || !bidId) {
      return NextResponse.json(
        { error: 'Missing required parameters (amount, projectId, bidId)' },
        { status: 400 }
      );
    }

    console.log('Creating checkout session with:', { amount, projectId, bidId });

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Project Payment',
              description: `Payment for project ID: ${projectId}`,
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment-success?projectId=${projectId}`,
      cancel_url: `${request.headers.get('origin')}/?canceled=true`,
      metadata: {
        projectId,
        bidId,
      },
    });

    console.log('Checkout session created:', session.id);
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Return a more detailed error
    return NextResponse.json(
      { 
        error: error.message,
        type: error.type,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}