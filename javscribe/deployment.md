# 部署指南

一套代码、多份 profile 配置：`--profile <name>` 切换（默认读配置文件的 `profile` 字段；
`config/jav_scribe.example.json` 内置 `local` / `server` 两套示例）。

部署分两步：**先部署字幕服务**（跑在 GPU 机器上），**再部署字幕工作台**（浏览器入口）。
两者可以同机，也可以分机。

## 1. 硬件要求

| 项 | 要求 | 说明 |
|---|---|---|
| GPU（推荐） | NVIDIA 显存 ≥ 8G 可用 | 处理时约占用 4–6G，可与其他服务共卡；驱动 ≥ 525（ctranslate2 wheel 自带 CUDA 12 运行时） |
| 显存 4–6G | 可用，降精度 | `compute_type: int8` + 关闭 batching |
| CPU（无 N 卡） | 可用，慢 | 建议 int8；2.5h 影片数小时，可过夜批处理 |
| 磁盘 | ≥ 15G（Docker 形态） | 镜像 ~6G + 模型 ~3.4G |

## 2. 准备字幕引擎与模型

JavScribe 本体**不含任何模型**。它调用的是 **TransWithAI ChickenRice（海南鸡）**——
基于 faster-whisper (CTranslate2) 的日→中一步翻译工具，模型需要自备。

| 模型 | 用途 | 体积 |
|---|---|---|
| **海南鸡 v2** `whisper-large-v2-translate-zh-v0.2-st-ct2` | **主模型**：ja→zh 一步完成（ASR+翻译），5000h 日语数据微调 | ~3 GB |
| `Whisper-Vad-EncDec-ASMR-onnx` | 为安静/非语音素材调过的 VAD（这类素材非语音段多，建议保留） | <100 MB |
| `whisper-base`（仅 4 个 json 配置） | VAD 的 feature extractor，无需权重 | <1 MB |
| `whisper-ja-1.5B-ct2`（可选） | 日语**原文**转录（不翻译） | ~3 GB |
| 任意 LLM（可选，默认不用） | 字幕润色第二遍校对；任何 OpenAI 兼容端点 | 你已有 |

> ja→zh 主链路只靠「海南鸡」一个模型，**不需要 LLM 参与**；LLM 只是可选的润色第二遍。

### 方案 A：ChickenRice 发布包（推荐 Windows 本地）

1. 从 ChickenRice 仓库 Releases 下载**翻译版**包（含 `infer.exe` + VAD + 海南鸡 v2 模型）
2. 解压到固定目录，例如 `C:\Tools\ChickenRice\`
3. 配置里指向它：

```json
"infer": {
  "command": "C:\\Tools\\ChickenRice\\infer.exe",
  "model": "models",
  "device": "cpu"
}
```

### 方案 B：Python 源码（推荐 Linux GPU 服务器）

```bash
git clone --depth 1 --branch v1.9 https://github.com/TransWithAI/Faster-Whisper-TransWithAI-ChickenRice /opt/chickenrice
cd /opt/chickenrice
python3 -m pip install --break-system-packages faster-whisper ctranslate2 transformers librosa onnxruntime pyjson5 requests
python3 download_models.py      # VAD + whisper-base 配置（HF 不可达时自动回退 hf-mirror）
python3 download_models.py --hf-model chickenrice0721/whisper-large-v2-translate-zh-v0.2-st-ct2
```

配置指向：

```json
"infer": {
  "command": "python3 /opt/chickenrice/infer.py",
  "cwd": "/opt/chickenrice",
  "model": "models/whisper-large-v2-translate-zh-v0.2-st-ct2",
  "device": "cuda",
  "batch": true,
  "max_batch_size": 8
}
```

> **`log_level: "DEBUG"` 必须**：进度时间轴事件只在该级别打印。

### 方案 C：自下载模型

分别下载上表权重，放到 `models/` 子目录，`model` 指向具体目录（含 `config.json` + `model.bin` 的 CT2 格式）。

### 显存与设备选择

| 硬件 | 建议 | 说明 |
|---|---|---|
| NVIDIA ≥8G | `cuda` + `batch: true` | 甜点配置，fp16/bf16；24G 级卡 2.5h 影片约 5–15 分钟 |
| NVIDIA 4–6G | `cuda` + int8 | 降精度、关闭 batching |
| CPU | `cpu` + int8 | 可过夜批处理 |
| Linux + AMD | `amd`（ROCm/HIP） | 需 ROCm 环境 |

### 模型授权

模型权重**不属于 JavScribe 仓库**，由各自作者发布（海南鸡 v2 由 AI汉化组 社区训练发布，
whisper-large-v2 原模型为 MIT）。使用前请阅读 Hugging Face 模型卡 license；
权重只在你自己的机器上使用，无需对外分发。

## 3. 部署字幕服务

### Docker（NVIDIA GPU 服务器，推荐）

前置：Docker + compose v2 + nvidia-container-toolkit（自检：
`docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi`）。

```bash
# 1. 代码
git clone https://github.com/JavdBviewed/JavScribe.git /opt/JavScribe && cd /opt/JavScribe

