import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

export async function processImageForCloudflare(
  localUri: string
): Promise<{ uri: string; type: string }> {
  // 1) Inspect the file
  // We'll read it from disk to see its size
  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error("File does not exist at URI: " + localUri);
  }
  let { size } = fileInfo; // size in bytes
  // We can also get dimensions with ImageManipulator (or from expo-image-picker's result)
  // but let's do it in the same step we do manipulations.

  // 2) If the file is HEIC or other unsupported format, we'll convert to JPEG or WebP
  // We can detect by extension or by checking the exif data. For simplicity:
  const extension = localUri.split(".").pop()?.toLowerCase();
  let format: ImageManipulator.SaveFormat = ImageManipulator.SaveFormat.JPEG;
  if (extension === "webp") {
    format = ImageManipulator.SaveFormat.WEBP;
  }
  // if it's heic or heif, definitely switch to JPEG or WEBP
  if (extension === "heic" || extension === "heif") {
    format = ImageManipulator.SaveFormat.JPEG;
  }

  // We'll do an initial manipulation to ensure we have a valid format
  let actions: ImageManipulator.Action[] = [];
  // no resizing yet, just convert format
  // you might also want to do { resize: { width: something, height: something } }
  // but let's do that only if needed after checking dimension below.

  let result = await ImageManipulator.manipulateAsync(localUri, actions, {
    compress: 1.0, // compression quality (1.0 = max quality)
    format: format, // convert format if needed
    base64: false,
  });

  // 3) Now check the new file's size & dimensions
  let newFileInfo = await FileSystem.getInfoAsync(result.uri, {});
  if (!newFileInfo.exists) {
    throw new Error("File does not exist at URI: " + result.uri);
  }
  let newSize = newFileInfo.size ?? 0;

  // we can get the width and height from result:
  let { width, height } = result;
  let area = width * height;

  // 4) Check Cloudflare limits:
  // - max dimension: 12,000 px
  // - max area: 100,000,000 (100 MP)
  // - max size: 10 MB (10 * 1024 * 1024 bytes)
  // If any are exceeded, we do further manipulations (resize/compress).
  const MAX_DIM = 12000;
  const MAX_AREA = 100_000_000;
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;

  // If dimension or area is too large, we scale it down proportionally
  if (width > MAX_DIM || height > MAX_DIM || area > MAX_AREA) {
    // figure out scale factor
    // For example, if width=15000, height=8000 => 120 million px area => bigger than 100 MP
    // We'll reduce it so max dimension is 12000
    // or area <= 100 MP. We'll pick whichever scale factor is more strict
    const scaleDim = Math.min(MAX_DIM / width, MAX_DIM / height);
    const scaleArea = Math.sqrt(MAX_AREA / area);

    const scale = Math.min(scaleDim, scaleArea);

    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);

    result = await ImageManipulator.manipulateAsync(
      result.uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      {
        compress: 1.0,
        format,
        base64: false,
      }
    );
    newFileInfo = await FileSystem.getInfoAsync(result.uri, {});
    if (!newFileInfo.exists) {
      throw new Error("File does not exist at URI: " + result.uri);
    }
    newSize = newFileInfo.size ?? 0;
  }

  // If STILL bigger than 10MB, we compress
  // We'll do a loop that gradually compresses until below 10MB or min threshold
  let currentQuality = 1.0;
  while (newSize > MAX_SIZE_BYTES && currentQuality > 0.1) {
    currentQuality = currentQuality - 0.1; // reduce quality
    result = await ImageManipulator.manipulateAsync(result.uri, [], {
      compress: currentQuality,
      format,
      base64: false,
    });
    newFileInfo = await FileSystem.getInfoAsync(result.uri, {});
    if (!newFileInfo.exists) {
      throw new Error("File does not exist at URI: " + result.uri);
    }
    newSize = newFileInfo.size ?? 0;
    // keep going until newSize <= 10MB or we fall below 0.1 quality
  }

  // after all that, result.uri is our final image
  // The mime type will be "image/jpeg" or "image/webp"
  const finalMimeType =
    format === ImageManipulator.SaveFormat.WEBP ? "image/webp" : "image/jpeg";

  return {
    uri: result.uri,
    type: finalMimeType,
  };
}
