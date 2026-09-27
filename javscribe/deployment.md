# 部署指南

一套代码、多份 profile 配置：`--profile <name>` 切换（默认读配置文件的 `profile` 字段；
`config/jav_scribe.example.json` 内置 `local` / `server` 两套示例）。

部署分两步：**先部署服务端**（跑在 GPU 机器上，headless），**再部署客户端**
（Docker Web 或桌面安装版，用户入口）。两者可以同机，也可以分机；
客户端与多种形态见 [§4](#4-部署客户端)。配置项全量清单（服务端环境变量 /
config.json / 服务设置白名单 / 客户端本机设置）见 [配置参考](./config)。

## 快速开始（两命令）

服务端（GPU 机器，有 Docker）：

```bash
git clone https://github.com/JavdBviewed/JavScribe.git /opt/JavScribe && cd /opt/JavScribe/docker
JAVSCRIBE_API_KEY="$(openssl rand -hex 16)" docker compose up -d   # 首启自动下模型 ~3.4G
```

客户端（Web 形态，任意内网机器；装桌面版则直接下载 exe/AppImage 即可）：

```bash
cd /opt/JavScribe/web
JAV_ENGINES="我的服务=http://<服务端IP>:8300" docker compose -f docker/docker-compose.yml up -d --build
# 浏览器打开 http://<本机>:8400 → 服务卡片「⚙ 服务设置」填刚才的 API Key → 扫描目录入队
```

其余细节按下面章节展开。

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

**CI 预构建镜像（推荐，服务端免构建）**：`serve-v*` tag 触发 CI 发布
`ghcr.io/javdbviewed/jav-scribe-serve` 镜像，compose 已默认指向它：

```bash
# 1. 代码（只需要 compose 文件）
git clone https://github.com/JavdBviewed/JavScribe.git /opt/JavScribe && cd /opt/JavScribe/docker

# 2. 拉取预构建镜像并启动（JAV_WATCH_DIR 改成你的影片落盘目录）
JAV_WATCH_DIR=/your/media/dir \
JAVSCRIBE_API_KEY="$(openssl rand -hex 16)" \
docker compose pull && docker compose up -d
```

离线 / 改引擎版本时本地构建：`docker compose up -d --build`（build 段仍保留）。
首启自动下载模型（~3.4G）到宿主机 volume。

**`JAVSCRIBE_API_KEY`（强烈建议首启就设）**：`/config`（服务设置）与
`/scan`（扫描目录）的鉴权 Key。不设也能跑任务/看看板，但客户端的
「⚙ 服务设置」「扫描目录」会提示「该服务尚未设置 API Key」。
设了之后在客户端登记服务时填同一个值。

常用环境变量（全量清单见 [配置参考](./config)）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAVSCRIBE_API_KEY` | 空（不鉴权） | `/config`、`/scan` 鉴权 Key，**想用端「服务设置」「扫描目录」必须设置** |
| `JAV_WATCH_DIR` | `/media/jav` | 监听目录（BT/PT 落盘处），`.zh.srt` 生成在同级 |
| `JAV_MODELS_DIR` | `/opt/jav-scribe/models` | 模型权重存放目录（volume，跨重建保留） |
| `JAV_DATA_DIR` | `/opt/jav-scribe/data` | 持久化数据目录：活动 profile 配置 + inbox（音轨/字幕缓存） |
| `JAV_PORT` | `8300` | 进度/上传 API 宿主机端口 |
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

### 服务端升级

```bash
cd /opt/JavScribe/docker
docker compose pull      # 拉新版镜像；或把 image 钉到具体 tag（如 :v0.2.5）
docker compose up -d     # 重建容器
```

- 数据卷保留活动配置与 inbox，模型卷不受影响（不重复下载）；
- **任务状态随重启清空**（服务端内存设计，见 [常见问题](./faq)）——
  升级前建议先在客户端「⏸ 暂停所有」，升级后「▶ 继续任务」；
- 版本比对：客户端服务卡片会显示服务端当前版本与最新版本（落后时提示）。

## 4. 部署客户端

客户端是同一产品、两种形态（界面/交互/版本号完全一致，同号同 commit 发布）：
**Docker（Web，默认端口 8400）** 与 **桌面安装版**（从 GitHub Release 下载
exe / AppImage / deb，装哪台电脑，扫描与写回就以哪台为准）。

### Docker · 形态一：单机（客户端与服务同机，一个 compose）

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

> 无外网部署机：本地 `docker compose up -d --build`（或 `docker build`）构建镜像即可，
> 运行期不需要外网（更新检查失败会静默降级，不影响使用）。

### Docker · 形态二：多机（一个客户端 + N 个服务端）

```bash
cd JavScribe/web
JAV_ENGINES="服务A=http://<IP_A>:8300,服务B=http://<IP_B>:8300" \
  docker compose -f docker/docker-compose.yml up -d --build
# 浏览器打开 http://<本机>:8400
```

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAV_ENGINES` | 空 | 出厂服务表：`名称=URL` 逗号分隔；启动时幂等合并，页面可再增删改 |
| `JAV_WEB_PORT` | `8400` | 客户端监听端口 |
| `JAV_POLL_INTERVAL_S` | `5` | 轮询服务端间隔（秒） |
| `JAV_UPLOAD_MAX_GB` | `10` | 整片上传链路的大小上限 |
| `JAV_DATA_DIR` | `/data` | 持久化目录（数据卷：服务登记表 + 各服务 API Key + 本机派发记录） |

### 桌面安装版

- 从 JavScribe 仓库 GitHub Release（`client-vX.Y.Z`）下载对应平台包：
  Windows 安装包/便携版、Linux AppImage/deb
- 装好后打开即本页面同款界面；「扫描目录」扫描**本电脑**目录，
  完成后字幕直接写回本机影片旁，无需浏览器
- 多个客户端（Web/桌面）可以登记同一批服务端；他端提交的任务以「他端」标记显示

## 5. 配置参考

配置分三处，全量清单、默认值与逐项说明见 **[配置参考](./config)**：

1. **服务端环境变量**（部署时，`JAVSCRIBE_API_KEY` / `JAV_PORT` / 各目录卷…）；
2. **服务端 config.json**（`~/.jav_scribe/config.json`，支持 `profiles` 多套；
   完整字段见仓库 `config/jav_scribe.example.json`；**`infer.log_level` 必须 DEBUG**）；
3. **「⚙ 服务设置」白名单**（客户端页面可热改：字幕命名/跳过策略、推理设备/模型/
   转译并发/批量、VAD、润色、Emby、JASNA、扫描规则、缓存保留期；**服务端级**，
   对所有连到该服务的客户端生效）+ **客户端本机设置**（音轨提取并发、服务队列上限，
   只约束本客户端）。

服务器内部项（`infer.command/cwd`、`watch.*`、`jasna.command` 等）不暴露给页面，仍走配置文件。

## 6. 验证与日常使用

```bash
docker logs -f jav-scribe        # 首启先下模型，之后看到 "进度接口: http://...:8300"
curl http://127.0.0.1:8300/health
nvidia-smi                       # 处理任务时显存约 4–6G
```

- 影片丢进 `JAV_WATCH_DIR` → 自动处理 → 同级出现 `<片名>.zh.srt`（Emby 扫描即可挂上）
- 进度：`curl http://<服务器>:8300/jobs`，单任务 `/jobs/<id>`（含每个文件的时间轴进度）；客户端看板同源聚合
- 远端影片：`jav-scribe upload 电影.mkv --remote http://<服务器>:8300`（本地抽 opus 上传，srt 回传）

## 7. 安全速览

- 8300 的**进度与上传接口无鉴权**（`PUT /upload` 接收音频并提交、`GET /jobs` 暴露任务与路径）：
  只暴露给内网/VPN；必须对外时前面加一层带鉴权的反向代理
- `GET/PUT /config` 与 `GET /scan` / `POST /scan/submit` 有 `X-Api-Key` 鉴权；
  `/scan` 可列举**服务机器上的任意目录**，敏感性与改配置相当，**切勿对外暴露**
- 客户端的详细接口与安全边界见 [API 参考](./api)
