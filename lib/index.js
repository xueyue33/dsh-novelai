/**
 * dsh-novelai — Configurable NovelAI Image Generation Plugin for DeepSeek Harness
 *
 * Supports:
 *   - NovelAI Diffusion V4.5 (Full / Curated), V5 (Full / Medium / Curated), V4, and V3
 *   - Multi-character independent prompts & 5x5 grid coordinates (A1-E5)
 *   - Configurable defaults (API Key, Model, Resolution, Artist Tags, Quality Tags, UC, Steps, CFG, Sampler)
 *   - Named artist tag presets & runtime configuration tool (nai_config)
 *   - Precise Reference (Director Reference for V4.5) & Image-to-Image (img2img)
 *   - Anlas balance & V5 Battery status query (nai_status)
 *   - Dedicated Web Settings UI (Settings -> NovelAI 生图 & Plugins -> dsh-novelai)
 */

import { defineTool } from "@deepseek-ai/dsh-tools";
import z from "@deepseek-ai/schemastery";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

export const name = "dsh-novelai";
export const inject = ["tools"];

// ---------------------------------------------------------------------------
// Constants & Presets
// ---------------------------------------------------------------------------

const DEFAULT_API_KEY = "";
const DEFAULT_API_URL = "https://image.novelai.net/ai/generate-image";
const DEFAULT_SUB_URL = "https://image.novelai.net/user/subscription";

const DEFAULT_QUALITY_TAGS = "masterpiece, best quality, very aesthetic, absurdres";
const DEFAULT_UC_V45 =
  "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";

const MODEL_ALIASES = {
  "v5": "nai-diffusion-5-full",
  "v5-full": "nai-diffusion-5-full",
  "v5-medium": "nai-diffusion-5-full-medium",
  "v5-curated": "nai-diffusion-5-curated",
  "v4.5": "nai-diffusion-4-5-full",
  "v4.5-full": "nai-diffusion-4-5-full",
  "v4.5-curated": "nai-diffusion-4-5-curated",
  "v4": "nai-diffusion-4-full",
  "v4-full": "nai-diffusion-4-full",
  "v4-curated": "nai-diffusion-4-curated-preview",
  "v3": "nai-diffusion-3",
  "furry-v3": "nai-diffusion-furry-3"
};

const RESOLUTION_PRESETS = {
  portrait: { width: 832, height: 1216 },
  landscape: { width: 1216, height: 832 },
  square: { width: 1024, height: 1024 },
  large_portrait: { width: 1024, height: 1536 },
  large_landscape: { width: 1536, height: 1024 },
  wallpaper: { width: 1920, height: 1088 }
};

// ---------------------------------------------------------------------------
// Plugin Configuration Schema (Volatile for DSH Web Settings UI & Hot-Reload)
// ---------------------------------------------------------------------------

const rawFields = {
  apiKey: z
    .string()
    .role("secret")
    .default(DEFAULT_API_KEY)
    .description("NovelAI Persistent API Token (pst-...)"),
  apiUrl: z
    .string()
    .default(DEFAULT_API_URL)
    .description("NovelAI 生图接口地址（官方或兼容反代）"),
  subscriptionUrl: z
    .string()
    .default(DEFAULT_SUB_URL)
    .description("NovelAI 订阅、Anlas 点数与 V5 电池查询地址"),
  defaultModel: z
    .union([
      z.const("nai-diffusion-4-5-full"),
      z.const("nai-diffusion-4-5-curated"),
      z.const("nai-diffusion-5-full"),
      z.const("nai-diffusion-5-full-medium"),
      z.const("nai-diffusion-5-curated"),
      z.const("nai-diffusion-4-full"),
      z.const("nai-diffusion-4-curated-preview"),
      z.const("nai-diffusion-3"),
      z.const("nai-diffusion-furry-3")
    ])
    .default("nai-diffusion-4-5-full")
    .description("默认生图模型（推荐 nai-diffusion-4-5-full，Opus 免费无限跑；V5 消耗电池）"),
  defaultResolution: z
    .union([
      z.const("portrait"),
      z.const("landscape"),
      z.const("square"),
      z.const("large_portrait"),
      z.const("large_landscape"),
      z.const("wallpaper")
    ])
    .default("portrait")
    .description("默认画幅：portrait(832x1216) / landscape(1216x832) / square(1024x1024) / large_portrait(1024x1536)"),
  defaultArtistTags: z
    .string()
    .default("")
    .description("默认前置画师串/画风 Tag（留空则不自动加；也可填写已保存的画师预设名）"),
  defaultQualityTags: z
    .string()
    .default(DEFAULT_QUALITY_TAGS)
    .description("默认追加在正向提示词末尾的质量词"),
  defaultUc: z
    .string()
    .default(DEFAULT_UC_V45)
    .description("默认负面提示词 (Undesired Content)"),
  defaultSteps: z
    .number()
    .min(1)
    .max(50)
    .default(28)
    .description("默认采样步数（Opus 免费档上限为 28 步）"),
  defaultScale: z
    .number()
    .min(0)
    .max(20)
    .default(5)
    .description("默认提示词引导强度 (CFG Scale，V4.5/V5 推荐 4.5~6.0)"),
  defaultCfgRescale: z
    .number()
    .min(0)
    .max(1)
    .default(0)
    .description("默认 CFG Rescale（推荐 0 ~ 0.2）"),
  defaultSampler: z
    .union([
      z.const("k_euler_ancestral"),
      z.const("k_euler"),
      z.const("k_dpmpp_2s_ancestral"),
      z.const("k_dpmpp_2m_sde"),
      z.const("k_dpmpp_2m"),
      z.const("k_dpmpp_sde")
    ])
    .default("k_euler_ancestral")
    .description("默认采样器"),
  defaultNoiseSchedule: z
    .union([
      z.const("karras"),
      z.const("native"),
      z.const("exponential"),
      z.const("polyexponential")
    ])
    .default("karras")
    .description("默认噪声调度 (Noise Schedule)"),
  defaultVarietyPlus: z
    .boolean()
    .default(false)
    .description("默认开启 Variety+ 多样性增强（skip_cfg_above_sigma: 19，仅 V4/V4.5 生效）"),
  outputDir: z
    .string()
    .default("")
    .description("生成图片落盘根目录（留空则默认保存在 ~/.dsh/novelai/outputs）")
};

