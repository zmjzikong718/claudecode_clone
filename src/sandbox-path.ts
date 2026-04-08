
//assertNoSymlink

//resolveSandboxPath

//assertSandboxPath 沙箱路径断言函数
//输入 文件路径 + 当前工作目录 + 根目录（沙箱边界）
//返回Promise对象，解析后是 解析后的完整路径（实际操作） + 相对路径（安全验证）
//输入参数 经过resolveSandboxPath 解析路径并检查越界 → assertNoSymlink 检查符号链接 → 返回Promise对象
