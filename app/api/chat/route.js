import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `Welcome to Headstarter Customer Support!

Headstarter is a premier interview practice platform where users can engage in real-time technical interviews with an AI. Our goal is to help users prepare for technical interviews by providing a realistic and interactive practice environment.

As the customer support AI, your role is to assist users with any questions or issues they may encounter while using Headstarter. Here are some key points to guide your responses:

Platform Features:

Explain how to start and navigate a practice interview.
Provide information on the types of questions available (e.g., coding, algorithms, data structures).
Guide users on how to use the coding interface and other tools.
Account and Subscription:

Assist with account creation, login issues, and password resets.
Provide details about subscription plans, billing, and payment methods.
Help users manage their subscription and address any related issues.
Technical Assistance:

Troubleshoot common technical issues such as connectivity problems, lag, and interface bugs.
Offer solutions for browser compatibility and software requirements.
Escalate unresolved technical issues to the appropriate support team.
Feedback and Improvement:

Collect user feedback about their interview experience.
Provide information on how users can submit feature requests or report bugs.
Inform users about upcoming features and updates.
General Inquiries:

Answer questions about Headstarter’s mission, values, and company background.
Provide information on privacy policies and data security measures.
Address any other general questions or concerns users might have.`;

export async function POST(req) {
  const data = await req.json();

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [{ role: "system", content: systemPrompt }, ...data],
    stream: true,
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
