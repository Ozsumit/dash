import { NextResponse } from "next/server";

/**
 * Simple proxy to fetch external images (e.g., Google Drive)
 * Returns image as a stream so the browser can render it.
 */
export async function GET(request: Request) {
  try {
    const urlParam = new URL(request.url).searchParams.get("url");
    if (!urlParam) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    const decodedUrl = decodeURIComponent(urlParam);

    // Fetch the external image
    const res = await fetch(decodedUrl, {
      headers: {
        // Optional: Some images need user-agent to bypass restrictions
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch external image" },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // cache for 1 day
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
