import fs from "node:fs";
import path from "node:path";
import { Agent } from "./index.js";
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
    //分行提取，通过一系列手段每一行都提取里面相互对应的key和value
    for (const line of content.split("\n")) { 
        const trimmed = line.trim();//去除两端空格
        if (!trimmed || trimmed.startsWith("#")) continue;        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        //这一行处理完成，如果成功就打印提取的key和value
        if (key) { 
            console.log(`运行loadEnvFile函数从.env文件中提取出: "${key}" => "${value}"`);
            if (!(key in process.env)) {
                process.env[key] = value;//将拆解读取到的key-value值对应填充到该项目的运行环境process.env里面
             }
        }
    } 
}
//测试能否成功提取.env文件
loadEnvFile();
//测试提取.env文件后得到的key-value是否被加载进了环境变量process.env中
console.log(process.env)

//运行cli界面的主函数
async function main() { 
    //配置provider，model，base-urlapi-key参数，使用环境变量配置的
    const args = process.argv.slice(2);
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
  
    //检测相关配置是否提取成功
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
    //横幅展示
    console.log(`MINI OpenClaw Mini`);
    console.log(`  ${provider}${model ? ` · ${model}` : ""} · ${agentId}`);
    console.log(`  ${workspaceDir}`);
    console.log(`  /help 查看命令 · Ctrl+C 退出`);
    console.log();
  
  //按照前面提取出来的这些参数传入Agent类进行初始化，创建agent实例
  const agent = new 
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

