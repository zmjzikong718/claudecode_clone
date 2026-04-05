import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Writable } from "node:stream";
import { resolveSessionKey } from "./session-key.js";
import { getEnvApiKey } from "@mariozechner/pi-ai";

/** loadEnvFile加载环境变量文件.env,传入的dir默认值为当前命令的执行目录 */
function loadEnvFile(dir: string = process.cwd()): string| undefined{
    const envPath = path.join(dir, ".env");//dir的子目录.env路径拼接
    let content: string;//定义content为读取.env文件的字符串内容
    //尝试读取,失败不报错误直接返回
    try {
        content = fs.readFileSync(envPath, "utf-8");
    } catch {
        return;
    }
    for (const line of content.split("\n")) { 
        const trimmed = line.trim();//去除两端空格
        if (!trimmed || trimmed.startsWith("#")) continue;        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (key) { 
            console.log(`运行loadEnvFile函数从.env文件中提取出: "${key}" => "${value}"`);
            if (!(key in process.env)) {
                process.env[key] = value;//将环境变量里面对应key的位置填充上提取出来的value的值
             }
        }
    } 
}
//测试能否成功提取.env文件
loadEnvFile();


async function main() { 
    //配置provider，model，base-urlapi-key参数，优先从命令行提取，再使用环境变量配置的
    const args = process.argv.slice(2);//提取命令行参数
    const provider = process.env.OPENCLAW_MINI_PROVIDER ?? "anthropic";
    const model =  process.env.OPENCLAW_MINI_MODEL;
    const baseUrl =  process.env.OPENCLAW_MINI_BASE_URL;
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error(`错误: 未找到 ${provider} 的 API Key`);
      process.exit(1);
    }
    const agentId = process.env.OPENCLAW_MINI_AGENT_ID ?? "main";
    const sessionId = resolveSessionIdArg(args) || "session-" + Date.now();
    const workspaceDir = process.cwd();
    const sessionKey = resolveSessionKey({ agentId, sessionId });
    
    console.log(`
配置信息:
- Provider: ${provider}
- Model: ${model || 'default'}
- Base URL: ${baseUrl || 'default'}
- API Key: ${apiKey}
- Agent ID: ${agentId}
- Session ID: ${sessionId}
- Session Key: ${sessionKey}
- Workspace: ${workspaceDir}
`);
}
main()

const FLAGS_WITH_VALUE = new Set(["--agent", "--model", "--provider", "--api-key", "--base-url"]);
/** 从命令行里面提取SessionId（会话名称，可自己设定） */
function resolveSessionIdArg(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "chat") continue;
    if (FLAGS_WITH_VALUE.has(arg)) { i += 1; continue; }
    if (arg.startsWith("--")) continue;
    return arg.trim() || undefined;
  }
  return undefined;
}

