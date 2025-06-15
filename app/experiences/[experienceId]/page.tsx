import { ImageUploader } from "@/app/components/image-uploader";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Image Generator</h1>
        <p className="text-gray-600 mb-8">
          Upload an image and let our AI transform it into a beautiful artistic
          version while maintaining the main subject.
        </p>
        <ImageUploader experienceId={experienceId} />
      </div>
    </main>
  );
}
