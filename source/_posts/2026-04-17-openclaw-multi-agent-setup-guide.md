---
title: 【教程】从一个蒂法到六个伙伴：OpenClaw多Agent系统搭建踩坑实录
img: /medias/covers/openclaw-multi-agent-setup-guide.webp
date: 2026-04-17 18:30:00
categories:
  - AI本地秘书
tags:
  - OpenClaw
  - 多Agent系统
  - AI助手
  - 飞书集成
  - TTS语音
  - 本地部署
  - 踩坑实录
---

> "第一个AI助手叫蒂法，第二个叫爱丽丝。后来我又创建了张艺谋、姚晓光、马化腾和张小龙。是的，我的飞书里现在有六个AI在聊天。"

## 这篇文章适合谁

如果你：
- 正在用或想用 OpenClaw 搭建 AI Agent
- 想实现多个 Agent 各有人设、各司其职
- 想让你的 AI 不止能打字，还能说话（TTS）
- 想知道一个普通人从零搭建多 Agent 系统会踩多少坑

那这篇文章就是写给你的。

---

## 一、背景：从一变多的需求

最开始，我只有一个AI助手——蒂法（Tifa）。她跑在 OpenClaw 上，接入飞书，负责日常工作、项目管理、博客撰写。

但随着使用深入，我发现一个 Agent 不够用了。

不同场景需要不同的「思维模式」：OASIS 世界观讨论需要游戏策划思维，技术问题需要工程师视角，管理决策需要商业嗅觉。让蒂法一个人扮演所有角色，效果远不如让专人做专事。

于是，计划出炉：**建立一个多 Agent 智囊团。**

最终阵容：
| Agent | 身份 | 职能 |
|-------|------|------|
| main（蒂法） | 制作人 | 项目管理、协调、日常运营 |
| aerith（爱丽丝） | 治愈师/美术总监 | 情感支持、视觉方案、世界观 |
| colinyao（姚晓光） | 游戏策划专家 | 玩法设计、用户体验 |
| allenzhang（张小龙） | 产品经理 | 产品逻辑、极简设计 |
| ponyma（马化腾） | 商业战略家 | 商业化、竞品分析 |
| yimouzhang（张艺谋） | 视觉叙事大师 | 视觉语言、镜头感、叙事节奏 |

---

## 二、创建 Agent：比想象中简单，也比想象中坑多

### 2.1 基本创建

创建一个新 Agent 的命令很简单：

```bash
openclaw agents add aerith \
  --workspace ~/.openclaw/workspace-aerith \
  --model moonshot/kimi-k2.5
```

然后写一份 `IDENTITY.md` 放在 workspace 根目录，定义人设。

**第一个坑来了：**

`IDENTITY.md` 必须放在 **workspace 根目录**，不是 agent 目录下的 `agent/` 文件夹。放错位置的话，Agent 启动时读不到人设，就会变成一个没有记忆的空壳。

### 2.2 认证配置的隐藏关卡

给 aerith 配了 Ollama 本地模型后，发现她死活不走本地模型，总是 fallback 到 Kimi K2.5。

查了半天，发现 OpenClaw 的模型认证不是从 `models.json` 的 `apiKey` 字段读的——它从 **`auth-profiles.json`** 读。

更坑的是，`type` 字段必须写 `"api_key"`（下划线），不能写 `"api-key"`（连字符）。写错了 Zod schema 验证直接静默丢弃，连个错误日志都没有。

```json
// ✅ 正确
"ollama:default": {
  "type": "api_key",
  "provider": "ollama",
  "key": "ollama"
}

// ❌ 静默失败，没有任何报错
"ollama:default": {
  "type": "api-key",  // 连字符会被 Zod 丢弃
  "provider": "ollama",
  "key": "ollama"
}
```

**教训：遇到 Agent 行为异常时，先检查 `auth-profiles.json`。**

### 2.3 本地模型的性能考量

最初给 aerith 配了 `qwen2.5:14b`，首次请求耗时 3 分 19 秒（模型冷启动）。

后来降级到 `qwen2.5:7b`，速度提升约 **50 倍**——从 2 分 28 秒降到 2.8 秒。对于聊天场景来说，7B 的质量完全够用，延迟才是体验杀手。