# 2. 构建并启动（JAV_WATCH_DIR 改成你的影片落盘目录）
JAV_WATCH_DIR=/your/media/dir docker compose -f docker/docker-compose.yml up -d --build
```

首启自动下载模型（~3.4G）到宿主机 volume。可选环境变量：

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAV_WATCH_DIR` | `/media/jav` | 监听目录（BT/PT 落盘处），`.zh.srt` 生成在同级 |
| `JAV_MODELS_DIR` | `/opt/jav-scribe/models` | 模型权重存放目录（volume） |
| `JAV_PORT` | `8300` | 进度/上传 API 宿主机端口 |
| `JAVSCRIBE_API_KEY` | 空 | 设置 `/config`、`/scan` 鉴权（启用后见 [API 参考](./api)） |
| `JAVSCRIBE_HOST_ROOT` | 空 | 容器化扫描映射，建议 `/hostfs`（见下） |

**服务器访问不了 HuggingFace 时离线放模型**：在有网机器上跑 ChickenRice 的
`download_models.py`（两条命令同方案 B），把整个 `models/` 目录上传到
`/opt/jav-scribe/models/`，结构需为：

```
models/
├── whisper_vad.onnx
├── whisper_vad_metadata.json
├── whisper-large-v2-translate-zh-v0.2-st-ct2/   # model.bin 等 5 个文件
└── whisper-base/                                 # 4 个 json 配置
```

**容器化扫描宿主机目录**：compose 默认把宿主机根**只读**挂载在容器 `/hostfs`
（仅 `/scan` 链路可达，且需 API Key）。设置 `JAVSCRIBE_HOST_ROOT=/hostfs` 后，
扫描/入队对「容器内不存在的路径」会自动映射到宿主机同名路径，前端可以直接填
服务器上的目录（如 `/media/jav`）。

### Linux 手动（非 Docker）

```bash
git clone https://github.com/JavdBviewed/JavScribe && cd JavScribe && uv sync
# 1) 按上面方案 B 准备 ChickenRice 引擎与模型
# 2) 配置
cp config/jav_scribe.example.json ~/.jav_scribe/config.json
uv run jav-scribe serve --profile server     # 监听 watch.dirs + 进度接口 :8300
```

### Windows 本地（GUI / headless）

```bat
:: 1) 安装 uv (https://docs.astral.sh/uv/) + ffmpeg
:: 2) 按方案 A 准备 ChickenRice 发布包
copy config\jav_scribe.example.json %USERPROFILE%\.jav_scribe\config.json
::    按需修改 local profile: infer.command / watch.dirs / emby

:: GUI（拖拽批处理，带进度条/日志/修复面板）
uv sync --extra gui && run.bat

:: headless：一次性批处理 / 目录监听
uv run jav-scribe run "D:\Videos\JAV\某番号" --profile local
uv run jav-scribe watch --profile local

:: 本地算力不够时走远端（只传音频）：
uv run jav-scribe upload "D:\Videos\JAV\XXX-123.ts" --remote http://<服务器>:8300
```

## 4. 部署字幕工作台

工作台只有一个容器，纯静态前端 + 无状态聚合服务。

### 形态一：单机（工作台与服务同机，一个 compose）

```yaml
# docker-compose.yml（节选）
services:
  service:                    # JavScribe 字幕服务
    image: javscribe:latest
    # …模型卷、监听目录、GPU 直通（见 JavScribe 仓库 docker/）
    environment:
      JAVSCRIBE_API_KEY: "xxxx"
  web:
    image: javscribe-web:latest
    environment:
      JAV_ENGINES: "本地服务=http://service:8300"   # compose 网络内寻址
    ports: ["8400:8400"]
    volumes: [javweb-data:/data]
volumes: {javweb-data: {}}
```

