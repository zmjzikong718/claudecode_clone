//Agent本身的配置类型定义
import { streamSimple, completeSimple, getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import { setFips } from "node:crypto";
import type { Model, StreamFunction, ThinkingLevel } from "@mariozechner/pi-ai";

//AgentConfig = apiKey + provider + model + baseUrl + headers + streamFn + modelDef + agentId + systemPrompt + tools + toolPolicy + sabdbox + temperature + reasoning + maxTurns + sessionDir + workspaceDir + memoryDir + enableMemory + enableContext + enableSkills + enableHeartbeats + heartbeatInterval + contextTokens +  maxConcurrentRuns
export interface AgentConfig {
  /** API Key（不指定则通过 pi-ai getEnvApiKey 从环境变量自动获取） */
  apiKey?: string;
  /**
   * Provider 名称
   *
   * 对应 pi-ai KnownProvider，如 "anthropic" | "openai" | "google" | "groq" 等
   * 默认 "anthropic"
   */
  provider?: string;
  /** 模型 ID（需与 provider 匹配，如 "claude-sonnet-4-20250514" / "gpt-4.1" / "gemini-2.5-pro"） */
  model?: string;
  /** API Base URL（用于代理、自部署端点、Azure OpenAI 等） */
  baseUrl?: string;
  /** 自定义 HTTP headers（覆盖 pi-ai 默认的 beta headers 等，值为 null 表示移除） */
  headers?: Record<string, string | null>;
  /**
   * Provider 流式调用函数
   *
   * 对应 OpenClaw: pi-agent-core → Agent.streamFn
   * - 不指定则默认使用 pi-ai 的 streamSimple（自动路由到对应 provider）
   * - 可替换为任意自定义 StreamFunction
   */
  streamFn?: StreamFunction;
  /**
   * 模型定义
   *
   * 对应 OpenClaw: pi-ai → Model<TApi>
   * - 不指定则通过 getModel(provider, modelId) 获取
   */
  modelDef?: Model<any>;
  /** Agent ID（默认 main） */
  agentId?: string;
  /** 系统提示 */
  systemPrompt?: string;
  /** 工具列表 */
  tools?: Tool[];
  /** 工具策略（allow/deny） */
  toolPolicy?: ToolPolicy;
  /** 沙箱设置（示意版，仅控制工具可用性） */
  sandbox?: {
    enabled?: boolean;
    allowExec?: boolean;
    allowWrite?: boolean;
  };
  /** 温度参数（0-1，对应 OpenClaw: agents.defaults.models[provider/model].params.temperature） */
  temperature?: number;
  /** 思考级别: minimal / low / medium / high / xhigh */
  reasoning?: ThinkingLevel;
  /** 最大循环次数 */
  maxTurns?: number;
  /** 会话存储目录 */
  sessionDir?: string;
  /** 工作目录 */
  workspaceDir?: string;
  /** 记忆存储目录 */
  memoryDir?: string;
  /** 是否启用记忆 */
  enableMemory?: boolean;
  /** 是否启用上下文加载 */
  enableContext?: boolean;
  /** 是否启用技能 */
  enableSkills?: boolean;
  /** 是否启用主动唤醒 */
  enableHeartbeat?: boolean;
  /** Heartbeat 检查间隔 (毫秒) */
  heartbeatInterval?: number;
  /** 上下文窗口大小（token 估算） */
  contextTokens?: number;
  /**
   * Global lane 最大并发数（跨 session 的总并行度）
   *
   * 对应 OpenClaw: gateway/server-lanes.ts → resolveAgentMaxConcurrent()
   * - session lane 固定 maxConcurrent=1（同一 session 内串行）
   * - global lane 控制不同 session 间可同时跑几个（默认 2）
   */
  maxConcurrentRuns?: number;
}


//Agent运行结果
//RunResult = runId + text + turns + toolCalls + skillTriggered + memoriesUsed

//默认系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个编程助手 Agent。

## 可用工具
- read: 读取文件内容
- write: 写入文件
- edit: 编辑文件 (字符串替换)
- exec: 执行 shell 命令
- list: 列出目录
- grep: 搜索文件内容

## 原则
1. 修改代码前必须先读取文件
2. 使用 edit 进行小范围修改
3. 保持简洁，不要过度解释
4. 遇到错误时分析原因并重试

## 输出格式
- 简洁的语言
- 代码使用 markdown 格式`;

//Agent核心类
export class Agent {
  /**
   * Provider 流式调用函数
   *
   * 对应 OpenClaw: pi-agent-core/agent.d.ts → Agent.streamFn
   * - 可在运行时替换（如 failover 切换 provider）
   */
  streamFn: StreamFunction;
  private modelDef: Model<any>;
  private apiKey?: string;
  private temperature?: number;
  private reasoning?: ThinkingLevel;
  private agentId: string;
  private baseSystemPrompt: string;
  private tools: Tool[];
  private maxTurns: number;
  private workspaceDir: string;
  private toolPolicy?: ToolPolicy;
  private contextTokens: number;
  private sandbox?: {
    enabled: boolean;
    allowExec: boolean;
    allowWrite: boolean;
  };

  // 5 大子系统
  private sessions: SessionManager;
  private memory: MemoryManager;
  private context: ContextLoader;
  private skills: SkillManager;
  private heartbeat: HeartbeatManager;

  // 功能开关
  private enableMemory: boolean;
  private enableContext: boolean;
  private enableSkills: boolean;
  private enableHeartbeat: boolean;

  /**
   * 运行中的 AbortController 映射 (runId → controller)
   *
   * 对应 OpenClaw: pi-embedded-runner/run/attempt.ts
   * - 每次 run() 创建一个 runAbortController
   * - abort() 可从外部取消指定或全部运行
   */
  private runAbortControllers = new Map<string, AbortController>();

  /**
   * Steering 消息队列 (sessionKey → messages[])
   *
   * 对应 OpenClaw: pi-agent-core → Agent.steeringQueue
   * - 用户在工具执行期间发送新消息时入队
   * - 每次工具执行完毕后检查，若非空则跳过剩余工具
   * - 队列中的消息作为下一个 user turn 处理
   */
  private steeringQueues = new Map<string, string[]>();

  /**
   * Tool Result Guard
   *
   * 对应 OpenClaw: session-tool-result-guard-wrapper.ts → guardSessionManager()
   * - 追踪 pending tool_use，自动合成缺失的 tool_result
   * - 防止 LLM API 因 tool_use/tool_result 不配对而拒绝
   */
  private toolResultGuard: ReturnType<typeof installSessionToolResultGuard>;

  /**
   * 事件订阅者
   *
   * 对应 pi-agent-core/agent.js → Agent.listeners: Set<fn>
   * - subscribe() 添加监听器，返回 unsubscribe 函数
   * - emit() 遍历 listeners 同步调用
   */
    private listeners = new Set<(event: MiniAgentEvent) => void>();
    
    constructor(config: AgentConfig) {
        //Provider和model名字初始化
        //思考：为什么我这个传入的  Agentconfig.provider本质上也只是一个类型检查判断是不是string？
        //回答： AgentConfig 类型定义（编译时）而构造函数（运行时）
        //编译时：防止写错代码
        //运行时：处理实际值
        const provider = config.provider;
        const modelId = config.model;
        //创建或获取 Model 配置对象
        //输入：provider, modelId, config.modelDef
        //尝试获取 Model 定义
        //      ├─ 方式1：用户提供完整 modelDef
        //      ├─ 方式2：从 pi-ai 库获取
        //      └─ 方式3：手动创建兼容定义
        //返回 modelDef 对象
        //先创建一个API 映射表，将提供商名称映射到 pi-ai 内部的 API 类型。
        const API_FOR_PROVIDER: Record<string, string> = {
            anthropic: "anthropic-messages",
            openai: "openai-completions",
            google: "google-generative-ai",
        };
        //然后获取 Model 定义
        //显示类型声明部分let modelDef: Model<any> | undefined（编译时）
        //然后是赋值部分modelDef = config.modelDef ?? getModel(provider as any, modelId as any)（运行时）
        //两种方式 ：config.modelDef ：用户提供完整定义  或   getModel() ：从 pi-ai 库获取预定义
        //赋值部分先用??空值合并运算符 判断如果左边的值是 null 或 undefined，则使用右边的值
        let modelDef: Model<any> | undefined = config.modelDef//用户自己提供的odelDef
                                            ?? getModel(provider as any, modelId as any);////用户只提供 provider 和 model，自动从 pi-ai 库获取

      //如果获取失败（不在pi-ai 库里面），手动创建
      if modelDef(modelDef! && modelId){ //当modelDef 不存在 且 modelId 存在
        const api = API_FOR_PROVIDER[provider];//[]用变量作为键来访问对象属性
        if (!api) {//如果api不存在就报错
              throw new Error(`未知 provider: ${provider}，请指定 modelDef。`);
        }
        //创建modelDef = id + name + api + provider + baseUrl + reasoning + input + cost + contextWiondow + maxToken
        modelDef = {
          id: modelId,//唯一标识
          name: modelId,//显示名称
          api,
          provider,
          baseUrl: config.baseUrl ?? "",
          reasoning: true,//默认开启推理
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 200_000,
          maxTokens: 8192,
        };
      }


      
       



     }


