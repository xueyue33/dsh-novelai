window.__ModuleLoader__.load({
  id: "dsh-novelai",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const { createElement: h, useState, useEffect, useCallback } = React;

    const STYLE_ID = "dsh-novelai-settings-styles";
    const CSS_TEXT = `
.dshnai-wrap {
  font-family: -apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 820px;
  padding: 8px 4px 28px;
  color: var(--dsw-alias-label-primary, inherit);
}
.dshnai-card {
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.2));
  background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.04));
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dshnai-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.dshnai-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dshnai-card-desc {
  margin: 2px 0 0;
  font-size: 12.5px;
  opacity: 0.72;
  line-height: 1.5;
}
.dshnai-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}
.dshnai-stat-box {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.16));
  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.03));
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dshnai-stat-label {
  font-size: 12px;
  opacity: 0.68;
}
.dshnai-stat-value {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.dshnai-stat-sub {
  font-size: 11.5px;
  opacity: 0.65;
}
.dshnai-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.dshnai-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}
.dshnai-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.dshnai-label {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dshnai-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
}
.dshnai-badge-ok {
  background: rgba(52, 199, 89, 0.15);
  color: #2fb350;
}
.dshnai-badge-warn {
  background: rgba(255, 159, 10, 0.16);
  color: #e08900;
}
.dshnai-input, .dshnai-select, .dshnai-textarea {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: 13.5px;
  color: inherit;
  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.06));
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));
  border-radius: 8px;
  padding: 8px 11px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dshnai-select {
  height: 36px;
  color-scheme: light dark;
}
.dshnai-input {
  height: 36px;
}
.dshnai-textarea {
  min-height: 74px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.5;
}
.dshnai-input:focus, .dshnai-select:focus, .dshnai-textarea:focus {
  outline: none;
  border-color: var(--dsw-alias-brand, #4d6bfe);
  box-shadow: 0 0 0 2px rgba(77, 107, 254, 0.2);
}
.dshnai-hint {
  margin: 0;
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.45;
}
.dshnai-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dshnai-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  cursor: pointer;
  user-select: none;
}
.dshnai-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--dsw-alias-brand, #4d6bfe);
}
.dshnai-btn {
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35));
  background: transparent;
  color: inherit;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.dshnai-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
}
.dshnai-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.dshnai-btn-primary {
  background: var(--dsw-alias-brand, #4d6bfe);
  border-color: transparent;
  color: #fff;
}
.dshnai-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-brand-strong, #3b5cf0);
}
.dshnai-btn-sm {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
}
.dshnai-btn-danger {
  color: #f25f5c;
  border-color: rgba(242, 95, 92, 0.45);
}
.dshnai-preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dshnai-preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.2));
  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.03));
}
.dshnai-preset-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dshnai-preset-name {
  font-size: 13px;
  font-weight: 600;
}
.dshnai-preset-tags {
  font-size: 12px;
  opacity: 0.72;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dshnai-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.dshnai-msg-ok {
  font-size: 13px;
  color: #2fb350;
}
.dshnai-msg-err {
  font-size: 13px;
  color: #f25f5c;
}
`;

    function useStyles() {
      useEffect(() => {
        if (typeof document === "undefined") return;
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS_TEXT;
        document.head.appendChild(style);
      }, []);
    }

    const MODEL_OPTIONS = [
      { value: "nai-diffusion-4-5-full", label: "NAI Diffusion V4.5 Full（推荐 · Opus 免费无限跑）" },
      { value: "nai-diffusion-4-5-curated", label: "NAI Diffusion V4.5 Curated（精选版）" },
      { value: "nai-diffusion-5-full", label: "NAI Diffusion V5 Full（最新 V5 完整版 · 消耗电池）" },
      { value: "nai-diffusion-5-full-medium", label: "NAI Diffusion V5 Full Medium（14步轻量版 · 省电池）" },
      { value: "nai-diffusion-5-curated", label: "NAI Diffusion V5 Curated（V5 精选版）" },
      { value: "nai-diffusion-4-full", label: "NAI Diffusion V4 Full" },
      { value: "nai-diffusion-4-curated-preview", label: "NAI Diffusion V4 Curated" },
      { value: "nai-diffusion-3", label: "NAI Diffusion Anime V3" },
      { value: "nai-diffusion-furry-3", label: "NAI Diffusion Furry V3" }
    ];

    const RESOLUTION_OPTIONS = [
      { value: "portrait", label: "竖图 Portrait (832 × 1216 · Opus 免费)" },
      { value: "landscape", label: "横图 Landscape (1216 × 832 · Opus 免费)" },
      { value: "square", label: "方图 Square (1024 × 1024 · Opus 免费)" },
      { value: "large_portrait", label: "大图竖屏 Large Portrait (1024 × 1536)" },
      { value: "large_landscape", label: "大图横屏 Large Landscape (1536 × 1024)" },
      { value: "wallpaper", label: "壁纸 Wallpaper (1920 × 1088)" }
    ];

    const SAMPLER_OPTIONS = [
      { value: "k_euler_ancestral", label: "Euler Ancestral (k_euler_ancestral · 推荐)" },
      { value: "k_euler", label: "Euler (k_euler)" },
      { value: "k_dpmpp_2s_ancestral", label: "DPM++ 2S Ancestral (k_dpmpp_2s_ancestral)" },
      { value: "k_dpmpp_2m_sde", label: "DPM++ 2M SDE (k_dpmpp_2m_sde)" },
      { value: "k_dpmpp_2m", label: "DPM++ 2M (k_dpmpp_2m)" },
      { value: "k_dpmpp_sde", label: "DPM++ SDE (k_dpmpp_sde)" }
    ];

    const SCHEDULE_OPTIONS = [
      { value: "karras", label: "Karras（推荐）" },
      { value: "native", label: "Native" },
      { value: "exponential", label: "Exponential" },
      { value: "polyexponential", label: "Polyexponential" }
    ];

    function NovelAISettingsPanel() {
      useStyles();

      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const [testing, setTesting] = useState(false);
      const [dirty, setDirty] = useState(false);
      const [message, setMessage] = useState(null);

      const [form, setForm] = useState({
        apiKeyInput: "",
        apiKeySet: false,
        apiKeyPreview: "",
        apiUrl: "https://image.novelai.net/ai/generate-image",
        subscriptionUrl: "https://image.novelai.net/user/subscription",
        defaultModel: "nai-diffusion-4-5-full",
        defaultResolution: "portrait",
        defaultArtistTags: "",
        defaultQualityTags: "masterpiece, best quality, very aesthetic, absurdres",
        defaultUc: "",
        defaultSteps: 28,
        defaultScale: 5,
        defaultCfgRescale: 0,
        defaultSampler: "k_euler_ancestral",
        defaultNoiseSchedule: "karras",
        defaultVarietyPlus: false,
        outputDir: "",
        artistPresets: {}
      });

      const [newPresetName, setNewPresetName] = useState("");
      const [newPresetTags, setNewPresetTags] = useState("");
      const [subStatus, setSubStatus] = useState(null);
      const [subError, setSubError] = useState(null);

      const applyServerConfig = useCallback((cfg) => {
        setForm({
          apiKeyInput: "",
          apiKeySet: Boolean(cfg.apiKeySet),
          apiKeyPreview: cfg.apiKeyPreview || "",
          apiUrl: cfg.apiUrl || "https://image.novelai.net/ai/generate-image",
          subscriptionUrl: cfg.subscriptionUrl || "https://image.novelai.net/user/subscription",
          defaultModel: cfg.defaultModel || "nai-diffusion-4-5-full",
          defaultResolution: cfg.defaultResolution || "portrait",
          defaultArtistTags: cfg.defaultArtistTags || "",
          defaultQualityTags: cfg.defaultQualityTags || "",
          defaultUc: cfg.defaultUc || "",
          defaultSteps: Number.isFinite(Number(cfg.defaultSteps)) ? Number(cfg.defaultSteps) : 28,
          defaultScale: Number.isFinite(Number(cfg.defaultScale)) ? Number(cfg.defaultScale) : 5,
          defaultCfgRescale: Number.isFinite(Number(cfg.defaultCfgRescale)) ? Number(cfg.defaultCfgRescale) : 0,
          defaultSampler: cfg.defaultSampler || "k_euler_ancestral",
          defaultNoiseSchedule: cfg.defaultNoiseSchedule || "karras",
          defaultVarietyPlus: Boolean(cfg.defaultVarietyPlus),
          outputDir: cfg.outputDir || "",
          artistPresets: cfg.artistPresets && typeof cfg.artistPresets === "object" ? { ...cfg.artistPresets } : {}
        });
        setDirty(false);
      }, []);

      const refreshStatus = useCallback(async (customKey, customSubUrl) => {
        setTesting(true);
        setSubError(null);
        try {
          const res = await fetch("/api/dsh-novelai/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(customKey ? { apiKey: customKey } : {}),
              ...(customSubUrl ? { subscriptionUrl: customSubUrl } : {})
            })
          });
          const data = await res.json();
          if (res.ok && data.ok) {
            setSubStatus(data.status);
          } else {
            setSubError(data.error || "连接失败");
          }
        } catch (err) {
          setSubError(String(err && err.message ? err.message : err));
        } finally {
          setTesting(false);
        }
      }, []);

      const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/dsh-novelai/config", { cache: "no-store" });
          const data = await res.json();
          if (res.ok && data.ok && data.config) {
            applyServerConfig(data.config);
            if (data.config.apiKeySet) {
              refreshStatus();
            }
          }
        } catch (err) {
          setMessage({ type: "err", text: "加载配置失败: " + String(err?.message || err) });
        } finally {
          setLoading(false);
        }
      }, [applyServerConfig, refreshStatus]);

      useEffect(() => {
        loadConfig();
      }, [loadConfig]);

      const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
        setMessage(null);
      };

      const handleAddPreset = () => {
        const name = newPresetName.trim();
        const tags = newPresetTags.trim();
        if (!name || !tags) return;
        setForm((prev) => ({
          ...prev,
          artistPresets: {
            ...prev.artistPresets,
            [name]: tags
          }
        }));
        setNewPresetName("");
        setNewPresetTags("");
        setDirty(true);
        setMessage(null);
      };

      const handleDeletePreset = (name) => {
        setForm((prev) => {
          const next = { ...prev.artistPresets };
          delete next[name];
          return { ...prev, artistPresets: next };
        });
        setDirty(true);
        setMessage(null);
      };

      const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
          const payload = {
            apiUrl: form.apiUrl,
            subscriptionUrl: form.subscriptionUrl,
            defaultModel: form.defaultModel,
            defaultResolution: form.defaultResolution,
            defaultArtistTags: form.defaultArtistTags,
            defaultQualityTags: form.defaultQualityTags,
            defaultUc: form.defaultUc,
            defaultSteps: Number(form.defaultSteps),
            defaultScale: Number(form.defaultScale),
            defaultCfgRescale: Number(form.defaultCfgRescale),
            defaultSampler: form.defaultSampler,
            defaultNoiseSchedule: form.defaultNoiseSchedule,
            defaultVarietyPlus: Boolean(form.defaultVarietyPlus),
            outputDir: form.outputDir,
            artistPresets: form.artistPresets
          };
          if (form.apiKeyInput.trim()) {
            payload.apiKey = form.apiKeyInput.trim();
          }

          const res = await fetch("/api/dsh-novelai/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.ok && data.config) {
            applyServerConfig(data.config);
            setMessage({ type: "ok", text: "✓ 配置已保存并实时生效！" });
            if (data.config.apiKeySet) {
              refreshStatus();
            }
          } else {
            setMessage({ type: "err", text: "保存失败: " + (data.error || res.statusText) });
          }
        } catch (err) {
          setMessage({ type: "err", text: "保存异常: " + String(err?.message || err) });
        } finally {
          setSaving(false);
        }
      };

      if (loading) {
        return h("div", { className: "dshnai-wrap" }, h("p", { className: "dshnai-hint" }, "正在加载 NovelAI 配置…"));
      }

      const presetEntries = Object.entries(form.artistPresets || {});

      return h(
        "div",
        { className: "dshnai-wrap" },

        // 1. Account Status Card
        h(
          "div",
          { className: "dshnai-card" },
          h(
            "div",
            { className: "dshnai-card-header" },
            h(
              "div",
              null,
              h("h3", { className: "dshnai-card-title" }, "🎨 NovelAI 账号与额度状态"),
              h("p", { className: "dshnai-card-desc" }, "实时查询 Opus 订阅状态、剩余 Anlas 点数与 V5 电池百分比。")
            ),
            h(
              "button",
              {
                type: "button",
                className: "dshnai-btn",
                disabled: testing,
                onClick: () => refreshStatus(form.apiKeyInput.trim(), form.subscriptionUrl)
              },
              testing ? "查询中…" : "🔄 测试连接 / 刷新额度"
            )
          ),
          subError
            ? h("div", { className: "dshnai-msg-err" }, "⚠️ " + subError)
            : subStatus
            ? h(
                "div",
                { className: "dshnai-status-grid" },
                h(
                  "div",
                  { className: "dshnai-stat-box" },
                  h("span", { className: "dshnai-stat-label" }, "订阅档位"),
                  h(
                    "span",
                    { className: "dshnai-stat-value" },
                    `${subStatus.tierName} ${subStatus.active ? "· 生效中" : "· 未激活"}`
                  ),
                  h(
                    "span",
                    { className: "dshnai-stat-sub" },
                    subStatus.expiresAt ? `到期: ${subStatus.expiresAt.slice(0, 10)}` : ""
                  )
                ),
                h(
                  "div",
                  { className: "dshnai-stat-box" },
                  h("span", { className: "dshnai-stat-label" }, "剩余 Anlas 点数"),
                  h("span", { className: "dshnai-stat-value" }, String(subStatus.totalAnlas)),
                  h(
                    "span",
                    { className: "dshnai-stat-sub" },
                    `月度固定: ${subStatus.fixedAnlas} / 永久: ${subStatus.purchasedAnlas}`
                  )
                ),
                h(
                  "div",
                  { className: "dshnai-stat-box" },
                  h("span", { className: "dshnai-stat-label" }, "V5 电池电量"),
                  h("span", { className: "dshnai-stat-value" }, `${subStatus.batteryPercent}%`),
                  h(
                    "span",
                    { className: "dshnai-stat-sub" },
                    `购买电量: ${subStatus.purchasedBatteryPercent}%`
                  )
                )
              )
            : h("p", { className: "dshnai-hint" }, "点击右上方「测试连接 / 刷新额度」查看当前账号点数与电池。")
        ),

        // 2. API & Credentials Card
        h(
          "div",
          { className: "dshnai-card" },
          h(
            "div",
            null,
            h("h3", { className: "dshnai-card-title" }, "🔑 接口与凭据配置"),
            h("p", { className: "dshnai-card-desc" }, "配置 NovelAI Persistent API Token (pst-...) 与接口地址。")
          ),
          h(
            "div",
            { className: "dshnai-field" },
            h(
              "label",
              { className: "dshnai-label" },
              h("span", null, "NovelAI Persistent API Key"),
              form.apiKeySet
                ? h("span", { className: "dshnai-badge dshnai-badge-ok" }, `已配置 (${form.apiKeyPreview})`)
                : h("span", { className: "dshnai-badge dshnai-badge-warn" }, "未配置密钥")
            ),
            h("input", {
              type: "password",
              className: "dshnai-input",
              placeholder: form.apiKeySet
                ? "已保存密钥，留空保持不变；输入新 pst-... 密钥可覆盖"
                : "请输入 pst-... 开头的 NovelAI Persistent API Token",
              value: form.apiKeyInput,
              onChange: (e) => updateField("apiKeyInput", e.target.value)
            }),
            h("p", { className: "dshnai-hint" }, "在 NovelAI 网页端 User Settings → Account → Get Persistent API Token 获取。")
          ),
          h(
            "div",
            { className: "dshnai-grid-2" },
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "生图接口地址 (API URL)"),
              h("input", {
                type: "text",
                className: "dshnai-input",
                value: form.apiUrl,
                onChange: (e) => updateField("apiUrl", e.target.value)
              })
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "订阅查询地址 (Subscription URL)"),
              h("input", {
                type: "text",
                className: "dshnai-input",
                value: form.subscriptionUrl,
                onChange: (e) => updateField("subscriptionUrl", e.target.value)
              })
            )
          ),
          h(
            "div",
            { className: "dshnai-field" },
            h("label", { className: "dshnai-label" }, "图片保存目录 (Output Directory)"),
            h("input", {
              type: "text",
              className: "dshnai-input",
              placeholder: "/root/.dsh/novelai/outputs",
              value: form.outputDir,
              onChange: (e) => updateField("outputDir", e.target.value)
            }),
            h("p", { className: "dshnai-hint" }, "生成的 PNG 原图会按日期（YYYY-MM-DD）子目录自动归档在此路径下。")
          )
        ),

        // 3. Default Generation Parameters Card
        h(
          "div",
          { className: "dshnai-card" },
          h(
            "div",
            null,
            h("h3", { className: "dshnai-card-title" }, "⚙️ 默认生图参数"),
            h(
              "p",
              { className: "dshnai-card-desc" },
              "对话中未显式指定参数时自动使用以下默认值；在对话中可随时传参临时覆盖。"
            )
          ),
          h(
            "div",
            { className: "dshnai-grid-2" },
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "默认生图模型 (Default Model)"),
              h(
                "select",
                {
                  className: "dshnai-select",
                  value: form.defaultModel,
                  onChange: (e) => updateField("defaultModel", e.target.value)
                },
                MODEL_OPTIONS.map((opt) => h("option", { key: opt.value, value: opt.value }, opt.label))
              )
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "默认画幅尺寸 (Default Resolution)"),
              h(
                "select",
                {
                  className: "dshnai-select",
                  value: form.defaultResolution,
                  onChange: (e) => updateField("defaultResolution", e.target.value)
                },
                RESOLUTION_OPTIONS.map((opt) => h("option", { key: opt.value, value: opt.value }, opt.label))
              )
            )
          ),
          h(
            "div",
            { className: "dshnai-grid-3" },
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "默认采样步数 (Steps, 1-50)"),
              h("input", {
                type: "number",
                min: 1,
                max: 50,
                className: "dshnai-input",
                value: form.defaultSteps,
                onChange: (e) => updateField("defaultSteps", e.target.value)
              }),
              h("p", { className: "dshnai-hint" }, "Opus 免费上限为 28 步")
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "引导强度 (CFG Scale)"),
              h("input", {
                type: "number",
                step: "0.1",
                min: 0,
                max: 20,
                className: "dshnai-input",
                value: form.defaultScale,
                onChange: (e) => updateField("defaultScale", e.target.value)
              }),
              h("p", { className: "dshnai-hint" }, "V4.5 / V5 推荐 4.5 ~ 6.0")
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "CFG Rescale (0 ~ 1)"),
              h("input", {
                type: "number",
                step: "0.05",
                min: 0,
                max: 1,
                className: "dshnai-input",
                value: form.defaultCfgRescale,
                onChange: (e) => updateField("defaultCfgRescale", e.target.value)
              }),
              h("p", { className: "dshnai-hint" }, "推荐 0 ~ 0.2")
            )
          ),
          h(
            "div",
            { className: "dshnai-grid-2" },
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "默认采样器 (Sampler)"),
              h(
                "select",
                {
                  className: "dshnai-select",
                  value: form.defaultSampler,
                  onChange: (e) => updateField("defaultSampler", e.target.value)
                },
                SAMPLER_OPTIONS.map((opt) => h("option", { key: opt.value, value: opt.value }, opt.label))
              )
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "默认噪声调度 (Noise Schedule)"),
              h(
                "select",
                {
                  className: "dshnai-select",
                  value: form.defaultNoiseSchedule,
                  onChange: (e) => updateField("defaultNoiseSchedule", e.target.value)
                },
                SCHEDULE_OPTIONS.map((opt) => h("option", { key: opt.value, value: opt.value }, opt.label))
              )
            )
          ),
          h(
            "label",
            { className: "dshnai-check" },
            h("input", {
              type: "checkbox",
              checked: Boolean(form.defaultVarietyPlus),
              onChange: (e) => updateField("defaultVarietyPlus", e.target.checked)
            }),
            h("span", null, "默认开启 Variety+ 多样性增强（skip_cfg_above_sigma: 19，仅 V4 / V4.5 支持）")
          )
        ),

        // 4. Prompts & Artist Presets Card
        h(
          "div",
          { className: "dshnai-card" },
          h(
            "div",
            null,
            h("h3", { className: "dshnai-card-title" }, "🖌️ 提示词基底与画师串预设"),
            h(
              "p",
              { className: "dshnai-card-desc" },
              "生图时自动按「前置画师串 + 主画面 Tag + 质量词后缀」拼接；可保存多套常用画师串预设随时点名调用。"
            )
          ),
          h(
            "div",
            { className: "dshnai-field" },
            h("label", { className: "dshnai-label" }, "默认前置画师串 (Default Artist Tags)"),
            h("input", {
              type: "text",
              className: "dshnai-input",
              placeholder: "留空则不自动加画师串；可直接填英文画师 Tag 或下方已存的预设名",
              value: form.defaultArtistTags,
              onChange: (e) => updateField("defaultArtistTags", e.target.value)
            })
          ),
          h(
            "div",
            { className: "dshnai-field" },
            h("label", { className: "dshnai-label" }, "默认质量词后缀 (Default Quality Tags)"),
            h("input", {
              type: "text",
              className: "dshnai-input",
              value: form.defaultQualityTags,
              onChange: (e) => updateField("defaultQualityTags", e.target.value)
            })
          ),
          h(
            "div",
            { className: "dshnai-field" },
            h("label", { className: "dshnai-label" }, "默认负面提示词 (Default Undesired Content / UC)"),
            h("textarea", {
              className: "dshnai-textarea",
              value: form.defaultUc,
              onChange: (e) => updateField("defaultUc", e.target.value)
            })
          ),

          // Artist Presets Manager
          h(
            "div",
            { className: "dshnai-field" },
            h("label", { className: "dshnai-label" }, `已保存的画师串预设 (${presetEntries.length})`),
            presetEntries.length === 0
              ? h("p", { className: "dshnai-hint" }, "暂无画师串预设，可在下方添加。")
              : h(
                  "div",
                  { className: "dshnai-preset-list" },
                  presetEntries.map(([pName, pTags]) =>
                    h(
                      "div",
                      { key: pName, className: "dshnai-preset-item" },
                      h(
                        "div",
                        { className: "dshnai-preset-info" },
                        h(
                          "span",
                          { className: "dshnai-preset-name" },
                          pName,
                          form.defaultArtistTags === pName
                            ? h("span", { className: "dshnai-badge dshnai-badge-ok", style: { marginLeft: 8 } }, "当前默认")
                            : null
                        ),
                        h("span", { className: "dshnai-preset-tags", title: pTags }, pTags)
                      ),
                      h(
                        "div",
                        { className: "dshnai-row" },
                        h(
                          "button",
                          {
                            type: "button",
                            className: "dshnai-btn dshnai-btn-sm",
                            onClick: () => updateField("defaultArtistTags", pName)
                          },
                          "设为默认"
                        ),
                        h(
                          "button",
                          {
                            type: "button",
                            className: "dshnai-btn dshnai-btn-sm dshnai-btn-danger",
                            onClick: () => handleDeletePreset(pName)
                          },
                          "删除"
                        )
                      )
                    )
                  )
                )
          ),
          h(
            "div",
            { className: "dshnai-grid-2" },
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "新预设名称"),
              h("input", {
                type: "text",
                className: "dshnai-input",
                placeholder: "如：清透幻想 / 厚涂1号 / 水彩风",
                value: newPresetName,
                onChange: (e) => setNewPresetName(e.target.value)
              })
            ),
            h(
              "div",
              { className: "dshnai-field" },
              h("label", { className: "dshnai-label" }, "画师串 Tag 内容"),
              h(
                "div",
                { className: "dshnai-row" },
                h("input", {
                  type: "text",
                  className: "dshnai-input",
                  style: { flex: 1 },
                  placeholder: "如：year 2024, official art, delicate lighting...",
                  value: newPresetTags,
                  onChange: (e) => setNewPresetTags(e.target.value)
                }),
                h(
                  "button",
                  {
                    type: "button",
                    className: "dshnai-btn",
                    disabled: !newPresetName.trim() || !newPresetTags.trim(),
                    onClick: handleAddPreset
                  },
                  "＋ 添加预设"
                )
              )
            )
          )
        ),

        // Footer Save Bar
        h(
          "div",
          { className: "dshnai-footer" },
          h(
            "div",
            null,
            message
              ? h(
                  "span",
                  { className: message.type === "ok" ? "dshnai-msg-ok" : "dshnai-msg-err" },
                  message.text
                )
              : dirty
              ? h("span", { className: "dshnai-hint" }, "有未保存的更改，请点击右侧保存。")
              : h("span", { className: "dshnai-hint" }, "所有更改保存后立即热生效，无需重启 DSH。")
          ),
          h(
            "div",
            { className: "dshnai-row" },
            h(
              "button",
              {
                type: "button",
                className: "dshnai-btn",
                disabled: saving || !dirty,
                onClick: loadConfig
              },
              "放弃修改"
            ),
            h(
              "button",
              {
                type: "button",
                className: "dshnai-btn dshnai-btn-primary",
                disabled: saving,
                onClick: handleSave
              },
              saving ? "保存中…" : "💾 保存配置"
            )
          )
        )
      );
    }

    const inject = ["slots"];
    const name = "dsh-novelai";

    function apply(ctx) {
      const slots = ctx.slots;
      if (!slots) return;
      const disposers = [];

      // 1. Register dedicated section in DSH Settings ("设置 → NovelAI 生图")
      disposers.push(
        slots.inject("settings.section", () =>
          slots.register(
            {
              name: "settings.section",
              id: "novelai",
              order: 8,
              label: "NovelAI 生图"
            },
            NovelAISettingsPanel
          )
        )
      );

      // 2. Register plugin row config in Installed Plugins ("插件 → 已安装 → dsh-novelai")
      disposers.push(
        slots.inject("plugins.row.config", () =>
          slots.register(
            {
              name: "plugins.row.config",
              key: "dsh-novelai#dsh-novelai"
            },
            (slotProps) =>
              slotProps && slotProps.view === "summary"
                ? "NovelAI V4.5 / V5 生图参数、API Key 与画师串预设配置"
                : h(NovelAISettingsPanel, null)
          )
        )
      );

      ctx.effect(() => () => {
        for (const d of disposers.reverse()) {
          try { d?.(); } catch {}
        }
      }, "dsh-novelai-client.settings");
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.name = name;
    return module.exports;
  }
});
