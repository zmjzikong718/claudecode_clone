# OpenClaw Mini

OpenClaw 核心架构的极简复现，用于学习 AI Agent 的系统级设计。

## ⚠️ 开发状态：进行中

本项目正在积极开发中，部分功能已实现，部分功能待完善。

---

## ✅ 已实现

### 1. CLI 系统
- [x] 命令行参数解析（`--provider`, `--model`, `--base-url`, `--api-key`, `--agent`）
- [x] 环境变量加载（`.env` 文件解析）
- [x] 会话 ID 自动生成

### 2. 配置系统
- [x] 多 Provider 支持配置模板
- [x] 环境变量与命令行参数优先级
- [x] 完整的 `.env` 配置示例

### 3. 工具系统基础
- [x] 工具类型定义（`Tool`, `ToolContext`）
- [x] 沙箱路径安全检查（`assertSandboxPath`）

### 4. 会话管理
- [x] Session Key 生成（`resolveSessionKey`）
- [x] 主会话 Key 构建

### 5. 开发环境
- [x] VS Code 调试配置（`launch.json`）
- [x] TypeScript 编译配置
- [x] npm scripts（`dev`, `build`, `start`）

---

## ⏳ 待实现

### 1. Agent 核心
- [ ] LLM 调用集成（连接 `@mariozechner/pi-ai`）
- [ ] Agent Loop 运行逻辑
- [ ] 消息历史管理

### 2. 工具实现
- [ ] `read` - 读取文件工具
- [ ] `write` - 写入文件工具
- [ ] `edit` - 编辑文件工具
- [ ] `exec` - 执行命令工具
- [ ] `list` - 列出目录工具
- [ ] `grep` - 搜索文件工具
- [ ] `memory_search` - 记忆检索
- [ ] `memory_get` - 记忆读取
- [ ] `memory_save` - 记忆写入
- [ ] `sessions_spawn` - 子代理触发

### 3. 记忆系统
- [ ] 记忆存储（Session Storage）
- [ ] 记忆检索（RAG/向量搜索）

### 4. Agent 调用示例
- [ ] CLI 主循环运行
- [ ] 交互式聊天模式

---

## 支持的 LLM Providers

| Provider | 状态 | 模型示例 | Base URL |
|----------|------|---------|----------|
| `deepseek` | ✅ 已测试 | deepseek-chat | https://api.deepseek.com |
| `openai` | ✅ 已测试 | gpt-4o | https://api.openai.com/v1 |
| `anthropic` | ✅ 已测试 | claude-3-haiku-20240307 | https://api.anthropic.com |
| `google` | ⏳ 待测试 | gemini-2.0-flash-exp | https://generativelanguage.googleapis.com/v1beta/openai/ |
| `groq` | ⏳ 待测试 | llama-3.3-70b-versatile | https://api.groq.com/openai/v1 |
| `ollama` | ⏳ 待测试 | qwen2.5:latest | http://localhost:11434/v1 |
| `lmstudio` | ⏳ 待测试 | qwen2.5:latest | http://localhost:1234/v1 |

---

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
OPENCLAW_MINI_PROVIDER=deepseek
OPENCLAW_MINI_MODEL=deepseek-chat
OPENCLAW_MINI_BASE_URL=https://api.deepseek.com
DEEPSEEK_API_KEY=your-api-key
```

### 3. 运行

```bash
# 开发模式
npm run dev

# 构建
npm run build
```

---

## 项目结构

```
.
├── src/
│   ├── cli.ts          # CLI 入口（已完成）
│   ├── agent.ts        # Agent 核心（待完善）
│   ├── session-key.ts  # 会话 Key 管理（已完成）
│   ├── sandbox-paths.ts # 沙箱路径安全（已完成）
│   └── tools/
│       ├── builtin.ts  # 内置工具（骨架已搭建）
│       └── type.ts    # 类型定义（已完成）
├── .env                # 环境配置
├── package.json
└── tsconfig.json
```

---

## 环境变量

| 变量 | 说明 | 状态 |
|------|------|------|
| `OPENCLAW_MINI_PROVIDER` | LLM 提供商 | ✅ |
| `OPENCLAW_MINI_MODEL` | 模型名称 | ✅ |
| `OPENCLAW_MINI_BASE_URL` | API Base URL | ✅ |
| `OPENCLAW_MINI_AGENT_ID` | Agent ID | ✅ |

---

## 技术栈

- TypeScript
- Node.js
- @mariozechner/pi-ai

---

## License

MIT