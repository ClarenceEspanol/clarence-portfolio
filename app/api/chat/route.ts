import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { contents, system_instruction } = await request.json();

    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in .env" },
        { status: 500 }
      );
    }

    // Convert Gemini-style contents → Groq/OpenAI messages format
    const messages = [
      {
        role: "system",
        content:
          system_instruction?.parts?.map((p: { text: string }) => p.text).join("") ?? "",
      },
      ...contents.map((c: { role: string; parts: { text: string }[] }) => ({
        role: c.role === "model" ? "assistant" : "user",
        content: c.parts.map((p) => p.text).join(""),
      })),
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: data?.error?.message || "Groq API Error" },
        { status: response.status }
      );
    }

    // Return in Gemini-compatible shape so ai-chatbot.tsx needs ZERO changes
    return NextResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text:
                  data?.choices?.[0]?.message?.content ?? "No response generated.",
              },
            ],
          },
        },
      ],
    });
  } catch (error: any) {
    console.error("Server crash:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}