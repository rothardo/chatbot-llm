// app/api/stream/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { chatId, query } = await req.json();

  // Set headers for streaming
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      try {
        // Use absolute URL with the request's origin
        const origin = req.nextUrl.origin;
        const response = await fetch(`${origin}/api/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, chatId })
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.data;
        
        if (!text) {
          throw new Error('No text received from API');
        }
        
        // Stream the response word by word
        const words = text.split(' ');
        for (const word of words) {
          // Add word and space
          controller.enqueue(encoder.encode(word + ' '));
          // Add artificial delay to simulate typing
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        // Send error message to client
        controller.enqueue(encoder.encode('An error occurred while processing your request. '));
        controller.close();
      }
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}