### 形态二：多机（一个工作台 + N 个服务）

```bash
cd JavScribe/web
JAV_ENGINES="服务A=http://<IP_A>:8300,服务B=http://<IP_B>:8300" \
  docker compose -f docker/docker-compose.yml up -d --build
# 浏览器打开 http://<本机>:8400
```

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAV_ENGINES` | 空 | 出厂服务表：`名称=URL` 逗号分隔；启动时幂等合并，页面可再增删改 |
| `JAV_WEB_PORT` | `8400` | 工作台监听端口 |
| `JAV_POLL_INTERVAL_S` | `5` | 轮询服务间隔（秒） |
| `JAV_UPLOAD_MAX_GB` | `10` | 整片上传链路的大小上限 |
| `JAV_DATA_DIR` | `/data` | 服务登记表持久化目录（数据卷，含各服务 API Key） |

## 5. 配置参考

配置文件：`~/.jav_scribe/config.json`（Windows 为 `%USERPROFILE%\.jav_scribe\config.json`，
或 `--config` 指定）。支持 `profiles` 多套配置，完整字段见仓库
`config/jav_scribe.example.json`。

| 段 | 关键字段 | 说明 |
|---|---|---|
| `infer` | `command` / `model` / `device` / `batch` / `max_batch_size` / `log_level` | 字幕引擎命令与参数；`device` 取 auto/cuda/cpu/amd；**`log_level` 必须 DEBUG** |
| `subtitle` | `formats` / `lang_tag` / `naming` / `output_dir` / `skip_if_exists` / `overwrite` | 输出格式（srt）、语言标签（zh/ja/en/none）、命名策略（rename/keep）、是否跳过已有字幕 |
| `watch` | `dirs` / `interval_s` / `process_existing` | 监听目录、扫描间隔、是否追平存量文件 |
| `scan` | `video_exts` / `subtitle_patterns` / `recurse` | 文件夹扫描规则（默认 11 种视频扩展名、`.zh.srt`/`.srt` 判定、递归）；工作台「服务设置」可热调 |
| `polish` | `enabled` / `base_url` / `api_key` / `model` / `batch_lines` | 可选 LLM 润色第二遍（任意 OpenAI 兼容端点） |
| `emby` | `enabled` / `url` / `api_key` | 完成后触发 Emby Refresh |
| `jasna` | `enabled` / `command` / `output` | 可选马赛克修复（命令模板，`{path}`/`{stem}`/`{out}` 占位） |
| `progress` | `host` / `port` | serve 的进度接口监听地址（默认 8300） |

> 工作台「⚙ 服务设置」可在线修改的是**白名单**项（字幕语言/跳过策略/命名、
> 推理设备/模型/日志级别/批量、润色、Emby、JASNA）；服务器内部项
> （infer 命令、watch 目录、output_dir 等）不暴露，仍走配置文件。

## 6. 验证与日常使用

```bash
docker logs -f jav-scribe        # 首启先下模型，之后看到 "进度接口: http://...:8300"
curl http://127.0.0.1:8300/health
nvidia-smi                       # 处理任务时显存约 4–6G
```

- 影片丢进 `JAV_WATCH_DIR` → 自动处理 → 同级出现 `<片名>.zh.srt`（Emby 扫描即可挂上）
- 进度：`curl http://<服务器>:8300/jobs`，单任务 `/jobs/<id>`（含每个文件的时间轴进度）
- 远端影片：`jav-scribe upload 电影.mkv --remote http://<服务器>:8300`（本地抽 opus 上传，srt 回传）

## 7. 安全速览

- 8300 的**进度与上传接口无鉴权**（`PUT /upload` 接收音频并提交、`GET /jobs` 暴露任务与路径）：
  只暴露给内网/VPN；必须对外时前面加一层带鉴权的反向代理
- `GET/PUT /config` 与 `GET /scan` / `POST /scan/submit` 有 `X-Api-Key` 鉴权；
  `/scan` 可列举**服务机器上的任意目录**，敏感性与改配置相当，**切勿对外暴露**
- 工作台的详细接口与安全边界见 [API 参考](./api)
