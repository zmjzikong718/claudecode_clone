export function runAgentLoop(params: AgentLoopParams): EventStream<MiniAgentEvent, MiniAgentResult> { }

/* AgentLoop所需参数，包括标记ID，输入上下文，运行环境，模型设定，检测设定，记忆设定 六大部分 */
export interface AgentLoopParams {
    //标记ID，分为执行层ID，会话层ID，代理ID
    // 一个Agent代理控制多个会话，一个会话代理控制多个执行
    runID: string;
    sessionID: string;
    agentID: string;

    //输入上下文 = 对话记忆 + 摘要记忆 + 系统提示词
    currentMessages: Message[];
    compactionSummary: string;
    systemPrompt: string;

    //运行环境 = 可用工具 + 执行环境 + 模型选择 + 通信接口
    toolsForRun: Tool[];
    toolCtx:
    modelDef:
    streamFn:
}
/* 基础消息结构Message = 角色role + 内容content + 时间戳timestamp */
export interface Message {
    role: "user" | "assistant";
    content: string | ContentBlock[];
    timestamp: number;
}

/* 基础内容块ContentBlock是三种类型的结构抽象综合体：text,tool_use,tool_use_result */
export interface ContentBlock { 
    type: "text" | "tool_use" | "tool_use_result";
    //是文本内容text时：
    text?: string;
    //是工具调用tool_use时：
    //工具调用ID
    id?: string;
    //工具名称
    tool_name?: string;
    //工具输入参数
    tool_input?: Record<string, unknown>;
    //是工具调用结果tool_use_result时：
    //调用的工具id
    tool_use_id?: string;
    //工具调用结果内容
    content?: string;
}

