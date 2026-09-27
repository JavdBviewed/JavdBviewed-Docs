# 配置参考

配置分三处，作用范围与生效方式各不相同，先分清再改：

| 位置 | 谁来改 | 作用范围 | 持久化与生效 |
|---|---|---|---|
| 服务端环境变量（`serve` 部署时） | 部署者（compose / `.env`） | 该服务端实例 | 部署时设置，**改后需重启容器** |
| 服务端「⚙ 服务设置」（白名单项） | 任一客户端（需 API Key） | **所有**连到该服务的客户端 | 写回服务端配置文件 + 内存热更，**对新提交的任务生效**，运行中任务不受影响 |
| 客户端本机设置 | 本客户端使用者 | 仅本客户端（本机 ffmpeg / 本机队列） | 客户端数据卷（Web 形态）/ 本机（安装版），保存即生效 |

> 原则：**跑不跑得动的参数**（引擎命令、监听目录、端口）走服务端环境变量/配置文件；
> **产出质量的参数**（字幕命名、跳过策略、设备、模型、润色）走「服务设置」白名单，
> 页面上就能改，不用登服务器。

## 1. 服务端环境变量（serve）

Docker 部署时通过 compose `environment` 或 `.env` 提供：

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAVSCRIBE_API_KEY` | 空（不鉴权） | `/config`、`/scan` 鉴权 Key。**想使用端「服务设置」「扫描目录」，服务端必须设置它**，客户端登记时填同一个值 |
| `JAV_PORT` | `8300` | 进度/上传 API 宿主机端口 |
| `JAV_WATCH_DIR` | `/media/jav` | 服务端 `watch` 监听的落盘目录（客户端链路不依赖它） |
| `JAV_MODELS_DIR` | `/opt/jav-scribe/models` | 模型权重目录（volume；首启自动下载 ~3.4G） |
| `JAV_DATA_DIR` | `/opt/jav-scribe/data` | 持久化数据目录：活动 profile 配置 + inbox（上传音轨 / 字幕缓存），镜像重建不丢 |
| `JAV_HOSTFS` | `/` | 宿主机根**只读**挂载到容器 `/hostfs`（仅 `/scan` 链路可达；安全边界见 [API 参考](./api)） |
| `JAVSCRIBE_HOST_ROOT` | 空（关闭） | 容器化扫描路径映射：设为 `/hostfs` 后，对「容器内不存在」的绝对路径透明映射到 `/hostfs/<路径>`。字面可见路径永远优先 |
| `JAVSCRIBE_PROFILE` | 配置文件 `profile` 字段 | 活动配置 profile（`local` / `server` / 自定义） |
| `JAVSCRIBE_CONFIG` | `~/.jav_scribe/config.json` | 配置文件路径 |
| `JAVSCRIBE_INBOX_DIR` | 数据目录下 `inbox/` | 上传音轨落盘目录（细调用，一般不动） |
| `JAVSCRIBE_EMBY_API_KEY` | 空 | `emby.api_key` 的环境变量形态（与配置文件二选一） |
| `JAVSCRIBE_LLM_API_KEY` | 空 | `polish.api_key` 的环境变量形态（与配置文件二选一） |

最小部署只需 `JAV_WATCH_DIR`（或不用 watch 就不设）+ `JAVSCRIBE_API_KEY`（推荐），其余默认即可。

## 2. 服务端配置文件（config.json）

`~/.jav_scribe/config.json`（`--config` 可指定），支持 `profiles` 多套配置，
完整字段与注释见仓库 [`config/jav_scribe.example.json`](https://github.com/JavdBviewed/JavScribe/blob/main/config/jav_scribe.example.json)。

| 段 | 关键字段（默认） | 说明 |
|---|---|---|
| `infer` | `command` / `cwd` / `model`（海南鸡 v2）/ `device`（auto）/ `concurrency`（1）/ `batch`（false）/ `max_batch_size`（8）/ `log_level`（DEBUG） | 字幕引擎命令与参数；`command`/`cwd` 属服务端内部项，**不暴露给页面**；**`log_level: DEBUG` 必须**（进度时间轴事件依赖） |
| `subtitle` | `formats`（srt）/ `lang_tag`（zh）/ `naming`（rename）/ `output_dir`（空=源片同目录）/ `skip_if_exists`（true）/ `overwrite`（false）/ `skip_embedded`（target）/ `embedded_langs`（zh）/ `tag_formats`（srt,vtt）/ `marker`（true） | 输出格式、语言标签、命名策略、跳过判定、JavScribe 指纹（srt 尾部注释，幂等） |
| `watch` | `dirs` / `interval_s`（10）/ `process_existing`（false） | 服务端自监听（客户端链路不用） |
| `scan` | `video_exts`（11 种）/ `subtitle_patterns`（.zh.srt, .srt）/ `recurse`（true） | `/scan` 扫描规则；「服务设置」可热调 |
| `polish` | `enabled`（false）/ `base_url` / `model` / `batch_lines`（60）/ `timeout_s`（600）/ `api_key` | 可选 LLM 润色第二遍（任意 OpenAI 兼容端点） |
| `emby` | `enabled`（false）/ `url` / `api_key` | 完成后触发 Emby Refresh |
| `jasna` | `enabled`（false）/ `command` / `output`（`{stem}_restored{ext}`） | 可选 JASNA 降噪修复；`command` 为服务端内部项 |
| `storage` | `retention_days`（7） | inbox（音轨/字幕缓存）自动清理周期；影片旁成品字幕不受影响 |
| `progress` | `host`（0.0.0.0）/ `port`（8300） | 进度/上传 API 监听地址（容器内端口固定 8300） |

## 3. 「⚙ 服务设置」白名单（页面可改，服务端级）

点服务卡片的「⚙ 服务设置」可在线修改的**就是**下表（服务端 `PUT /config`
逐类型校验后写回活动 profile 段 + 内存热更；**对所有连到该服务的客户端生效**，
页面有横幅提示）。页面每项带「?」悬浮说明，此处为全量清单：

### 字幕（命名 / 跳过 / 指纹）

| 设置项 | 默认 | 说明 |
|---|---|---|
| 字幕语言标签 | `zh` | 加在片名后的标签：`<片名>.zh.srt`。客户端下载/写回按该标签匹配，无特殊需求保持 `zh` |
| 输出命名方式 | `rename` | `rename` = 统一 `<片名>.<标签>.srt`（推荐）；`keep` = 保留引擎原始输出名 |
| 输出格式 | `srt` | 逗号分隔，成员限 srt/vtt/lrc；**必须含 srt**（客户端链路按 srt 交付） |
| 语言标签适用扩展名 | `srt, vtt` | 这些格式落位时加语言标签，其它格式保留引擎原文件名 |
| 输出目录（服务端路径） | 空 | 空 = 与源视频同目录（推荐）；远端任务填了本地路径客户端也取不到 |
| 字幕已存在时跳过 | 开 | 目标字幕已存在 → 直接跳过，不重复生成 |
| 覆盖已存在字幕 | 关 | 与「已存在时跳过」同开时覆盖优先 |
| 内嵌字幕时跳过 | `target` | `off` 永不跳 / `target` 仅内嵌轨命中目标语言时跳（推荐）/ `any` 有任意内嵌轨就跳 |
| 内嵌字幕目标语言 | `zh` | `target` 模式用的命中语言，逗号分隔 |
| 字幕写入 JavScribe 指纹 | 开 | srt 尾部追加指纹（注释 + 0 时长 cue），用于识别本工具产出；幂等 |

### 推理引擎

| 设置项 | 默认 | 说明 |
|---|---|---|
| 推理设备 | 部署时设定（compose 里常为 `cuda`） | `cuda` GPU 推理 / `cpu` 纯 CPU（慢很多）/ `auto` 引擎自选 |
| 字幕模型 | 海南鸡 v2 目录 | 模型目录/名；改名前需确认服务端已有该模型 |
| **转译并发数** | `1`（1~4） | 服务端**同时转译的任务数** = 并行模型实例数；每实例约 4~6GB 显存（GPU 模式）。显存充足（如 24G 卡）调 2~3 提升整批吞吐，单任务耗时基本不变；显存不足会 OOM，按显卡调整 |
| 日志级别 | `DEBUG` | 排障用 DEBUG（**进度时间轴依赖**），平时 WARNING 更安静 |
| 批量推理 | 关（GPU 部署建议开） | 队列内多个音轨合并成批推理，GPU 利用率与排队吞吐更高 |
| 批处理大小 | `8` | 一批最多并行音轨数：越大排空越快、显存/内存压力越高 |

### VAD 过滤

| 设置项 | 默认 | 说明 |
|---|---|---|
| VAD 语音检测阈值 | 空（引擎默认 0.5） | 0.01~0.99：越高越抗背景噪声但轻声可能被切掉；越低越灵敏但音乐/噪声更易被当语音识别。**字幕出现大段重复/幻觉时先调高到 0.6~0.7** |

### AI 润色（可选 LLM 复核）

| 设置项 | 默认 | 说明 |
|---|---|---|
| 启用 AI 润色 | 关 | 生成后再用 LLM 通读一遍，修正错译/漏译/不通顺；需同时配齐下方三项 |
| 润色服务地址 | 空 | OpenAI 兼容 Chat 接口（Ollama / vLLM / 商用 API），如 `http://127.0.0.1:11434/v1` |
| 润色模型 | 空 | 与润色服务登记的模型名一致，如 `qwen2.5:14b` |
| 润色批行数 | `60` | 每次发给模型的字幕行数；过大易让模型改错行数 |
| 润色请求超时（秒） | `600` | 本地模型跑长字幕建议保持 ≥600 |
| 润色 API Key | 空 | 留空 = 保持现值；只发往你配置的润色服务地址 |

