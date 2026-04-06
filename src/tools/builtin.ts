import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Tool, ToolContext } from "./types.js";
import { assertSandboxPath } from "../sandbox-paths.js";

// readTool 读取文件工具
export const readTool: Tool<{ file_path: string; limit?: number }> = {
  name: "read",
  description: "读取文件内容，返回带行号的文本",
  inputSchema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "文件路径" },
      limit: { type: "number", description: "最大读取行数，默认 500" },
    },
    required: ["filePath"],
  },
  async execute(input, ctx) {
    let filePath:string;
    try{
        const resolved_and_relative = await assertSandboxPath({
                filePath:input.file_path,//llm调用参数时输入的input（遵循inputSchema结构）里面的file_path，表示需要读取文件的路径
                cwd:ctx.workspaceDirl,
                root:ctx.workspaceDir,//来源于Agent 初始化时的 config.workspaceDir 参数（在agent.ts里面定义）
            });// assertSandboxPath返回{resolved(绝对路径);relative(相对于沙箱根目录的相对路径)}
        filePath = resolved_and_relative.resolved;//提取到llm需要的绝对路径
        }catch(err){
            return `错误: ${(err as Error).message}`;
        }
        const limit = input.limit ?? 500;//提取到限制读取最大行数
        //读取文件并且返回带有行号的内容
        try {
            const content = await fs.readFile(filePath,"utf-8");
            const lines = content.split("\n").slice(0,limit);
            //格式: "行号\t内容"，方便 LLM 解析（\t是Tab分隔符）
            return lines.map((line, i) => `${i + 1}\t${line}`).join("\n");
        }catch(err){
            return `错误: ${(err as Error).message}`;
        }
    },
};

/**写入文件工具 writeTool
 * 
*/

