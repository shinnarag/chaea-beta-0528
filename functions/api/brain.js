// GET /api/brain — 통합 정전(canon) 조회 엔드포인트 (Cloudflare Worker 경로).
// 단일 원천 data/chaea-brain.json을 번들에 포함하여 반환한다.
// 로컬 dev 서버(server.mjs)는 자체 handleBrain에서 디스크를 읽어 라이브 통계까지 합친다.
import { json, options } from "../_shared/http.js";
import brain from "../../data/chaea-brain.json";

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return options();
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  return json({
    ok: true,
    source: "data/chaea-brain.json",
    version: brain.meta?.version || null,
    updatedAtKst: brain.meta?.updatedAtKst || null,
    brain,
    // worker 환경에서는 라이브 통계(insights/sns-queue)는 각 전용 엔드포인트에서 별도 조회.
    live: null,
  });
}
