# 配置参考

本页按 `serve-v0.2.16` 服务端源码 tag 与已公开客户端 `client-v0.2.66` 核对配置**类别与已确认字段**。`serve-v0.2.16` 未核到公开正式安装包；此处服务端行为只适用于该 tag 自行构建，不能推广到所有旧版包。配置分三处，作用范围与生效方式各不相同：

| 位置 | 谁来改 | 作用范围 | 持久化与生效 |
|---|---|---|---|
| 服务端环境变量（`serve` 部署时） | 部署者（Compose / 自己的配置） | 该服务端实例 | 部署时设置，**改后需重启容器** |
| 服务端「⚙ 服务设置」（白名单项） | 任一客户端（需 API Key） | **所有**连到该服务的客户端 | 写回服务端配置文件 + 内存热更，**对新提交的任务生效**，运行中任务不受影响 |
| 客户端本机设置及部署变量 | 本客户端使用者 / 部署者 | 仅本客户端（本机 ffmpeg / 本机队列 / 可访问路径） | Web 形态在客户端容器及数据卷，桌面版在本机；具体设置依对应界面或部署方式生效 |

> 原则：**跑不跑得动的参数**（引擎命令、监听目录、端口）走服务端环境变量/配置文件；
> **产出质量的参数**（字幕命名、跳过策略、设备、模型、润色）若在下方服务端白名单内，
> 可经「服务设置」修改；工作台本地扫描规则属于客户端，不是服务端 `/scan` 规则。

## 1. 服务端环境变量（serve）

Docker 部署时通过 compose `environment` 或 `.env` 提供：

| 变量 | 默认 | 说明 |
|---|---|---|
| `JAVSCRIBE_API_KEY` | 空 | 保护服务端 `/config`、`/scan`、`/scan/submit` 等特定接口；不是全站鉴权。客户端登记同值以使用受保护的服务设置；`client-v0.2.66` 的工作台本地扫描不依赖服务端 `/scan` |
| `JAV_PORT` | `8300` | 进度/上传 API 宿主机端口 |
| `JAV_WATCH_DIR` | `/media/jav` | 服务端 `watch` 监听的落盘目录（客户端链路不依赖它） |
| `JAV_MODELS_DIR` | `/opt/jav-scribe/models`（Serve Compose） | 服务端模型权重的宿主机持久化目录；实际所需权重与下载量依部署选择而定 |
| `JAV_DATA_DIR` | `/opt/jav-scribe/data` | 持久化数据目录：活动 profile 配置 + inbox（上传音轨 / 字幕缓存），镜像重建不丢 |
| `JAV_HOSTFS` | `/`（Serve Compose） | 服务端宿主机根只读挂载到 Serve 容器 `/hostfs`；是高权限映射，需限制服务网络访问 |
| `JAVSCRIBE_HOST_ROOT` | 空 | Serve 容器中用于服务端 `/scan` 的路径回退；Web 客户端容器中也可单独设置供工作台本地扫描使用。两容器不共享环境变量或卷，只有实际挂载的路径可读 |
| `JAVSCRIBE_PROFILE` | 配置文件 `profile` 字段 | 活动配置 profile（`local` / `server` / 自定义） |
| `JAVSCRIBE_CONFIG` | `~/.jav_scribe/config.json` | 配置文件路径 |
| `JAVSCRIBE_INBOX_DIR` | 数据目录下 `inbox/` | 上传音轨落盘目录（细调用，一般不动） |
| `JAVSCRIBE_EMBY_API_KEY` | 空 | `emby.api_key` 的环境变量形态（与配置文件二选一） |
| `JAVSCRIBE_LLM_API_KEY` | 空 | `polish.api_key` 的环境变量形态（与配置文件二选一） |
| `JAV_PROXY` | 空 | **固定 Serve tag 的 Docker entrypoint** 在设置时导出 HTTP(S)_PROXY，供模型下载及容器内遵循代理环境变量的出站请求使用；占位格式 `http://proxy.example.com:<port>`。不表示客户端播放流量自动走此代理 |
| `JAV_NO_PROXY` | 空 | Serve Docker entrypoint 将它和 localhost、常见私网 CIDR 拼成 NO_PROXY；进程/工具实际是否识别 CIDR 仍取决于自身实现 |

`JAVSCRIBE_API_KEY` 不保护上传、任务进度等接口，服务端端口只开放在可信内网/VPN；需要公网访问时另加鉴权反向代理。不要把示例看作无需核验模型目录、GPU 与卷权限的最小部署脚本。公开文档不填写真实 Key 或地址。

## 2. 服务端配置文件（config.json）

