import { promises } from "node:dns";
//打包这些内置函数
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeUnicodeSpaces(value: string): string {
  return value.replace(UNICODE_SPACES, " ");
}

function expandPath(filePath: string): string {
  const normalized = normalizeUnicodeSpaces(filePath);
  if (normalized === "~") {
    return os.homedir();
  }
  if (normalized.startsWith("~/")) {
    return os.homedir() + normalized.slice(1);
  }
  return normalized;
}

function resolveToCwd(filePath: string, cwd: string): string {
  const expanded = expandPath(filePath);
  if (path.isAbsolute(expanded)) {
    return expanded;
  }
  return path.resolve(cwd, expanded);
}

function shortPath(value: string): string {
  if (value.startsWith(os.homedir())) {
    return `~${value.slice(os.homedir().length)}`;
  }
  return value;
}

async function assertNoSymlink(relative: string, root: string): Promise<void> {
  if (!relative) {
    return;
  }
  const parts = relative.split(path.sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Path contains symlink: ${current}`);
      }
    } catch (err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "ENOENT") {
        return;
      }
      throw err;
    }
  }
}

export function resolveSandboxPath(params: {
  filePath: string;
  cwd: string;
  root: string;
}): { resolved: string; relative: string } {
  const resolved = resolveToCwd(params.filePath, params.cwd);
  const rootResolved = path.resolve(params.root);
  const relative = path.relative(rootResolved, resolved);
  if (!relative || relative === "") {
    return { resolved, relative: "" };
  }
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes workspace (${shortPath(rootResolved)}): ${params.filePath}`);
  }
  return { resolved, relative };
}

//打包完成

/**
 * normalizeUnicodeSpaces 规范化字符串中的Unicode空格字符函数
 * 输入value（任意字符串）
 * 通过内置replace函数将各类Unicode空格替换为普通空格
 * 输出规格化后的字符串
 */



/** 
 * expandPath 文件路径展开~操作函数
 * 输入 原始文件路径
 * 经过 normalizeUnicodeSpaces 规范化字符串中的Unicode空格字符函数 来规范化路径
 * 用户可能使用 ~/path/to/file 这样的路径简写，这个函数将其展开为完整的家目录路径（如 C:\Users\用户名\ ）
 * 如果路径是~则返回家目录，如果是~/则拼接家目录和剩余路径，否则返回原路径
 */



/**
 * resolveToCwd  文件路径相对于当前工作目录解析为绝对路径函数
 * 输入：用户请求的文件路径，当前工作目录
 * 经过 expandPath 文件路径展开~操作函数 处理
 * 
 * // 用户可能输入：
"src/utils.ts"           // 相对路径
"./src/utils.ts"         // 带 ./ 的相对路径
"../other/file.js"       // 带 ../ 的相对路径
"/home/user/project/src" // 绝对路径（Linux风格）
"C:\\project\\src"       // 绝对路径（Windows风格）
// 都需要转换为统一的绝对路径格式才能进行安全检查
 * 只有当 resolved 是绝对路径时，才能正确计算相对于 root 的相对路径 ，从而判断路径是否超出了沙箱范围。
 * 
 * 所以我们经过path.resolve处理得到：相对于cwd的绝对路径
 */


/**
 * resolveSandboxPath 解析并判断是否逃逸 函数
 * 输入：用户请求的文件路径，当前工作目录，沙箱根目录
 * 经过 esolveSandboxPath 文件路径相对于当前工作目录解析为绝对路径函数 
 * 经过path.relative函数处理 计算 相对于沙箱根目录的相对路径
 * 边界检查两种情况
 * 1. 如果相对路径为空（文件就在沙箱根目录下），直接返回
 * 2. 试图访问沙箱外的目录抛出异常，阻止访问
 */

/**
 * 前面的都算是内置函数，就这个函数在文件之外会用到
 * assertSandboxPath 断言沙箱路径安全性函数
 * 输入：用户请求的文件路径、当前工作目录和沙箱根目录
 * 经过 resolveSandboxPath 解析沙箱路径函数处理得到 解析后的绝对路径和相对路径
 * 再经过 assertNoSymlink 函数处理得到 验证无符号链接的安全路径
 * 最终输出：resolved_and_relative = {resolved(绝对路径);relative(相对于沙箱根目录的相对路径)}
 */
export async function assertSandboxPath(params:{
    filePath: string;
    cwd: string;
    root:string;
}) :Promise<{resolved:string;relative:string}>{
    const resolved_and_relative = resolveSandboxPath(params);
    await assertNoSymlink(resolved_and_relative.relative, path.resolve(params.root));
    return resolved_and_relative;
}