### Emby / 音频修复 / 扫描规则 / 存储

| 设置项 | 默认 | 说明 |
|---|---|---|
| 启用 Emby 刷新 | 关 | 字幕生成后通知 Emby 刷新媒体库（需服务端能访问 Emby） |
| Emby 地址 / API Key | 空 | 如 `http://192.168.0.134:8096` + 管理员 Key |
| 启用音频修复（JASNA） | 关 | 识别前对音轨降噪修复；仅当服务端已配 JASNA 命令（服务端内部项）时可用 |
| 修复输出命名模板 | `{stem}_restored{ext}` | `{stem}`=片名、`{ext}`=扩展名 |
| 视频扩展名 | 11 种（mp4/mkv/avi/mov/webm/flv/wmv/ts/m2ts/mpg/mpeg） | 「扫描目录」时视为视频的扩展名，逗号分隔 |
| 已有字幕判定后缀 | `.zh.srt, .srt` | 同目录存在 `<片名>+<后缀>` 即视为已有字幕 |
| 扫描时进入子目录 | 开 | 「扫描目录」是否递归 |
| 缓存保留天数 | `7` | inbox 音轨/字幕副本超期未被引用即清理；影片旁成品字幕不受影响 |

> 不在白名单的服务端内部项（`infer.command/cwd/extra_args`、`watch.*`、`progress.*`、
> `jasna.command`、`subtitle.output_dir` 的容器内布局等）仍走配置文件/环境变量。