服务端默认读取 `~/.jav_scribe/config.json`（可经 `--config` / `JAVSCRIBE_CONFIG` 指定），支持 `profiles` 多套配置。
以下为固定 `serve-v0.2.16` 的**示例配置**与可核字段，示例值不一定等于每次部署的运行值；
完整结构请核对该 tag 的 [`config/jav_scribe.example.json`](https://github.com/JavdBviewed/JavScribe/blob/serve-v0.2.16/config/jav_scribe.example.json)。

| 段 | 关键字段（默认） | 说明 |
|---|---|---|
| `infer` | `command` / `cwd` / `model` / `device`（示例 local=cpu、server=cuda）/ `batch`（local=false、server=true）/ `max_batch_size`（8）/ `log_level`（DEBUG） | 字幕引擎命令与参数；`command`/`cwd` 属服务端内部项，不在设置页；并发等运行值应以当前服务端配置为准 |
| `subtitle` | 示例含 `formats`（srt）/ `lang_tag`（zh）/ `naming`（rename）/ `output_dir`（null）/ `skip_if_exists`（true）/ `overwrite`（false）/ `tag_formats`（srt,vtt） | 输出格式、语言标签、命名策略和跳过判定；部分设置页可改项如内嵌字幕、指纹不在示例 JSON 中逐项列出，不能从示例推断运行默认 |
| `watch` | `dirs` / `interval_s`（10）/ `process_existing`（local=true、server=false） | 服务端自监听；两套示例 profile 的存量文件处理不同，工作台本地扫描不用此项 |
| `scan` | server 示例含 `video_exts`（11 种）/ `subtitle_patterns`（.zh.srt, .srt）/ `recurse`（true） | **服务端 `/scan`** 的规则；`client-v0.2.66` 工作台的本地扫描规则另存客户端 |
| `polish` | 示例含 `enabled`（false）/ `base_url` / `model` / `batch_lines`（60）/ `api_key` | 可选 LLM 润色第二遍；超时数值应核实际配置，不从示例推断 |
| `emby` | `enabled`（false）/ `url` / `api_key` | 完成后触发 Emby Refresh |
| `jasna` | `enabled`（false）/ `command` / `output`（`{stem}_restored{ext}`） | 可选 JASNA 降噪修复；`command` 为服务端内部项 |
| `storage` | `retention_days`（7） | inbox（音轨/字幕缓存）自动清理周期；影片旁成品字幕不受影响 |
| `progress` | 示例 `host`（0.0.0.0）/ `port`（8300） | 进度/上传 API 监听地址；按部署网络策略限制暴露 |

## 3. 「⚙ 服务设置」白名单（页面可改，服务端级）

点服务卡片的「⚙ 服务设置」可在线修改的**就是**下表（服务端 `PUT /config`
逐类型校验后写回活动 profile 段 + 内存热更；**对所有连到该服务的客户端生效**，
页面有横幅提示）。下表保留常用字段，**不是服务端完整白名单**：固定 tag 还包括 `infer.coalesce_max_jobs`、`infer.model_keepalive_s` 等项目；具体值以服务端 `/config` 返回及该 tag 的白名单为准。

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
| 内嵌字幕时跳过 | 按当前配置核对 | `off` 永不跳 / `target` 仅内嵌轨命中目标语言时跳 / `any` 有任意内嵌轨就跳；示例 JSON 未列该字段 |
| 内嵌字幕目标语言 | 按当前配置核对 | `target` 模式用的命中语言，逗号分隔；示例 JSON 未列该字段 |
| 字幕写入 JavScribe 指纹 | 按当前配置核对 | srt 尾部追加指纹用于识别本工具产出；示例 JSON 未列该字段 |

### 推理引擎

| 设置项 | 默认 | 说明 |
|---|---|---|
| 推理设备 | 按活动 profile | `cuda` GPU 推理 / `cpu` 纯 CPU / `auto` 引擎自选；示例 local=cpu、server=cuda |
| 字幕模型 | 海南鸡 v2 目录 | 模型目录/名；改名前需确认服务端已有该模型 |
| **转译并发数** | `1`（1~4） | 服务端**同时转译的任务数** = 并行模型实例数；每实例约 4~6GB 显存（GPU 模式）。显存充足（如 24G 卡）调 2~3 提升整批吞吐，单任务耗时基本不变；显存不足会 OOM，按显卡调整 |
| 日志级别 | 示例 `DEBUG` | 可选 DEBUG / INFO / WARNING / ERROR；切换前评估进度时间轴的显示需求 |
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
| 润色请求超时（秒） | 按当前配置 | 本地模型处理长字幕时可按实际响应时间调整，不把示例未列出的值写成统一默认 |
| 润色 API Key | 空 | 留空 = 保持现值；只发往你配置的润色服务地址 |

### Emby / 音频修复 / 扫描规则 / 存储

| 设置项 | 默认 | 说明 |
|---|---|---|
| 启用 Emby 刷新 | 关 | 字幕生成后通知 Emby 刷新媒体库（需服务端能访问 Emby） |
| Emby 地址 / API Key | 示例为空 | 填服务端可访问的 Emby 地址，例如 `https://emby.example.com`，及自己的 API Key |
| 启用音频修复（JASNA） | 关 | 识别前对音轨降噪修复；仅当服务端已配 JASNA 命令（服务端内部项）时可用 |
| 修复输出命名模板 | `{stem}_restored{ext}` | `{stem}`=片名、`{ext}`=扩展名 |
| 视频扩展名 | server 示例 11 种（mp4/mkv/avi/mov/webm/flv/wmv/ts/m2ts/mpg/mpeg） | 仅服务端 `/scan` 的扩展名列表，不自动改变工作台本地扫描规则 |
| 已有字幕判定后缀 | server 示例 `.zh.srt, .srt` | 仅服务端 `/scan` 的同目录字幕判断 |
| 扫描时进入子目录 | server 示例开启 | 服务端 `/scan` 是否递归；Web 工作台本地扫描到「客户端设置」中调整 |
| 缓存保留天数 | `7` | inbox 音轨/字幕副本超期未被引用即清理；影片旁成品字幕不受影响 |

> `infer.command/cwd/extra_args`、`watch.*`、`progress.*`、`jasna.command` 等服务端内部项仍走配置文件/环境变量。`subtitle.output_dir` **在固定 tag 的 `/config` 白名单中**，但远端任务的服务端路径不能当作客户端本机写回目录。

## 4. 客户端设置

### 服务登记表（客户端数据卷）

「字幕服务」页维护：名称 / 地址 / API Key（可选，与服务端 `JAVSCRIBE_API_KEY` 同值，
只存客户端本地，接口不回显明文）。多个客户端各自的登记表互不影响。

### 客户端本机设置（「⚙ 服务设置」弹窗底部「客户端设置」卡片）

只保存在**本客户端**，不经 Serve `/config` 同步给其他客户端。下表中的默认与范围只作现有工作台使用说明；未在本回合逐项从客户端 UI 固定 tag 核验的值不视为发布保证：

| 设置项 | 范围 / 默认 | 说明 |
|---|---|---|
| 音轨提取并发 | 以客户端实际设置界面为准 | 约束当前客户端部署机上提取音轨的本地任务；桌面版对应这台电脑 |
| 转译并发（服务队列上限） | 以客户端实际设置界面为准 | 约束本客户端的派发，不等同于 Serve 引擎的 `infer.concurrency`；Serve 重启后在途任务能否恢复取决于服务端版本 |

`client-v0.2.66` Web Compose 使用 `JAV_WEB_DATA_DIR`（默认宿主机 `/opt/jav-scribe-web/data`）挂载容器 `/data` 保存服务登记表；`JAV_ENGINES` 可预置名称与 Serve URL，但地址须从**Web 容器**可达。Web 端口由 `JAV_WEB_PORT`（默认 8400）映射；还提供可配置的 HTTPS 端口。服务端 `JAV_DATA_DIR` 与客户端 `JAV_WEB_DATA_DIR` 不能混用。`JAVSCRIBE_HOST_ROOT` **没有写进固定客户端 Web Compose 的默认环境变量表**；要使用宿主机路径回退，必须自己在 Web 容器中设置该变量，并挂载实际目录。

### 浏览器偏好（Web 形态，localStorage，逐浏览器独立）

| 偏好 | 默认 | 说明 |
|---|---|---|
| 完成后自动下载字幕（写回源目录） | 关 | 开启后「选择文件夹」任务完成自动写回你选的源目录（依赖 Chromium File System Access API） |
| 「忽略小于」阈值 | `client-v0.2.66` 本地扫描代码缺省为 200 MB | 扫描结果中小于此值的文件列出但不默认勾选；仍可手动选择 |
| 任务表 / 扫描表每页条数 | 以当前客户端界面为准 | 浏览器偏好仅属于该浏览器，不是 Serve 任务历史 |

## 5. 路径语义速查（最常混淆）

| 入口 | 路径在哪台机器上 | 例子 |
|---|---|---|
| 选择文件夹 | **浏览器所在的电脑**（桌面形态 = 本电脑） | `D:\Videos\JAV` |
| 扫描目录（客户端部署机） | **Web 客户端部署机**中容器实际可访问的目录；桌面版为本电脑 | `/media/videos`（仅示例；须有对应挂载） |
| 服务端 `watch` 目录 | **Serve 所在机器**（`JAV_WATCH_DIR`） | `/media/videos`（仅示例；与客户端目录可不同） |

`JAVSCRIBE_HOST_ROOT` 是**各自容器独立读取**的变量：Serve 设置后仅影响 Serve 的 `/scan` 路径回退；Web 客户端自行设置后影响其 `localscan.py` 的本地扫描回退。只在 Serve Compose 设置它，不会让 Web 工作台扫描 Serve 的文件。Web 容器必须实际挂载目标媒体目录，且对扫描有读取权限；若该映射仅只读，则完成的字幕不能写回源目录，需对**目标目录**有意识地提供读写挂载与相应权限，避免挂载整个宿主机根目录。普通目录扫描不探测内嵌字幕，需主动触发检查。详见[工作台](./workbench)及[部署指南](./deployment)。
