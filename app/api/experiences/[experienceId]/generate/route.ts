import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: { experienceId: string } }
) {
  console.log("=== Starting Alt Text Generation Request ===");
  const { experienceId } = await Promise.resolve(params);
  console.log("Request params:", JSON.stringify({ experienceId }, null, 2));
  console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

  try {
    console.log("Experience ID:", experienceId);

    if (!experienceId) {
      console.log("Error: Missing experienceId");
      return NextResponse.json(
        { error: "Missing experienceId" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    console.log("FormData keys:", Array.from(formData.keys()));

    const file = formData.get("file") as File;
    console.log(
      "File received:",
      file
        ? {
            name: file.name,
            type: file.type,
            size: file.size,
          }
        : "No file"
    );

    if (!file) {
      console.log("Error: No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer size:", buffer.length);

    // Process the image with sharp to optimize for vision analysis
    console.log("Processing image with sharp...");
    const processedImage = await sharp(buffer)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 85 }) // Convert to JPEG for better compatibility
      .toBuffer();
    console.log("Processed image size:", processedImage.length);

    // Convert processed image to base64 for OpenAI Vision API
    const base64Image = processedImage.toString("base64");
    console.log("Base64 image created, ready for vision analysis");

    // Generate alt text using GPT-4o (current model)
    console.log("Calling OpenAI GPT-4o Vision API...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please generate a detailed, descriptive alt text for this image. The alt text should be concise but comprehensive, describing the main subjects, their actions, the setting, and any important visual details that would help someone who cannot see the image understand what it contains. Focus on being factual and descriptive rather than interpretive.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    console.log("OpenAI Vision Response:", JSON.stringify(response, null, 2));

    const altText = response.choices?.[0]?.message?.content;

    if (!altText) {
      console.log("Error: No alt text generated");
      throw new Error("No alt text returned from OpenAI");
    }

    console.log("Successfully generated alt text:", altText);
    return NextResponse.json({
      altText: altText.trim(),
      experienceId,
    });
  } catch (error: any) {
    console.error("=== Error Details ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    if (error?.response) {
      console.error("Error response:", JSON.stringify(error.response, null, 2));
    }

    return NextResponse.json(
      {
        error: "Failed to generate alt text",
        details: error?.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
