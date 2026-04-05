# OpenClaw Mini

OpenClaw 核心架构的极简复现，用于学习 AI Agent 的系统级设计。

## 特性

- 🔧 **CLI 工具** - 命令行交互界面
- 🧠 **Agent 核心** - 基于 LLM 的智能代理
- 🛠️ **工具系统** - 内置多种工具（文件读写、命令执行、搜索等）
- 🔌 **多 Provider 支持** - 支持 OpenAI、DeepSeek、Anthropic、Google、Groq、Ollama、LM Studio 等

## 支持的 LLM Providers

| Provider | 模型示例 | Base URL |
|----------|---------|----------|
| `deepseek` | deepseek-chat | https://api.deepseek.com |
| `openai` | gpt-4o | https://api.openai.com/v1 |
| `anthropic` | claude-3-haiku-20240307 | https://api.anthropic.com |
| `google` | gemini-2.0-flash-exp | https://generativelanguage.googleapis.com/v1beta/openai/ |
| `groq` | llama-3.3-70b-versatile | https://api.groq.com/openai/v1 |
| `ollama` | qwen2.5:latest | http://localhost:11434/v1 |
| `lmstudio` | qwen2.5:latest | http://localhost:1234/v1 |

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

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

# 运行构建后的版本
npm run start

# 运行示例
npm run example
```

## 项目结构

```
.
├── src/
│   ├── cli.ts          # CLI 入口
│   ├── agent.ts        # Agent 核心逻辑
│   ├── session-key.ts  # 会话 Key 管理
│   └── tools/
│       ├── builtin.ts  # 内置工具
│       └── type.ts     # 类型定义
├── .env                # 环境配置
├── package.json
└── tsconfig.json
```

## 内置工具

- `read` - 读取文件
- `write` - 写入文件
- `edit` - 编辑文件
- `exec` - 执行命令
- `list` - 列出目录
- `grep` - 搜索文件
- `memory_search` - 记忆检索
- `memory_get` - 记忆读取
- `memory_save` - 记忆写入
- `sessions_spawn` - 子代理触发

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENCLAW_MINI_PROVIDER` | LLM 提供商 | anthropic |
| `OPENCLAW_MINI_MODEL` | 模型名称 | - |
| `OPENCLAW_MINI_BASE_URL` | API Base URL | - |
| `OPENCLAW_MINI_AGENT_ID` | Agent ID | main |

各 Provider 对应的 API Key 环境变量：
- DeepSeek: `DEEPSEEK_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GEMINI_API_KEY`
- Groq: `GROQ_API_KEY`

## 技术栈

- TypeScript
- Node.js
- @mariozechner/pi-ai

## 学习资源

本项目是 OpenClaw 架构的简化实现，适合学习：
- AI Agent 的系统设计
- LLM API 的集成方式
- 工具系统的实现
- 会话状态管理

## License

MIT