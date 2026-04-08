//Agent本身的配置类型定义
//AgentConfig = apiKey + provider + model + baseUrl + headers + streamFn + modelDef + agentId + systemPrompt + tools + toolPolicy + sabdbox + temperature + reasoning + maxTurns + sessionDir + workspaceDir + memoryDir + enableMemory + enableContext + enableSkills + enableHeartbeats + heartbeatInterval + contextTokens +  maxConcurrentRuns

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