const volatileFields = Object.fromEntries(
  Object.entries(rawFields).map(([k, schema]) => [
    k,
    typeof schema.volatile === "function" ? schema.volatile() : schema
  ])
);

export const Config = z.object(volatileFields);

// ---------------------------------------------------------------------------
// Local State & Config Persistence
// ---------------------------------------------------------------------------

function dataRoot() {
  const home = process.env.DSH_HOME || path.join(homedir(), ".dsh");
  return path.join(home, "novelai");
}

function localStateFile() {
  return path.join(dataRoot(), "config.json");
}

function readLocalState() {
  try {
    const file = localStateFile();
    if (!existsSync(file)) return { overrides: {}, artistPresets: {} };
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return {
      overrides: parsed && typeof parsed.overrides === "object" && parsed.overrides ? parsed.overrides : {},
      artistPresets: parsed && typeof parsed.artistPresets === "object" && parsed.artistPresets ? parsed.artistPresets : {}
    };
  } catch {
    return { overrides: {}, artistPresets: {} };
  }
}

function writeLocalState(state) {
  const dir = dataRoot();
  mkdirSync(dir, { recursive: true });
  writeFileSync(localStateFile(), JSON.stringify(state, null, 2), "utf8");
}

function unwrapVolatile(rawConfig) {
  const out = {};
  if (rawConfig && typeof rawConfig === "object") {
    for (const [k, v] of Object.entries(rawConfig)) {
      out[k] = v !== null && typeof v === "object" && typeof v.get === "function" ? v.get() : v;
    }
  }
  return out;
}

function resolveEffectiveConfig(rawConfig) {
  const base = unwrapVolatile(rawConfig);
  const local = readLocalState();
  const merged = { ...base, ...local.overrides };
  // Prefer non-empty apiKey from local overrides, then volatile settings, then env
  const effectiveKey = String(
    local.overrides?.apiKey || base.apiKey || process.env.NOVELAI_API_KEY || DEFAULT_API_KEY
  ).trim();
  const defaultOutDir = path.join(dataRoot(), "outputs");
  return {
    apiKey: effectiveKey,
    apiUrl: String(merged.apiUrl || DEFAULT_API_URL).trim(),
    subscriptionUrl: String(merged.subscriptionUrl || DEFAULT_SUB_URL).trim(),
    defaultModel: String(merged.defaultModel || "nai-diffusion-4-5-full").trim(),
    defaultResolution: String(merged.defaultResolution || "portrait").trim(),
    defaultArtistTags: String(merged.defaultArtistTags ?? "").trim(),
    defaultQualityTags: String(merged.defaultQualityTags ?? DEFAULT_QUALITY_TAGS).trim(),
    defaultUc: String(merged.defaultUc ?? DEFAULT_UC_V45).trim(),
    defaultSteps: Number.isFinite(Number(merged.defaultSteps)) ? Number(merged.defaultSteps) : 28,
    defaultScale: Number.isFinite(Number(merged.defaultScale)) ? Number(merged.defaultScale) : 5,
    defaultCfgRescale: Number.isFinite(Number(merged.defaultCfgRescale)) ? Number(merged.defaultCfgRescale) : 0,
    defaultSampler: String(merged.defaultSampler || "k_euler_ancestral").trim(),
    defaultNoiseSchedule: String(merged.defaultNoiseSchedule || "karras").trim(),
    defaultVarietyPlus: Boolean(merged.defaultVarietyPlus),
    outputDir: String(merged.outputDir || defaultOutDir).trim(),
    artistPresets: local.artistPresets || {}
  };
}

