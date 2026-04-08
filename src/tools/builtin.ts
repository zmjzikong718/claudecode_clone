import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Tool, ToolContext } from "./type.js";
import { assertSandboxPath } from "../sandbox-paths.js";
import { TIMEOUT } from "node:dns";
import { describe } from "node:test";

// readTool 读取文件工具
export const readTool: Tool<{file_path:string;limit?:number}> = {
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
                cwd:ctx.workspaceDir,
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
export const writeTool:Tool<{file_path:string;content:string}> = {
  name:"write",
  description:"写入文件，会覆盖已存在的文件",
  inputSchema:{
    type:"object",
    properties:{
      file_path:{type:"string",description:"文件路径"},
      content:{type:"string",description:"文件内容"}，
    },
    required:["file_path","content"],
  },
  async execute(input,ctx) {
    let filePath:string;
    try{
        const resolved_and_relative = await assertSandboxPath({
          filePath:input.file_path,//llm调用参数时输入的input（遵循inputSchema结构）里面的file_path，表示需要读取文件的路径
          cwd:ctx.workspaceDir,
          root:ctx.workspaceDir,//来源于Agent 初始化时的 config.workspaceDir 参数（在agent.ts里面定义）
        });// assertSandboxPath返回{resolved(绝对路径);relative(相对于沙箱根目录的相对路径)}
        filePath = resolved_and_relative.resolved;//提取到llm需要的绝对路径
    }catch(err){
        return `错误: ${(err as Error).message}`;
      }

      try{
        await fs.mkdir(path.dirname(filePath), { recursive: true });//如果目录不存在会自动创造父目录
        await fs.writeFile(filePath,input.content,"utf-8");//写入文件内容
        return `成功写入 ${input.file_path}`;
      }catch(err){
        return `错误: ${(err as Error).message}`;
      }
    },
  };

  //文件编辑工具
export const editTool:Tool<{
  file_path:string;
  old_string:string;
  new_string:string;
}>={
    name: "edit",
    description: "编辑文件，替换指定文本（只替换第一个匹配）",
    inputSchema: {
    type: "object",
    properties: {
      file_path:{type:"string",description:"文件路径"},
      old_string:{type:"string",description:"要替换的原文本（精确匹配）"},
      new_string:{type:"string",description:"新文本"},
    },
    required: ["filePath","old_string","new_string"],
  },
  async execute(input, ctx) {
    //依旧前置检查函数
    let filePath:string;
    try{
        const resolved_and_relative = await assertSandboxPath({
          filePath:input.file_path,//llm调用参数时输入的input（遵循inputSchema结构）里面的file_path，表示需要读取文件的路径
          cwd:ctx.workspaceDir,
          root:ctx.workspaceDir,//来源于Agent 初始化时的 config.workspaceDir 参数（在agent.ts里面定义）
        });// assertSandboxPath返回{resolved(绝对路径);relative(相对于沙箱根目录的相对路径)}
        filePath = resolved_and_relative.resolved;//提取到llm需要的绝对路径
    }catch(err){
        return `错误: ${(err as Error).message}`;
    }

    //主函数
    try {
      const content = await fs.readFile(filePath,"utf-8")
      //检查是否存在需要检查的文本
      if (!content.includes(input.old_string)){
        return "错误: 未找到要替换的文本（请确保 old_string 与文件内容完全一致，包括空格和换行）";
      }
      const newContent = content.replace(input.old_string,input.new_string);//将old_string替换为new_string，替换后的整个文本赋值给newContent
      await fs.writeFile(filePath,newContent,"utf8")
      return `成功编辑 ${input.file_path}`;
    }catch(err){
      return `错误: ${(err as Error).message}`;
    }
  },
};

//命令执行工具
export const execTool:Tool<{command:string;timeout?:number}> = {
  name:"exec",
  description:"执行 shell 命令",
  inputSchema:{
    type:"object",
    properties:{
      command:{type:"string",description:"要执行的命令"},
      timeout:{type:"string",description:"超时时间(ms)，默认 30000"},
    },
    required:["command"],
  },
  async execute(input,ctx){
    const timeout = input.timeout ?? 30000;//llm输入值或者30000默认值
    try{//使用 sh -c 执行命令（兼容性好）
      const child = spawn("sh", ["-c", input.command], {
        cwd: ctx.workspaceDir,
        stdio:["ignore","pipe","pipe"],//捕获stdout和stderr
      }); //使用spawn启动一个子进程,在当前项目目录下，启动一个 Shell 进程执行用户输入的命令，并忽略输入、通过管道捕获输出和错误信息。

      //AbortSignal 杀进程，支持从外部中止执行中的命令
      const onAbort = () => {
        try {
          child.kill();//向子进程发送终止信号
        } catch { }//防止杀进程时出错,同时忽略错误，保证程序不崩溃
      };
      //检查是否已经取消
      if (ctx.abortSignal?.aborted) {
        onAbort()
      } else if (ctx.abortSignal) {
        ctx.abortSignal.addEventListener("abort", onAbort, {once:true});
      }
      //超时定时器
      const timer = setTimeout(() => {
        try { child.kill(); } catch { /* ignore */ }
      }, timeout);
       const MAX_OUTPUT_CHARS = 200_000;
      let stdout = "";
      let stderr = "";
      let truncated = false;
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
        if (stdout.length > MAX_OUTPUT_CHARS) {
          stdout = stdout.slice(stdout.length - MAX_OUTPUT_CHARS);
          truncated = true;
        }
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
        if (stderr.length > MAX_OUTPUT_CHARS) {
          stderr = stderr.slice(stderr.length - MAX_OUTPUT_CHARS);
          truncated = true;
        }
      });

      const exitCode = await new Promise<number | null>((resolve) => {
        child.on("close", (code) => resolve(code));
        child.on("error", () => resolve(null));
      });

      clearTimeout(timer);
      ctx.abortSignal?.removeEventListener("abort", onAbort);

      let result = stdout;
      if (stderr) result += `\n[STDERR]\n${stderr}`;
      if (exitCode !== null && exitCode !== 0) {
        result += `\n[EXIT CODE] ${exitCode}`;
      }
      if (truncated) {
        result += `\n[OUTPUT TRUNCATED: exceeded ${MAX_OUTPUT_CHARS} chars, kept tail]`;
      }

      return result.slice(0, 30000);
    } catch (err) {
      return `错误: ${(err as Error).message}`;
    }
  },
};
        
         

