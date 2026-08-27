type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(req: Req): string | null {
  const h = firstHeader(req.headers["authorization"]) || firstHeader(req.headers["Authorization"]);
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function json(res: Res, status: number, data: any) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}

export default async function handler(req: Req, res: Res) {
  try {
    json(res, 410, { success: false, error: "This endpoint has been replaced by /api/newsletter-sender-profiles" });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