function maskApiKey(key) {
  if (!key || typeof key !== "string") return "";
  const s = key.trim();
  if (s.length <= 12) return "********";
  return `${s.slice(0, 8)}...${s.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// ZIP & Image Helpers
// ---------------------------------------------------------------------------

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

function extractFirstPngFromZip(zipBuffer) {
  if (
    zipBuffer.length > 8 &&
    zipBuffer[0] === 0x89 &&
    zipBuffer[1] === 0x50 &&
    zipBuffer[2] === 0x4e &&
    zipBuffer[3] === 0x47
  ) {
    return zipBuffer;
  }

  let eocd = -1;
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (zipBuffer.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error("NovelAI response is neither a valid PNG nor a ZIP archive.");
  }

  let offset = zipBuffer.readUInt32LE(eocd + 16);
  while (offset + 46 <= zipBuffer.length && zipBuffer.readUInt32LE(offset) === CENTRAL_SIG) {
    const method = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize = zipBuffer.readUInt32LE(offset + 20);
    const nameLen = zipBuffer.readUInt16LE(offset + 28);
    const extraLen = zipBuffer.readUInt16LE(offset + 30);
    const commentLen = zipBuffer.readUInt16LE(offset + 32);
    const localOffset = zipBuffer.readUInt32LE(offset + 42);

    if (localOffset + 30 <= zipBuffer.length && zipBuffer.readUInt32LE(localOffset) === LOCAL_SIG) {
      const localNameLen = zipBuffer.readUInt16LE(localOffset + 26);
      const localExtraLen = zipBuffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd <= zipBuffer.length && compressedSize > 0) {
        const slice = zipBuffer.subarray(dataStart, dataEnd);
        if (method === 0) return Buffer.from(slice);
        if (method === 8) return inflateRawSync(slice);
        throw new Error(`Unsupported ZIP compression method: ${method}`);
      }
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("ZIP archive from NovelAI contained no readable image entry.");
}

function align64(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.max(64, Math.min(2048, Math.round(v / 64) * 64));
}

function parseResolution(resInput, widthInput, heightInput, defaultRes) {
  if (Number.isFinite(widthInput) && Number.isFinite(heightInput) && widthInput > 0 && heightInput > 0) {
    return { width: align64(widthInput, 832), height: align64(heightInput, 1216) };
  }
  const key = String(resInput || defaultRes || "portrait").trim().toLowerCase();
  if (RESOLUTION_PRESETS[key]) {
    return { ...RESOLUTION_PRESETS[key] };
  }
  const m = /^(\d{2,4})\s*[xX×*]\s*(\d{2,4})$/.exec(key);
  if (m) {
    return { width: align64(Number(m[1]), 832), height: align64(Number(m[2]), 1216) };
  }
  return { ...(RESOLUTION_PRESETS[defaultRes] || RESOLUTION_PRESETS.portrait) };
}

function normalizeModelId(inputModel, defaultModel) {
  const raw = String(inputModel || defaultModel || "nai-diffusion-4-5-full").trim().toLowerCase();
  return MODEL_ALIASES[raw] || raw;
}

function parseCharacterPosition(pos) {
  if (!pos || typeof pos !== "string") return null;
  const s = pos.trim().toUpperCase();
  if (s === "" || s === "AUTO" || s === "NONE") return null;
  if (s === "LEFT") return { x: 0.25, y: 0.5 };
  if (s === "RIGHT") return { x: 0.75, y: 0.5 };
  if (s === "CENTER" || s === "MIDDLE") return { x: 0.5, y: 0.5 };
  if (s === "TOP") return { x: 0.5, y: 0.25 };
  if (s === "BOTTOM") return { x: 0.5, y: 0.75 };

  const gridMatch = /^([A-E])([1-5])$/.exec(s);
  if (gridMatch) {
    const col = "ABCDE".indexOf(gridMatch[1]);
    const row = Number(gridMatch[2]) - 1;
    return {
      x: Number((0.1 + col * 0.2).toFixed(2)),
      y: Number((0.1 + row * 0.2).toFixed(2))
    };
  }

  const numMatch = /^([01](?:\.\d+)?)\s*[,，\s]\s*([01](?:\.\d+)?)$/.exec(s);
  if (numMatch) {
    return {
      x: Math.max(0, Math.min(1, Number(numMatch[1]))),
      y: Math.max(0, Math.min(1, Number(numMatch[2])))
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// NovelAI API Client
// ---------------------------------------------------------------------------

async function fetchSubscriptionStatus(cfg, signal) {
  if (!cfg.apiKey) {
    throw new Error("NovelAI API Key 未配置，请在设置界面或通过 nai_config 配置 apiKey。");
  }
  const response = await fetch(cfg.subscriptionUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      Accept: "application/json"
    },
    signal: signal ?? null
  });
  if (!response.ok) {
    const text = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`NovelAI 订阅查询失败 (HTTP ${response.status}): ${text}`);
  }
  const body = await response.json();
  const fixed = Number(body?.trainingStepsLeft?.fixedTrainingStepsLeft ?? 0);
  const purchased = Number(body?.trainingStepsLeft?.purchasedTrainingSteps ?? 0);
  const tierNum = Number(body?.tier ?? 0);
  const tierNames = { 0: "Free", 1: "Tablet", 2: "Scroll", 3: "Opus" };
  return {
    tier: tierNum,
    tierName: tierNames[tierNum] || `Tier-${tierNum}`,
    active: Boolean(body?.active),
    expiresAt: body?.expiresAt ? new Date(body.expiresAt * 1000).toISOString() : "",
    fixedAnlas: fixed,
    purchasedAnlas: purchased,
    totalAnlas: fixed + purchased,
    batteryPercent: Number(body?.usage?.percent ?? 100),
    purchasedBatteryPercent: Number(body?.usage?.purchasedPercent ?? 0),
    timeUntilNextBatteryPercentSec: Number(body?.usage?.timeUntilNextPercent ?? 0)
  };
}

function buildFinalPrompt(prompt, artistTagsArg, qualityTagsArg, cfg) {
  const parts = [];

  let artist = artistTagsArg !== undefined ? String(artistTagsArg).trim() : cfg.defaultArtistTags;
  if (artist && artist.toLowerCase() !== "none" && artist.toLowerCase() !== "off") {
    if (cfg.artistPresets && cfg.artistPresets[artist]) {
      artist = cfg.artistPresets[artist];
    }
    parts.push(artist);
  }

  if (prompt && String(prompt).trim()) {
    parts.push(String(prompt).trim());
  }

  const quality = qualityTagsArg !== undefined ? String(qualityTagsArg).trim() : cfg.defaultQualityTags;
  if (quality && quality.toLowerCase() !== "none" && quality.toLowerCase() !== "off") {
    parts.push(quality);
  }

  return parts
    .map((p) => p.replace(/,\s*$/, "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildFinalNegativePrompt(negArg, cfg) {
  if (negArg === undefined || negArg === null || String(negArg).trim() === "") {
    return cfg.defaultUc;
  }
  const raw = String(negArg).trim();
  if (raw.toLowerCase() === "none" || raw.toLowerCase() === "off") {
    return "";
  }
  if (raw.toLowerCase().startsWith("override:")) {
    return raw.slice("override:".length).trim();
  }
  return [cfg.defaultUc, raw].filter(Boolean).join(", ");
}

async function generateOneImage(params, cfg, signal) {
  const {
    model,
    fullPrompt,
    finalUc,
    width,
    height,
    steps,
    scale,
    cfgRescale,
    sampler,
    noiseSchedule,
    varietyPlus,
    seed,
    characters,
    referenceBytes,
    referenceMode,
    referenceCaption,
    strength,
    noise,
    fidelity
  } = params;

  const isV5 = model.startsWith("nai-diffusion-5");
  const isV5Medium = model === "nai-diffusion-5-full-medium";
  const isV4OrV5 = model.startsWith("nai-diffusion-4") || isV5;
  const isV45 = model.startsWith("nai-diffusion-4-5");

  const effectiveSteps = isV5Medium ? 14 : steps;
  const effectiveSampler = isV5Medium ? "k_euler_ancestral" : sampler;
  const effectiveCfgRescale = isV5Medium ? 0 : cfgRescale;

  const hasImg2Img = referenceBytes && referenceMode === "img2img";
  const hasDirectorRef = referenceBytes && referenceMode === "director_reference" && isV45 && !isV5;
  const action = hasImg2Img ? "img2img" : "generate";

  const charPrompts = [];
  const v4CharPositives = [];
  const v4CharNegatives = [];
  let useCoords = false;

  if (isV4OrV5 && Array.isArray(characters) && characters.length > 0) {
    for (const ch of characters) {
      if (!ch || typeof ch.prompt !== "string" || !ch.prompt.trim()) continue;
      const charPrompt = ch.prompt.trim();
      const charUc = isV5Medium ? "" : String(ch.uc || "").trim();
      const parsedPos = parseCharacterPosition(ch.position);
      if (parsedPos) useCoords = true;
      const center = parsedPos || { x: 0.5, y: 0.5 };

      charPrompts.push({
        prompt: charPrompt,
        uc: charUc,
        center,
        enabled: true
      });
      v4CharPositives.push({
        char_caption: charPrompt,
        centers: [center]
      });
      v4CharNegatives.push({
        char_caption: charUc,
        centers: [center]
      });
    }
  }

  const parameters = {
    params_version: isV5 ? 4 : 3,
    width,
    height,
    scale,
    sampler: effectiveSampler,
    steps: effectiveSteps,
    seed,
    n_samples: 1,
    ucPreset: 0,
    qualityToggle: true,
    autoSmea: false,
    dynamic_thresholding: false,
    controlnet_strength: 1,
    legacy: false,
    add_original_image: true,
    cfg_rescale: effectiveCfgRescale,
    noise_schedule: noiseSchedule,
    legacy_v3_extend: false,
    skip_cfg_above_sigma: !isV5 && varietyPlus ? 19 : null,
    use_coords: useCoords,
    legacy_uc: false,
    normalize_reference_strength_multiple: true,
    inpaintImg2ImgStrength: 1,
    image_format: "png",
    negative_prompt: isV5Medium ? undefined : finalUc,
    uc: isV5Medium ? undefined : finalUc
  };

  if (isV4OrV5) {
    parameters.characterPrompts = charPrompts;
    parameters.v4_prompt = {
      caption: {
        base_caption: fullPrompt,
        char_captions: v4CharPositives
      },
      use_coords: useCoords,
      use_order: true
    };
    if (!isV5Medium) {
      parameters.v4_negative_prompt = {
        caption: {
          base_caption: finalUc,
          char_captions: v4CharNegatives
        },
        legacy_uc: false,
        use_coords: false,
        use_order: false
      };
    }
  } else {
    parameters.sm = false;
    parameters.sm_dyn = false;
  }

  if (hasImg2Img) {
    const imgStrength = Number.isFinite(strength) ? Math.max(0.01, Math.min(0.99, strength)) : 0.65;
    const imgNoise = Number.isFinite(noise) ? Math.max(0, Math.min(0.99, noise)) : 0.1;
    parameters.image = referenceBytes.toString("base64");
    parameters.strength = imgStrength;
    parameters.noise = imgNoise;
    parameters.extra_noise_seed = seed;
  } else if (hasDirectorRef) {
    const refStrength = Number.isFinite(strength) ? Math.max(0.01, Math.min(1, strength)) : 1;
    const refFidelity = Number.isFinite(fidelity) ? Math.max(0, Math.min(1, fidelity)) : 1;
    const secondary = Number((1 - refFidelity).toFixed(2));
    const capMode =
      referenceCaption === "character" || referenceCaption === "style"
        ? referenceCaption
        : "character&style";
    parameters.director_reference_descriptions = [
      {
        caption: { base_caption: capMode, char_captions: [] },
        legacy_uc: false
      }
    ];
    parameters.director_reference_information_extracted = [1];
    parameters.director_reference_strength_values = [refStrength];
    parameters.director_reference_secondary_strength_values = [secondary];
    parameters.director_reference_images_cached = [
      {
        cache_secret_key: randomBytes(32).toString("hex"),
        data: referenceBytes.toString("base64")
      }
    ];
  }

  const body = {
    input: fullPrompt,
    model,
    action,
    parameters
  };

  const response = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify(body),
    signal: signal ?? null
  });

  if (!response.ok) {
    const errText = (await response.text().catch(() => "")).slice(0, 400);
    throw new Error(`NovelAI 生图请求失败 (HTTP ${response.status}): ${errText}`);
  }

  const zipBytes = Buffer.from(await response.arrayBuffer());
  return extractFirstPngFromZip(zipBytes);
}

// ---------------------------------------------------------------------------
// HTTP Helpers for Settings UI Bridge
// ---------------------------------------------------------------------------

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serializePublicConfig(cfg) {
  return {
    apiKeySet: Boolean(cfg.apiKey),
    apiKeyPreview: maskApiKey(cfg.apiKey),
    apiUrl: cfg.apiUrl,
    subscriptionUrl: cfg.subscriptionUrl,
    defaultModel: cfg.defaultModel,
    defaultResolution: cfg.defaultResolution,
    defaultArtistTags: cfg.defaultArtistTags,
    defaultQualityTags: cfg.defaultQualityTags,
    defaultUc: cfg.defaultUc,
    defaultSteps: cfg.defaultSteps,
    defaultScale: cfg.defaultScale,
    defaultCfgRescale: cfg.defaultCfgRescale,
    defaultSampler: cfg.defaultSampler,
    defaultNoiseSchedule: cfg.defaultNoiseSchedule,
    defaultVarietyPlus: cfg.defaultVarietyPlus,
    outputDir: cfg.outputDir,
    artistPresets: cfg.artistPresets || {}
  };
}

// ---------------------------------------------------------------------------
// Tool Guide & Registration
// ---------------------------------------------------------------------------

const NAI_PROMPT_GUIDE = [
  "调用 NovelAI 官方生图接口并保存高清 PNG 原图到本地。",
  "【提示词与使用指导】：",
  "1. 采用 Danbooru (D站) 英文标签体系（逗号分隔）：角色名、作品名、外貌特征、服装、动作与构图均使用标准 D 站 Tag。",
  "2. 画风与画师串（artist_tags）：每次生图时，结合当前画面题材与氛围，自主构思并传入合适的 D 站画师标签与画风/光影词（支持 `数值::tag::` 权重语法）。",
  "3. 多角色互动（characters 参数）：多人同框时可在 characters 中分别传入各角色的特征标签与坐标（A1..E5），避免特征串色。",
  "4. 默认沿用设置中的模型与基础参数；生成完成后返回图片本地绝对路径 (file_path)，在 QQ 会话中可调用 qqbot_send_file 发送。"
].join("\n");

const GENERATED_IMAGE_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    file_path: { type: "string", required: true },
    file_name: { type: "string", required: true },
    seed: { type: "integer", required: true },
    width: { type: "integer", required: true },
    height: { type: "integer", required: true },
    bytes: { type: "integer", required: true }
  }
};

export const apply = (ctx, rawConfig) => {
  // Suppress duplicate auto-generated form on Plugins page since we ship our own custom UI
  ctx.inject?.(["settings"], (sctx) => {
    try {
      sctx.effect(() => sctx.settings.configure({ auto: false }, ctx.fiber));
    } catch {}
  });

  // Mount HTTP API routes for the Web Settings UI
  ctx.inject?.(["webServer"], (sctx) => {
    const webServer = sctx.get?.("webServer", false) ?? sctx.webServer;
    if (!webServer || typeof webServer.register !== "function") return;

    const dConfig = webServer.register({
      kind: "exact",
      path: "/api/dsh-novelai/config",
      handler: async (req, res) => {
        try {
          if (req.method === "GET") {
            const cfg = resolveEffectiveConfig(rawConfig);
            sendJson(res, 200, { ok: true, config: serializePublicConfig(cfg) });
            return;
          }
          if (req.method === "POST") {
            const body = await readJsonBody(req);
            const state = readLocalState();
            const settingsPatch = {};

            const setField = (key, val) => {
              state.overrides[key] = val;
              settingsPatch[key] = val;
            };

            if (body.clearApiKey === true) {
              setField("apiKey", "");
            } else if (typeof body.apiKey === "string" && body.apiKey.trim() && !body.apiKey.includes("...")) {
              setField("apiKey", body.apiKey.trim());
            }
            if (typeof body.apiUrl === "string" && body.apiUrl.trim()) {
              setField("apiUrl", body.apiUrl.trim());
            }
            if (typeof body.subscriptionUrl === "string" && body.subscriptionUrl.trim()) {
              setField("subscriptionUrl", body.subscriptionUrl.trim());
            }
            if (typeof body.defaultModel === "string" && body.defaultModel.trim()) {
              setField("defaultModel", normalizeModelId(body.defaultModel, "nai-diffusion-4-5-full"));
            }
            if (typeof body.defaultResolution === "string" && body.defaultResolution.trim()) {
              setField("defaultResolution", body.defaultResolution.trim());
            }
            if (typeof body.defaultArtistTags === "string") {
              setField("defaultArtistTags", body.defaultArtistTags.trim());
            }
            if (typeof body.defaultQualityTags === "string") {
              setField("defaultQualityTags", body.defaultQualityTags.trim());
            }
            if (typeof body.defaultUc === "string") {
              setField("defaultUc", body.defaultUc.trim());
            }
            if (body.defaultSteps !== undefined && Number.isFinite(Number(body.defaultSteps))) {
              setField("defaultSteps", Math.max(1, Math.min(50, Math.floor(Number(body.defaultSteps)))));
            }
            if (body.defaultScale !== undefined && Number.isFinite(Number(body.defaultScale))) {
              setField("defaultScale", Math.max(0, Math.min(20, Number(body.defaultScale))));
            }
            if (body.defaultCfgRescale !== undefined && Number.isFinite(Number(body.defaultCfgRescale))) {
              setField("defaultCfgRescale", Math.max(0, Math.min(1, Number(body.defaultCfgRescale))));
            }
            if (typeof body.defaultSampler === "string" && body.defaultSampler.trim()) {
              setField("defaultSampler", body.defaultSampler.trim());
            }
            if (typeof body.defaultNoiseSchedule === "string" && body.defaultNoiseSchedule.trim()) {
              setField("defaultNoiseSchedule", body.defaultNoiseSchedule.trim());
            }
            if (typeof body.defaultVarietyPlus === "boolean") {
              setField("defaultVarietyPlus", body.defaultVarietyPlus);
            }
            if (typeof body.outputDir === "string") {
              setField("outputDir", body.outputDir.trim());
            }
            if (body.artistPresets && typeof body.artistPresets === "object" && !Array.isArray(body.artistPresets)) {
              const cleaned = {};
              for (const [k, v] of Object.entries(body.artistPresets)) {
                const nameKey = String(k).trim();
                const tagVal = String(v ?? "").trim();
                if (nameKey && tagVal) cleaned[nameKey] = tagVal;
              }
              state.artistPresets = cleaned;
            }

            writeLocalState(state);

            const cfg = resolveEffectiveConfig(rawConfig);
            sendJson(res, 200, { ok: true, config: serializePublicConfig(cfg) });
            return;
          }
          res.writeHead(405, { Allow: "GET, POST" });
          res.end();
        } catch (err) {
          sendJson(res, 500, { ok: false, error: String(err?.message || err) });
        }
      }
    });

    const dStatus = webServer.register({
      kind: "exact",
      path: "/api/dsh-novelai/status",
      handler: async (req, res) => {
        try {
          if (req.method !== "POST" && req.method !== "GET") {
            res.writeHead(405, { Allow: "GET, POST" });
            res.end();
            return;
          }
          const body = req.method === "POST" ? await readJsonBody(req) : {};
          const cfg = resolveEffectiveConfig(rawConfig);
          const candidateKey =
            typeof body.apiKey === "string" && body.apiKey.trim() && !body.apiKey.includes("...")
              ? body.apiKey.trim()
              : cfg.apiKey;
          const candidateSubUrl =
            typeof body.subscriptionUrl === "string" && body.subscriptionUrl.trim()
              ? body.subscriptionUrl.trim()
              : cfg.subscriptionUrl;
          const status = await fetchSubscriptionStatus({
            ...cfg,
            apiKey: candidateKey,
            subscriptionUrl: candidateSubUrl
          });
          sendJson(res, 200, { ok: true, status });
        } catch (err) {
          sendJson(res, 400, { ok: false, error: String(err?.message || err) });
        }
      }
    });

    sctx.effect(
      () => () => {
        try { dConfig?.(); } catch {}
        try { dStatus?.(); } catch {}
      },
      "dsh-novelai: http routes"
    );
  });

  // 1. Tool: nai_generate
  const disposeGenerate = ctx.tools.register(
    defineTool({
      name: "nai_generate",
      description: NAI_PROMPT_GUIDE,
      parameters: {
        prompt: {
          type: "string",
          required: true,
          description:
            "主画面英文 Danbooru Tag（逗号分隔）。默认会自动拼接配置的画师串与质量词，无需重复写 masterpiece 等词。"
        },
        characters: {
          type: "array",
          description:
            "可选：V4/V4.5/V5 多角色独立提示词列表（最多 6 人）。每人独立指定外观/服装/动作与坐标，防串色。",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              prompt: {
                type: "string",
                required: true,
                description: "该角色的专属正向英文 Tag（如 'girl, seele vollerei, short blue hair, white dress'）"
              },
              uc: {
                type: "string",
                description: "可选：该角色的专属负面 Tag"
              },
              position: {
                type: "string",
                description:
                  "可选：角色位置。支持 5x5 网格坐标 'A1'..'E5'（A~E 为从左到右，1~5 为从上到下，如 'B3' 左中、'D3' 右中、'C3' 正中）或 'left'/'right'/'center'，留空则自动布局。"
              }
            }
          }
        },
        artist_tags: {
          type: "string",
          description:
            "推荐每次根据生图题材自主构思传入：契合当前画面氛围的 Danbooru 画师组合与画风/媒介/光影词（支持权重语法 `数值::tag::`），或已保存的画师预设名。不传则回退全局默认 defaultArtistTags；传 'none' 则不加画师串。"
        },
        quality_tags: {
          type: "string",
          description:
            "可选：覆盖默认质量词后缀；传 'none' 则不追加质量词。"
        },
        negative_prompt: {
          type: "string",
          description:
            "可选：额外追加的负面 Tag（若以 'override:' 开头则完全替换默认负面词；传 'none' 则清空负面词）。"
        },
        resolution: {
          type: "string",
          description:
            "可选：画幅预设或自定义宽高。支持 'portrait'(832x1216)、'landscape'(1216x832)、'square'(1024x1024)、'large_portrait'(1024x1536)、'large_landscape'(1536x1024)、'wallpaper'(1920x1088) 或 'WIDTHxHEIGHT'。"
        },
        model: {
          type: "string",
          description:
            "可选：生图模型。支持 'nai-diffusion-4-5-full'(默认)、'nai-diffusion-4-5-curated'、'nai-diffusion-5-full'、'nai-diffusion-5-full-medium'、'nai-diffusion-5-curated'、'nai-diffusion-4-full'、'nai-diffusion-3'。"
        },
        steps: {
          type: "integer",
          description: "可选：采样步数（1-50，默认读取设置 28；Opus 免费线为 <=28 步）。"
        },
        scale: {
          type: "number",
          description: "可选：提示词引导强度 CFG Scale（推荐 4.5 ~ 6.5，默认读取设置 5.0）。"
        },
        cfg_rescale: {
          type: "number",
          description: "可选：CFG Rescale（0 ~ 1，推荐 0 ~ 0.2）。"
        },
        sampler: {
          type: "string",
          description:
            "可选：采样器，支持 'k_euler_ancestral'、'k_euler'、'k_dpmpp_2s_ancestral'、'k_dpmpp_2m_sde'、'k_dpmpp_2m'、'k_dpmpp_sde'。"
        },
        noise_schedule: {
          type: "string",
          description:
            "可选：噪声调度，支持 'karras'、'native'、'exponential'、'polyexponential'。"
        },
        variety_plus: {
          type: "boolean",
          description: "可选：是否开启 Variety+ 多样性增强（仅 V4/V4.5 支持）。"
        },
        seed: {
          type: "integer",
          description: "可选：指定随机种子（正整数）；不传则自动生成随机种子。"
        },
        count: {
          type: "integer",
          description: "可选：连续生成张数（1-4，默认 1）。"
        },
        reference_image_path: {
          type: "string",
          description: "可选：本地参考图绝对路径（支持 PNG/JPEG），用于图生图 (img2img) 或 V4.5 精准角色/画风参考 (director_reference)。"
        },
        reference_mode: {
          type: "string",
          enum: ["img2img", "director_reference"],
          description: "可选：参考图模式，'img2img'（垫图重绘，默认）或 'director_reference'（V4.5 精准特征参考）。"
        },
        reference_caption: {
          type: "string",
          enum: ["character&style", "character", "style"],
          description: "可选：当 reference_mode='director_reference' 时提取的特征类型，默认 'character&style'。"
        },
        strength: {
          type: "number",
          description: "可选：图生图重绘强度（0.01-0.99，默认 0.65）或 Director Reference 参考强度（0.01-1.0，默认 1.0）。"
        },
        noise: {
          type: "number",
          description: "可选：图生图附加噪声（0.0-0.99，默认 0.1）。"
        },
        fidelity: {
          type: "number",
          description: "可选：Director Reference 保真度（0.0-1.0，默认 1.0）。"
        }
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", required: true },
            model: { type: "string", required: true },
            width: { type: "integer", required: true },
            height: { type: "integer", required: true },
            steps: { type: "integer", required: true },
            scale: { type: "number", required: true },
            sampler: { type: "string", required: true },
            noise_schedule: { type: "string", required: true },
            full_prompt: { type: "string", required: true },
            negative_prompt: { type: "string", required: true },
            duration_ms: { type: "integer", required: true },
            images: {
              type: "array",
              required: true,
              items: GENERATED_IMAGE_ITEM_SCHEMA
            }
          }
        },
        render: (_args, value) => [
          {
            type: "text",
            text: [
              `NovelAI 生图完成（模型: ${value.model}, 尺寸: ${value.width}x${value.height}, 步数: ${value.steps}, CFG: ${value.scale}, 耗时: ${(value.duration_ms / 1000).toFixed(1)}s）：`,
              ...value.images.map(
                (img, idx) =>
                  `[${idx + 1}] 路径: ${img.file_path} (Seed: ${img.seed}, ${(img.bytes / 1024).toFixed(1)} KB)`
              ),
              `完整 Prompt: ${value.full_prompt}`
            ].join("\n")
          }
        ]
      },
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const startedAt = Date.now();
        const cfg = resolveEffectiveConfig(rawConfig);
        if (!cfg.apiKey) {
          throw new Error("NovelAI API Key 未配置，请先在设置界面或通过 nai_config 设置 apiKey。");
        }

        const model = normalizeModelId(args.model, cfg.defaultModel);
        const { width, height } = parseResolution(
          args.resolution,
          undefined,
          undefined,
          cfg.defaultResolution
        );
        const steps =
          args.steps !== undefined
            ? Math.max(1, Math.min(50, Math.floor(Number(args.steps))))
            : cfg.defaultSteps;
        const scale =
          args.scale !== undefined
            ? Math.max(0, Math.min(20, Number(args.scale)))
            : cfg.defaultScale;
        const cfgRescale =
          args.cfg_rescale !== undefined
            ? Math.max(0, Math.min(1, Number(args.cfg_rescale)))
            : cfg.defaultCfgRescale;
        const sampler = String(args.sampler || cfg.defaultSampler).trim();
        const noiseSchedule = String(args.noise_schedule || cfg.defaultNoiseSchedule).trim();
        const varietyPlus =
          args.variety_plus !== undefined ? Boolean(args.variety_plus) : cfg.defaultVarietyPlus;
        const count =
          args.count !== undefined ? Math.max(1, Math.min(4, Math.floor(Number(args.count)))) : 1;

        const fullPrompt = buildFinalPrompt(
          args.prompt,
          args.artist_tags,
          args.quality_tags,
          cfg
        );
        const finalUc = buildFinalNegativePrompt(args.negative_prompt, cfg);

        let referenceBytes;
        const referenceMode = args.reference_mode || "img2img";
        if (args.reference_image_path) {
          const refPath = String(args.reference_image_path).trim();
          if (!path.isAbsolute(refPath)) {
            throw new Error(`reference_image_path 必须是绝对路径（收到：${refPath}）`);
          }
          referenceBytes = await readFile(refPath);
        }

        const dayFolder = new Date().toISOString().slice(0, 10);
        const outDir = path.join(cfg.outputDir, dayFolder);
        await mkdir(outDir, { recursive: true });

        const images = [];
        for (let i = 0; i < count; i++) {
          const seed =
            args.seed !== undefined && Number.isInteger(args.seed) && args.seed > 0
              ? args.seed + i
              : randomInt(1, 4294967295);

          const pngBytes = await generateOneImage(
            {
              model,
              fullPrompt,
              finalUc,
              width,
              height,
              steps,
              scale,
              cfgRescale,
              sampler,
              noiseSchedule,
              varietyPlus,
              seed,
              characters: args.characters,
              referenceBytes,
              referenceMode,
              referenceCaption: args.reference_caption,
              strength: args.strength,
              noise: args.noise,
              fidelity: args.fidelity
            },
            cfg,
            exec?.signal
          );

          const hash = createHash("sha256")
            .update(`${Date.now()}_${seed}_${i}`)
            .digest("hex")
            .slice(0, 8);
          const fileName = `nai_${Date.now()}_${seed}_${hash}.png`;
          const filePath = path.join(outDir, fileName);
          await writeFile(filePath, pngBytes);

          images.push({
            file_path: filePath,
            file_name: fileName,
            seed,
            width,
            height,
            bytes: pngBytes.length
          });
        }

        return {
          ok: true,
          model,
          width,
          height,
          steps: model === "nai-diffusion-5-full-medium" ? 14 : steps,
          scale,
          sampler: model === "nai-diffusion-5-full-medium" ? "k_euler_ancestral" : sampler,
          noise_schedule: noiseSchedule,
          full_prompt: fullPrompt,
          negative_prompt: finalUc,
          duration_ms: Date.now() - startedAt,
          images
        };
      }
    })
  );

  // 2. Tool: nai_status
  const disposeStatus = ctx.tools.register(
    defineTool({
      name: "nai_status",
      description:
        "查询 NovelAI 账号当前的订阅档位、剩余 Anlas 点数、V5 电池电量百分比，以及当前插件生效的默认生图参数与已保存的画师串预设。",
      parameters: {},
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            tier: { type: "integer", required: true },
            tier_name: { type: "string", required: true },
            active: { type: "boolean", required: true },
            expires_at: { type: "string", required: true },
            fixed_anlas: { type: "integer", required: true },
            purchased_anlas: { type: "integer", required: true },
            total_anlas: { type: "integer", required: true },
            battery_percent: { type: "number", required: true },
            purchased_battery_percent: { type: "number", required: true },
            default_model: { type: "string", required: true },
            default_resolution: { type: "string", required: true },
            default_artist_tags: { type: "string", required: true },
            default_quality_tags: { type: "string", required: true },
            default_steps: { type: "integer", required: true },
            default_scale: { type: "number", required: true },
            default_sampler: { type: "string", required: true },
            default_noise_schedule: { type: "string", required: true },
            default_variety_plus: { type: "boolean", required: true },
            output_dir: { type: "string", required: true },
            artist_presets_json: { type: "string", required: true }
          }
        },
        render: (_args, v) => [
          {
            type: "text",
            text: [
              `NovelAI 账号状态：${v.tier_name} (${v.active ? "生效中" : "未激活"}, 到期: ${v.expires_at || "未知"})`,
              `Anlas 点数：总计 ${v.total_anlas} (月度固定: ${v.fixed_anlas}, 永久购买: ${v.purchased_anlas})`,
              `V5 电池电量：${v.battery_percent}% (购买电量: ${v.purchased_battery_percent}%)`,
              `当前默认配置：模型=${v.default_model}, 画幅=${v.default_resolution}, 步数=${v.default_steps}, CFG=${v.scale ?? v.default_scale}, 采样器=${v.default_sampler}, 调度=${v.default_noise_schedule}, Variety+=${v.default_variety_plus}`,
              `默认画师串：${v.default_artist_tags || "(未设置)"}`,
              `已存画师预设：${v.artist_presets_json}`
            ].join("\n")
          }
        ]
      },
      isConcurrencySafe: () => true,
      async execute(_args, exec) {
        const cfg = resolveEffectiveConfig(rawConfig);
        const sub = await fetchSubscriptionStatus(cfg, exec?.signal);
        return {
          tier: sub.tier,
          tier_name: sub.tierName,
          active: sub.active,
          expires_at: sub.expiresAt,
          fixed_anlas: sub.fixedAnlas,
          purchased_anlas: sub.purchasedAnlas,
          total_anlas: sub.totalAnlas,
          battery_percent: sub.batteryPercent,
          purchased_battery_percent: sub.purchasedBatteryPercent,
          default_model: cfg.defaultModel,
          default_resolution: cfg.defaultResolution,
          default_artist_tags: cfg.defaultArtistTags,
          default_quality_tags: cfg.defaultQualityTags,
          default_steps: cfg.defaultSteps,
          default_scale: cfg.defaultScale,
          default_sampler: cfg.defaultSampler,
          default_noise_schedule: cfg.defaultNoiseSchedule,
          default_variety_plus: cfg.defaultVarietyPlus,
          output_dir: cfg.outputDir,
          artist_presets_json: JSON.stringify(cfg.artistPresets || {})
        };
      }
    })
  );

  // 3. Tool: nai_config
  const disposeConfig = ctx.tools.register(
    defineTool({
      name: "nai_config",
      description:
        "实时查看或修改 NovelAI 插件的默认配置（默认模型、画幅、默认画师串、默认质量词、负面词、步数、CFG、采样器、API Key 等），或增删命名的「画师串预设」(artistPresets)，修改立即生效并持久化。",
      parameters: {
        default_model: {
          type: "string",
          description:
            "可选：设置默认模型（如 'nai-diffusion-4-5-full'、'nai-diffusion-4-5-curated'、'nai-diffusion-5-full'、'nai-diffusion-5-full-medium'、'nai-diffusion-5-curated'）"
        },
        default_resolution: {
          type: "string",
          description:
            "可选：设置默认画幅（'portrait' / 'landscape' / 'square' / 'large_portrait' / 'large_landscape' / 'wallpaper'）"
        },
        default_artist_tags: {
          type: "string",
          description: "可选：设置默认前置画师串（传空字符串 '' 可清空默认画师串，也可传已保存的预设名）"
        },
        default_quality_tags: {
          type: "string",
          description: "可选：设置默认质量词后缀"
        },
        default_uc: {
          type: "string",
          description: "可选：设置默认负面提示词 (UC)"
        },
        default_steps: {
          type: "integer",
          description: "可选：设置默认采样步数（1-50）"
        },
        default_scale: {
          type: "number",
          description: "可选：设置默认 CFG Scale（0-20）"
        },
        default_cfg_rescale: {
          type: "number",
          description: "可选：设置默认 CFG Rescale（0-1）"
        },
        default_sampler: {
          type: "string",
          description: "可选：设置默认采样器（如 'k_euler_ancestral'）"
        },
        default_noise_schedule: {
          type: "string",
          description: "可选：设置默认噪声调度（如 'karras'、'native'）"
        },
        default_variety_plus: {
          type: "boolean",
          description: "可选：设置默认是否开启 Variety+"
        },
        api_key: {
          type: "string",
          description: "可选：更新 NovelAI Persistent API Key (pst-...)"
        },
        save_preset_name: {
          type: "string",
          description: "可选：要保存或删除的画师串预设名称（如 '厚涂'、'水彩'、'赛璐璐'）"
        },
        save_preset_tags: {
          type: "string",
          description: "可选：与 save_preset_name 配合使用，填写画师串内容；若传空字符串 '' 则删除该预设。"
        }
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", required: true },
            updated_keys: {
              type: "array",
              required: true,
              items: { type: "string" }
            },
            default_model: { type: "string", required: true },
            default_resolution: { type: "string", required: true },
            default_artist_tags: { type: "string", required: true },
            default_steps: { type: "integer", required: true },
            default_scale: { type: "number", required: true },
            default_sampler: { type: "string", required: true },
            default_variety_plus: { type: "boolean", required: true },
            artist_presets_json: { type: "string", required: true }
          }
        },
        render: (_args, v) => [
          {
            type: "text",
            text: `NovelAI 配置已更新 (${v.updated_keys.join(", ") || "无变更"})：默认模型=${v.default_model}, 画幅=${v.default_resolution}, 默认画师串=${v.default_artist_tags || "(空)"}, 步数=${v.default_steps}, CFG=${v.default_scale}, 预设=${v.artist_presets_json}`
          }
        ]
      },
      isConcurrencySafe: () => false,
      async execute(args) {
        const state = readLocalState();
        const updatedKeys = [];
        const settingsPatch = {};

        const mapField = (argKey, cfgKey, transform = (x) => x) => {
          if (args[argKey] !== undefined) {
            const val = transform(args[argKey]);
            state.overrides[cfgKey] = val;
            settingsPatch[cfgKey] = val;
            updatedKeys.push(cfgKey);
          }
        };

        mapField("default_model", "defaultModel", (v) => normalizeModelId(v, "nai-diffusion-4-5-full"));
        mapField("default_resolution", "defaultResolution", (v) => String(v).trim());
        mapField("default_artist_tags", "defaultArtistTags", (v) => String(v).trim());
        mapField("default_quality_tags", "defaultQualityTags", (v) => String(v).trim());
        mapField("default_uc", "defaultUc", (v) => String(v).trim());
        mapField("default_steps", "defaultSteps", (v) => Math.max(1, Math.min(50, Math.floor(Number(v)))));
        mapField("default_scale", "defaultScale", (v) => Math.max(0, Math.min(20, Number(v))));
        mapField("default_cfg_rescale", "defaultCfgRescale", (v) => Math.max(0, Math.min(1, Number(v))));
        mapField("default_sampler", "defaultSampler", (v) => String(v).trim());
        mapField("default_noise_schedule", "defaultNoiseSchedule", (v) => String(v).trim());
        mapField("default_variety_plus", "defaultVarietyPlus", (v) => Boolean(v));
        mapField("api_key", "apiKey", (v) => String(v).trim());

        if (args.save_preset_name && String(args.save_preset_name).trim()) {
          const pName = String(args.save_preset_name).trim();
          const pTags = args.save_preset_tags !== undefined ? String(args.save_preset_tags).trim() : "";
          if (pTags === "") {
            delete state.artistPresets[pName];
            updatedKeys.push(`deletePreset:${pName}`);
          } else {
            state.artistPresets[pName] = pTags;
            updatedKeys.push(`savePreset:${pName}`);
          }
        }

        writeLocalState(state);

        const eff = resolveEffectiveConfig(rawConfig);
        return {
          ok: true,
          updated_keys: updatedKeys,
          default_model: eff.defaultModel,
          default_resolution: eff.defaultResolution,
          default_artist_tags: eff.defaultArtistTags,
          default_steps: eff.defaultSteps,
          default_scale: eff.defaultScale,
          default_sampler: eff.defaultSampler,
          default_variety_plus: eff.defaultVarietyPlus,
          artist_presets_json: JSON.stringify(eff.artistPresets || {})
        };
      }
    })
  );

  ctx.logger?.info?.("dsh-novelai: ready (tools: nai_generate, nai_status, nai_config; UI: /api/dsh-novelai/*)");

  return () => {
    try { disposeGenerate?.(); } catch {}
    try { disposeStatus?.(); } catch {}
    try { disposeConfig?.(); } catch {}
  };
};
