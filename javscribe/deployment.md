# 部署指南

一套代码、多份 profile 配置：`--profile <name>` 切换（默认读配置文件的 `profile` 字段；
`config/jav_scribe.example.json` 内置 `local` / `server` 两套示例）。

部署分两步：**先部署服务端**（跑在 GPU 机器上，headless），**再部署客户端**
（Docker Web 或桌面安装版，用户入口）。两者可以同机，也可以分机；
客户端与多种形态见 [部署客户端](#deploy-client)。配置项全量清单（服务端环境变量 /
config.json / 服务设置白名单 / 客户端本机设置）见 [配置参考](./config)。

## 先选择发布来源

客户端 `client-v0.2.66` 有公开正式 Release，Web 与桌面端共用 `client-v*` 版本体系，**没有独立 `web-v*` tag**。服务端 `serve-v0.2.16` 已核实源码 tag 的行为，但对应公开 Release 安装包未核到；不能仅凭 tag 或下方 Compose 中的 `:latest` 断言存在可用的该版本预构建镜像。请先查看 [JavScribe Releases](https://github.com/JavdBviewed/JavScribe/releases) 当次的服务端资产与镜像说明。要复现本文提到的 `serve-v0.2.16` 行为，使用该源码 tag 自行构建，不能以公开旧版服务端包替代。

服务端固定源码部署：在自己的服务端工作目录取得 `serve-v0.2.16` tag，检查 `docker/docker-compose.yml` 的 `build` 上下文、持久卷、监听端口及 GPU 需求，再按“部署字幕服务”构建；客户端 Web 在**单独的工作目录**取得 `client-v0.2.66` tag，使用 `web/docker/docker-compose.yml` 从本地构建。两套 Compose 是独立项目，不要把不同 tag 的代码混用为一套不经检查的单机文件。

同机部署时，Web 容器中的 `127.0.0.1` 指 Web 容器自身，**不是** Serve 容器；使用 Web 容器实际可访问的 Serve 地址，并限制服务仅内网/VPN 可达。客户端部署目录和模型、媒体目录应分别核对，不能将服务器文件路径误当浏览器电脑路径。

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

固定 tag `serve-v0.2.16` 的 `docker/docker-compose.yml` 中，服务端镜像字段为
`ghcr.io/javdbviewed/jav-scribe-serve:latest`，并保留本地 `build` 配置；
**该源码 tag 并不能证明对应 GHCR 镜像或公开 Release 资产已上线**。
选择该源码版本时，请从单独工作目录检出 `serve-v0.2.16`，先核实模型和持久卷配置，再本地构建：

```bash
# 在独立的 JavScribe 服务端源码工作目录，已检出 serve-v0.2.16
# 先为 JAVSCRIBE_API_KEY、JAV_WATCH_DIR 等配置真实值并确认持久化
docker compose -f docker/docker-compose.yml up -d --build
```

这是需自行准备环境与配置的**源码构建示例**，不是可直接复制的服务端安装脚本；缺少引擎、模型或 GPU 环境时先按本页下文逐项处理。使用预构建镜像前，必须另外核对该镜像的公开来源与实际版本，不要将 `latest` 视为 `serve-v0.2.16`。

**`JAVSCRIBE_API_KEY`（强烈建议首启就设）**：服务端 `/config` 与服务端
`/scan` 等接口的鉴权 Key；在客户端登记服务时填同一个值以使用受保护的服务设置。
`client-v0.2.66` 工作台的「扫描目录」由**客户端部署机本地扫描**完成，
不能把该按钮描述成必须调用服务端 `/scan` 或必须设置此 Key。
**该 Key 不保护整个服务**：上传、进度等接口仍可能不要求 Key，绝不应当把服务直接暴露到公网。

常用环境变量（全量清单见 [配置参考](./config)）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAVSCRIBE_API_KEY` | 空 | 服务端 `/config`、`/scan` 等受保护接口的 Key，不是全站登录；新版工作台本地扫描不依赖服务端 `/scan` |
| `JAV_WATCH_DIR` | `/media/jav` | 监听目录（BT/PT 落盘处），`.zh.srt` 生成在同级 |
| `JAV_MODELS_DIR` | `/opt/jav-scribe/models` | 模型权重存放目录（volume，跨重建保留） |
| `JAV_DATA_DIR` | `/opt/jav-scribe/data` | 持久化数据目录：活动 profile 配置 + inbox（音轨/字幕缓存） |
| `JAV_PORT` | `8300` | 进度/上传 API 宿主机端口 |
| `JAVSCRIBE_HOST_ROOT` | 空 | Serve `/scan` 和 Web 工作台本地扫描分别在各自容器内解析宿主机路径；须在对应容器中配置并挂载目录（见下） |
| `JAV_PROXY` | 空 | 外网代理地址（占位示例 `http://proxy.example.com:10808`），首启下模型等外网出站走代理（见下） |
| `JAV_NO_PROXY` | 空 | 追加不走代理的地址（逗号分隔，支持 CIDR）；内网网段默认已豁免 |

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

**外网代理（`JAV_PROXY`，机器不能直连外网时用）**：服务器只有内网 + 代理时，
设置代理地址，首启的模型下载（~3.4G）与容器内其他外网出站都会走代理：

```bash
JAV_PROXY=http://proxy.example.com:10808 \
JAV_WATCH_DIR=/your/media/dir \
docker compose up -d
```

- entrypoint 会把该代理注入容器全局（下载与运行时出站共用）。
- **内网自动豁免**：localhost / 10.0.0.0/8 / 172.16.0.0/12 / 192.168.0.0/16 等
  不走代理，内网互访不受影响；需要额外豁免用 `JAV_NO_PROXY`（逗号分隔，支持 CIDR）。
- 非 Docker 部署（手动 / exe）：导出 `HTTPS_PROXY`/`HTTP_PROXY` 即可，引擎模型
  下载（HF → hf-mirror 回退 + 429 重试）遵循系统代理。

**路径映射分属两个容器**：固定 `serve-v0.2.16` 的 Compose 默认把服务端宿主机根目录
只读挂载到 Serve 容器 `/hostfs`。在 **Serve 容器**设置 `JAVSCRIBE_HOST_ROOT=/hostfs`
后，服务端 `/scan` 对容器内不存在的路径可尝试映射到该宿主机目录。此接口受服务端
API Key 保护；宿主机根目录挂载仍有暴露风险，不要仅为工作台本地扫描开启它。

`client-v0.2.66` 的 **Web 工作台**「扫描目录（客户端部署机）」则在 **Web 容器**
读取自己的 `JAVSCRIBE_HOST_ROOT`：路径在容器内不存在时，才尝试解析 Web 容器已挂载
的宿主机路径。两个容器即使同机也不会共享变量或卷；Serve 的挂载不能让 Web 容器
读取媒体文件。Web Compose 默认只挂载 `/data`，如需扫描影片，请按实际客户端部署机
目录在 **Web Compose** 中明确挂载媒体路径，并确认 Web 容器内进程有对应读权限。
若映射仅为只读，扫描可以列出文件，但完成的字幕**不能写回**该源目录；需要自动落位
时，应在限定的目标媒体目录上有意识地配置读写挂载、核对容器用户权限，避免为方便
写回而暴露整个宿主机根目录。文件路径的两个入口详见[工作台](./workbench)。

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

- 升级前备份服务端持久化配置、任务历史数据目录、模型卷与工作台服务登记表；确认所选版本的公开 Release/源码 tag 与 Compose 配置。不要对 `serve-v0.2.16` 直接执行 `docker compose pull` 并将 `:latest` 当成该版本。
- **仅针对 `serve-v0.2.16` 源码/自行构建版本**：服务端把任务历史保存到持久数据目录的 `jobs.json`；重启后只恢复文件中已处于终态的任务历史（受历史上限和清理影响），**未完成/在途任务不会恢复执行，需重新提交**。这不是对其他公开旧版安装包的承诺，升级前应尽量等待在途任务完成。
- 保留 Compose 配置中的服务端数据卷与模型卷；本地构建需先核对该版本源码及配置，重建后核对 `/health`、任务历史和实际输出。仅“暂停所有”不会让在途任务在重启后自动续跑，详情见[常见问题](./faq)。
- 版本比对：客户端服务卡片会显示服务端当前版本与最新版本（落后时提示）。

## 4. 部署客户端 {#deploy-client}

客户端是同一产品、两种形态（界面/交互/版本号完全一致，同号同 commit 发布）：
**Docker（Web，默认端口 8400）** 与 **桌面安装版**（从 [JavScribe Releases](https://github.com/JavdBviewed/JavScribe/releases) 核对对应 `client-v*` 的实际资产，装哪台电脑，扫描与写回就以哪台为准）。Web 与桌面共用 `client-v*`，没有单独的 `web-v*` tag。

### Docker · 形态一：服务与 Web 同机

不要使用旧文档中的 `image: javscribe:latest` 单文件节选：它既不是固定 tag 服务端 Compose 的镜像名，也没有模型、数据卷和 GPU 配置，不能直接部署。分别使用 Serve 源码 tag 的 `docker/docker-compose.yml` 与 Client 源码 tag 的 `web/docker/docker-compose.yml`；两者是**独立 Compose 项目**，即使部署在同一宿主机也不会自动共享 Docker 网络。按上文先配置并构建 Serve，再配置和构建 Web；Web 的 `JAV_ENGINES` 要填写**Web 容器能够访问**的 Serve 地址，不要用 `127.0.0.1:8300` 指代另一个容器。

固定 `client-v0.2.66` 的 Web Compose 从 `web/docker/Dockerfile` **本地构建** `javscribe-web:latest`，通过 `JAV_WEB_DATA_DIR` 持久化服务登记表，并映射 8400 和可配置的 8443 TLS 端口。该 `javscribe-web:latest` 是本机生成的镜像名，不代表存在独立发布的 Web 镜像。部署机目录扫描读取的是**Web 客户端部署机**可访问的路径，和 Serve 的模型卷、浏览器电脑本地目录是三种不同位置；路径见[工作台](./workbench)。

### Docker · 形态二：多机（一个客户端 + N 个服务端）

```bash
# 在已检出 client-v0.2.66 的独立 Web 客户端源码目录
# 服务地址须改为 Web 容器实际可访问的内网/VPN 地址
JAV_ENGINES="服务A=http://<服务A内网地址>:8300,服务B=http://<服务B内网地址>:8300" \
  docker compose -f docker/docker-compose.yml up -d --build
```

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAV_ENGINES` | 空 | 出厂服务表：`名称=URL` 逗号分隔；启动时幂等合并，页面可再增删改 |
| `JAV_WEB_PORT` | `8400` | 客户端监听端口 |
| `JAV_POLL_INTERVAL_S` | `5` | 轮询服务端间隔（秒） |
| `JAV_UPLOAD_MAX_GB` | `10` | 客户端上传请求的大小限制；通常上传抽取的音轨 |
| `JAV_WEB_DATA_DIR` | `/opt/jav-scribe-web/data` | Web Compose 的宿主机数据目录，挂载到容器 `/data`，保存服务登记表等 |
| `JAV_WEB_TLS_PORT` | `8443` | Web Compose 的 HTTPS 端口（自签证书），浏览器写回源目录能力需安全上下文 |

### 桌面安装版

- 从 [JavScribe Releases](https://github.com/JavdBviewed/JavScribe/releases) 中核对 `client-v*` 的实际平台资产和发布说明；`client-v0.2.66` 已有公开正式 Release
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

- **`JAVSCRIBE_API_KEY` 不是全站鉴权**：固定 `serve-v0.2.16` 源码中，`/config`、`/scan` 等特定管理/扫描接口校验 `X-Api-Key`；进度、上传等接口不受这个 Key 保护，可能暴露任务路径或允许提交音轨。
- 8300 服务端和 8400/8443 工作台只对可信内网/VPN 开放；如必须跨公网访问，在入口另加带身份认证的反向代理、HTTPS 与访问限制。不要仅因设置了 Key 就把端口直接暴露到公网。
- `/scan` 涉及目录读取，尤其当 Compose 还映射宿主机根目录时，应额外收紧卷挂载和网络访问。不要在页面示例、截图、公开日志或仓库中展示真实 Key。
- 客户端的详细接口与安全边界见 [API 参考](./api)