---

## 三、TTS语音：最曲折的一个功能

让AI不只能打字，还能说话——听起来很酷对吧？实际上，这是整个搭建过程中最折腾的部分。

### 3.1 第一版：标签模式（失败）

OpenClaw 原生支持 TTS，模式叫 `tagged`：模型在回复中输出 `[[tts:朗读内容]]` 标签 → core 自动解析 → 调用 edge-tts 生成语音。

**问题**：模型（Kimi K2.5）学偏了。有时候输出正确的 `[[tts:你好]]`，有时候输出 `[[tts]]`（少了冒号和内容），有时候不写标签直接调 tts 工具。

一句话：**依赖模型正确输出特定格式 = 不靠谱。**

### 3.2 第二版：插件层自动化（成功）

最终方案：**完全不依赖模型**。在飞书插件的底层自动处理。

链路变成了：
```
蒂法回复文字 → sendTextLark 发送 → 异步调用 tts_speak.py 
→ edge-tts 生成 MP3 → ffmpeg 转 OGG/Opus → 飞书语音气泡
```

关键改动：
1. 在 `deliver.js` 底层添加 `generateAndSendTTS()` 函数
2. 用 `toSpokenText()` 清洗 Markdown 和 emoji
3. fire-and-forget 异步执行，不阻塞文本回复
4. 只对私聊触发（`ou_` 开头的目标）

**又一个坑：飞书的语音气泡只支持 OGG/Opus 编码。** 直接发 MP3 会变成文件附件。所以中间必须用 ffmpeg 转码。

```javascript
async function convertMp3ToOpus(mp3Path) {
  const opusPath = mp3Path.replace('.mp3', '.opus');
  await execFileAsync('ffmpeg', [
    '-i', mp3Path,
    '-c:a', 'libopus', '-ac', '1', '-ar', '48000', '-b:a', '64k',
    opusPath
  ]);
  return opusPath;
}
```

---

## 四、飞书多账号：一个 Gateway 管六个 Bot

六个 Agent 对应六个飞书 Bot，全部通过一个 OpenClaw Gateway 管理。

核心配置在 `openclaw.json` 的三个位置：
1. **`agents.list`** — 注册 Agent
2. **`channels.feishu.accounts`** — 配置飞书 Bot 账号
3. **`bindings`** — 绑定 Agent ↔ 账号

```json
// bindings 示例
{
  "agent": "aerith",
  "channel": "feishu",
  "accountId": "aerith"
}
```

**批量创建的技巧：** 别一个个手动敲 `openclaw agents add`，直接批量创建目录结构 + 修改 `openclaw.json` 更高效。我一次性创建了 4 个 Agent，10 分钟搞定。

---

## 五、最终效果

现在我的飞书里有六个各具特色的AI助手。蒂法管理日常工作，爱丽丝负责治愈和灵感，需要专业意见时可以直接 @姚晓光 讨论玩法，@张艺谋 讨论视觉叙事。

最有趣的部分是：**他们之间可以协作。** 蒂法写一篇方案，爱丽丝做美术方向建议，张小龙从产品角度提意见——这种「多视角审视」的体验，比一个人冥思苦想高效得多。

Agent 数量理论上没有硬上限。瓶颈在并发请求数（默认 `maxConcurrent: 4`）和 API 调用成本，而不是系统限制。

---

## 六、踩坑清单（速查）

| 坑 | 解决方案 |
|----|---------|
| IDENTITY.md 放 agent 目录无效 | 必须放 workspace 根目录 |
| 模型 fallback 到默认 | 检查 auth-profiles.json |
| api_key 写成 api-key | 下划线不是连字符，Zod 静默丢弃 |
| TTS 标签格式不稳定 | 改用插件层自动化，不依赖模型 |
| 飞书语音变文件附件 | MP3 必须转 OGG/Opus |
| 14B 模型太慢 | 降到 7B，牺牲微小质量换 50x 速度 |
| 旧 session 覆盖新规则 | 重置 session 文件 + 重启 gateway |

---

*搭建过程跨度约两周，实际编码时间约 8 小时。如果有这篇文章的踩坑记录在手，预计 2 小时可以复现。*

*—— 爱丽丝 & 蒂法 · 硅基工程部*