## 4. 客户端设置

### 服务登记表（客户端数据卷）

「字幕服务」页维护：名称 / 地址 / API Key（可选，与服务端 `JAVSCRIBE_API_KEY` 同值，
只存客户端本地，接口不回显明文）。多个客户端各自的登记表互不影响。

### 客户端本机设置（「⚙ 服务设置」弹窗底部「客户端设置」卡片）

只保存在**本客户端**，不经过服务端：

| 设置项 | 范围 / 默认 | 说明 |
|---|---|---|
| 音轨提取并发 | 1~8（默认 2） | 本机（客户端部署机）同时运行 ffmpeg 提取音轨的数量；越大提取越快，本机 CPU/IO 占用越高。多人共用一台部署机时，它约束的是**这台机器** |
| 转译并发（服务队列上限） | 1~16（默认 4） | 本机「同时在途任务数上限」≈ 派发到该服务的队列深度；超出的任务在本机排队等待派发。调低可保护服务端内存/磁盘、缩小服务重启丢失排队任务的风险面 |

### 浏览器偏好（Web 形态，localStorage，逐浏览器独立）

| 偏好 | 默认 | 说明 |
|---|---|---|
| 完成后自动下载字幕（写回源目录） | 关 | 开启后「选择文件夹」任务完成自动写回你选的源目录（依赖 Chromium File System Access API） |
| 「忽略小于」阈值 | 200 MB | 扫描结果中小于此值的文件列出但不默认勾选；0 = 不忽略 |
| 任务表 / 扫描表每页条数 | 10 | 档位 10 / 20 / 50 / 100 / 500，两处独立记忆 |

## 5. 路径语义速查（最常混淆）

| 入口 | 路径在哪台机器上 | 例子 |
|---|---|---|
| 选择文件夹 | **浏览器所在的电脑**（桌面形态 = 本电脑） | `D:\Videos\JAV` |
| 扫描目录（客户端部署机） | **客户端部署所在机器** | `/media/jav`（134 上的 BT 落地目录） |
| 服务端 `watch` 目录 | **服务端机器**（`JAV_WATCH_DIR`） | `/media/jav`（127 上） |

容器化服务端的路径映射：`/scan` 只认容器内路径；设置 `JAVSCRIBE_HOST_ROOT=/hostfs`
后，宿主路径（如 `/home/ryen/emby-test/media`）透明映射为 `/hostfs/<宿主路径>`
（默认 compose 已把宿主根只读挂在 `/hostfs`，映射开关默认关闭）。
详见 [API 参考 · 容器化路径映射](./api)。
