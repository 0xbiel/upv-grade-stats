import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { payload, ttlSeconds } = (await req.json()) as {
      payload?: string;
      ttlSeconds?: number;
    };
    if (!payload || typeof payload !== "string") {
      return new Response(JSON.stringify({ error: "Missing payload" }), { status: 400 });
    }

    const ttl = Math.min(Math.max(Number(ttlSeconds) || 0, 60), 60 * 60 * 24 * 30) || 60 * 60 * 24 * 7; // default 7d
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    const { data, error } = await supabase
      .from("grade_shares")
      .insert({ payload, expires_at: expiresAt })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id, expiresAt }), { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });

    const { data, error } = await supabase
      .from("grade_shares")
      .select("payload, expires_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Expired" }), { status: 410 });
    }

    return new Response(JSON.stringify({ payload: data.payload, expiresAt: data.expires_at }), { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
