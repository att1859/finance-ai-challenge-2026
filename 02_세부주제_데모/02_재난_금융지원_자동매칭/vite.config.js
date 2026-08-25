import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { seedDesignPlugin } from "@seed-design/vite-plugin";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const noticeAnalysisSchema = z.object({
  disasterType: z.string(),
  affectedRegions: z.array(z.string()),
  eligibleSubjects: z.array(z.string()),
  supportTypes: z.array(z.string()),
  applicationPeriod: z.string(),
  requiredDocuments: z.array(z.string()),
  processingInstitutions: z.array(z.string()),
  evidenceQuotes: z.array(z.string()),
  summary: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

const customerAnalysisSchema = z.object({
  damageType: z.string(),
  location: z.string(),
  businessType: z.string(),
  damageSeverity: z.string(),
  affectedAssets: z.array(z.string()),
  summary: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("요청 본문이 너무 큽니다."));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function disasterAiPlugin(env) {
  return {
    name: "hangeul-disaster-ai",
    configureServer(server) {
      server.middlewares.use("/api/analyze", async (request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: "POST 요청만 지원합니다." }));
          return;
        }

        if (!env.OPENAI_API_KEY) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: "API 키가 없어 저장된 분석을 사용합니다." }));
          return;
        }

        try {
          const payload = JSON.parse(await readBody(request));
          const isCustomer = payload.type === "customer";
          const schema = isCustomer ? customerAnalysisSchema : noticeAnalysisSchema;
          const formatName = isCustomer ? "customer_damage_analysis" : "support_notice_analysis";
          const systemPrompt = isCustomer
            ? "은행 고객의 재난 피해 서술을 한국어로 구조화하세요. 입력에 없는 피해 사실을 만들지 말고 불명확한 값은 '확인 필요'로 표시하세요."
            : "대한민국 재난 금융지원 공지를 한국어로 구조화하세요. 대상, 지원유형, 기간, 필요서류, 처리기관과 이를 뒷받침하는 짧은 원문 근거를 추출하세요. 입력에 없는 조건은 만들지 마세요.";

          const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
          const result = await client.responses.parse({
            model: env.OPENAI_MODEL || "gpt-5.6",
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: String(payload.content || "") },
            ],
            text: { format: zodTextFormat(schema, formatName) },
          });

          if (!result.output_parsed) throw new Error("구조화된 분석 결과가 없습니다.");

          response.statusCode = 200;
          response.end(JSON.stringify({ source: "openai", analysis: result.output_parsed }));
        } catch (error) {
          response.statusCode = 502;
          response.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "AI 분석에 실패했습니다.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), seedDesignPlugin({ colorMode: "light-only" }), disasterAiPlugin(env)],
  };
});
