# OpenRouter Video Model Report
Generated: 2026-04-22T12:15:36.229Z
Total models on OpenRouter: 346

---

## Image-to-Video (i2v) Models: 0
_None found with image input + video output modalities._

## Text-to-Video (t2v) Models: 0
_None found with video output modality (non-image input)._

## All Video-Related Models (keyword + modality): 15
- **z-ai/glm-5v-turbo**
  - name: Z.ai: GLM 5V Turbo
  - modality: text+image+video->text
  - input: image, text, video
  - output: text
  - description: GLM-5V-Turbo is Z.ai’s first native multimodal agent foundation model, built for vision-based coding and agent-driven ta
- **arcee-ai/trinity-large-thinking**
  - name: Arcee AI: Trinity Large Thinking
  - modality: text->text
  - input: text
  - output: text
  - description: Trinity Large Thinking is a powerful open source reasoning model from the team at Arcee AI. It shows strong performance 
- **rekaai/reka-edge**
  - name: Reka Edge
  - modality: text+image+video->text
  - input: image, text, video
  - output: text
  - description: Reka Edge is an extremely efficient 7B multimodal vision-language model that accepts image/video+text inputs and generat
- **xiaomi/mimo-v2-omni**
  - name: Xiaomi: MiMo-V2-Omni
  - modality: text+image+audio+video->text
  - input: text, audio, image, video
  - output: text
  - description: MiMo-V2-Omni is a frontier omni-modal model that natively processes image, video, and audio inputs within a unified arch
- **amazon/nova-2-lite-v1**
  - name: Amazon: Nova 2 Lite
  - modality: text+image+file+video->text
  - input: text, image, video, file
  - output: text
  - description: Nova 2 Lite is a fast, cost-effective reasoning model for everyday workloads that can process text, images, and videos t
- **nvidia/nemotron-nano-12b-v2-vl:free**
  - name: NVIDIA: Nemotron Nano 12B 2 VL (free)
  - modality: text+image+video->text
  - input: image, text, video
  - output: text
  - description: NVIDIA Nemotron Nano 2 VL is a 12-billion-parameter open multimodal reasoning model designed for video understanding and
- **nvidia/nemotron-nano-12b-v2-vl**
  - name: NVIDIA: Nemotron Nano 12B 2 VL
  - modality: text+image+video->text
  - input: image, text, video
  - output: text
  - description: NVIDIA Nemotron Nano 2 VL is a 12-billion-parameter open multimodal reasoning model designed for video understanding and
- **qwen/qwen3-vl-32b-instruct**
  - name: Qwen: Qwen3 VL 32B Instruct
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Qwen3-VL-32B-Instruct is a large-scale multimodal vision-language model designed for high-precision understanding and re
- **qwen/qwen3-vl-8b-instruct**
  - name: Qwen: Qwen3 VL 8B Instruct
  - modality: text+image->text
  - input: image, text
  - output: text
  - description: Qwen3-VL-8B-Instruct is a multimodal vision-language model from the Qwen3-VL series, built for high-fidelity understandi
- **qwen/qwen3-vl-30b-a3b-thinking**
  - name: Qwen: Qwen3 VL 30B A3B Thinking
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Qwen3-VL-30B-A3B-Thinking is a multimodal model that unifies strong text generation with visual understanding for images
- **qwen/qwen3-vl-30b-a3b-instruct**
  - name: Qwen: Qwen3 VL 30B A3B Instruct
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Qwen3-VL-30B-A3B-Instruct is a multimodal model that unifies strong text generation with visual understanding for images
- **qwen/qwen3-vl-235b-a22b-thinking**
  - name: Qwen: Qwen3 VL 235B A22B Thinking
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Qwen3-VL-235B-A22B Thinking is a multimodal model that unifies strong text generation with visual understanding across i
- **qwen/qwen3-vl-235b-a22b-instruct**
  - name: Qwen: Qwen3 VL 235B A22B Instruct
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Qwen3-VL-235B-A22B Instruct is an open-weight multimodal model that unifies strong text generation with visual understan
- **z-ai/glm-4.5v**
  - name: Z.ai: GLM 4.5V
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: GLM-4.5V is a vision-language foundation model for multimodal agent applications. Built on a Mixture-of-Experts (MoE) ar
- **amazon/nova-lite-v1**
  - name: Amazon: Nova Lite 1.0
  - modality: text+image->text
  - input: text, image
  - output: text
  - description: Amazon Nova Lite 1.0 is a very low-cost multimodal model from Amazon that focused on fast processing of image, video, an

---

## Verdict

⚠️  OpenRouter lists 15 video-related model(s), but **none confirmed i2v**.
→ Use Runway SDK (already installed) as primary provider for image-to-video.
→ OpenRouter t2v models available as fallback for text-only prompts.