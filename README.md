# dsh-novelai

Configurable **NovelAI** image generation plugin for **DeepSeek Harness (DSH)** — supporting NAI Diffusion **V4.5 (Full / Curated)**, **V5 (Full / Medium / Curated)**, **V4**, and **V3**, with multi-character independent coordinate prompts, named artist tag presets, Director Reference, Img2Img, Anlas/V5 Battery status queries, and a native DSH Web Settings UI.

## Features

1. **Web Settings Panel (`设置 → NovelAI 生图` & `插件 → dsh-novelai`)**:
   - Configure your NovelAI Persistent API Token (`pst-...`), API endpoints, and image archive directory.
   - Real-time **Opus subscription, Anlas balance, and V5 Battery percentage** status card with one-click connectivity test.
   - Configure default model, resolution, sampling steps, CFG scale, CFG rescale, sampler, noise schedule, and Variety+.
   - Manage **Default Artist Tags**, **Quality Tags**, **Undesired Content (UC)**, and a library of named **Artist Tag Presets**.

2. **Three Built-in Agent Tools**:
   - `nai_generate`:
     - Supports `nai-diffusion-4-5-full` (default, 0 Anlas on Opus for `<= 28` steps at `832x1216` / `1216x832` / `1024x1024`), `nai-diffusion-4-5-curated`, `nai-diffusion-5-full`, `nai-diffusion-5-full-medium` (auto-enforces 14 steps & official UC), `nai-diffusion-5-curated`, `nai-diffusion-4-full`, and `nai-diffusion-3`.
     - Multi-character independent prompts (`characters: [{ prompt, uc, position }]`) with 5×5 grid coordinates (`A1`–`E5`, or `left` / `right` / `center`) to prevent color/outfit bleed across characters.
     - Automatic prompt assembly (`artist_tags + prompt + quality_tags`) with named artist preset resolution.
     - Supports `img2img` and V4.5 Precise Reference (`director_reference`).
   - `nai_status`: Query live subscription tier, Anlas balance, V5 Battery percentage, and active default configuration.
   - `nai_config`: Update default settings or save/delete named artist presets directly from chat.

## Installation

```bash
dsh plugin --profile web add github:xueyue33/dsh-novelai
```

## License

MIT
