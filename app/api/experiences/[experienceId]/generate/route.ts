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
  console.log("=== Starting Image Generation Request ===");
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

    // Process the image with sharp
    console.log("Processing image with sharp...");
    const processedImage = await sharp(buffer)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();
    console.log("Processed image size:", processedImage.length);

    // Create a temporary file for OpenAI
    const tempFile = new File([processedImage], "image.png", {
      type: "image/png",
    });
    console.log("Temp file created:", {
      name: tempFile.name,
      type: tempFile.type,
      size: tempFile.size,
    });

    // Generate image using DALL-E
    console.log("Calling OpenAI API...");
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt:
        "Transform this image into a beautiful artistic version while maintaining the main subject",
      n: 1,
      size: "1024x1024",
    });
    console.log("OpenAI Response:", JSON.stringify(response, null, 2));

    if (!response.data?.[0]?.url) {
      console.log("Error: No image URL in response");
      throw new Error("No image URL returned from OpenAI");
    }

    console.log("Successfully generated image URL:", response.data[0].url);
    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error: any) {
    console.error("=== Error Details ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    if (error?.response) {
      console.error("Error response:", JSON.stringify(error.response, null, 2));
    }
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
