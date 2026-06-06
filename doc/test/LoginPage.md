---
description: LoginPage 测试案例
---

> 状态：初始为 [ ]、完成为 [x]
> 注意：状态只能在测试通过后由流程更新。
> 测试类型：前端元素、function 逻辑、Mock API、验证权限

---

## [x] 【前端元素】登录页初始渲染显示标题、输入框与提交按钮
**示例输入**：进入 `/login` 页面，`isAuthenticated = false`，`authExpiredMessage = null`。  
**期望输出**：页面显示欢迎标题、Email 输入框、密码输入框与「登录」按钮；Email 输入框 placeholder 为 `you@example.com`，密码输入框 placeholder 提示至少 8 个字符且需包含英文与数字。

---

## [x] 【前端元素】存在 authExpiredMessage 时显示错误提示横幅
**示例输入**：进入 `/login` 页面，`authExpiredMessage = "登录已过期，请重新登录"`。  
**期望输出**：页面显示 `role="alert"` 的错误提示横幅，并呈现 `登录已过期，请重新登录` 文案。

---

## [x] 【前端元素】未设置 VITE_API_URL 时显示 Mock 模式说明
**示例输入**：进入 `/login` 页面，`import.meta.env.VITE_API_URL` 为空。  
**期望输出**：页面底部显示开发提示，说明任意 Email 格式与符合规则的密码可用于体验。

---

## [x] 【function 逻辑】输入无效 Email 后提交显示 Email 格式错误并中止登录
**示例输入**：Email 输入 `abc`，密码输入 `abc12345`，点击「登录」。  
**期望输出**：显示 Email 格式错误讯息，不调用 `login(email, password)`，页面不跳转。

---

## [x] 【function 逻辑】输入少于 8 个字符的密码后提交显示密码长度错误并中止登录
**示例输入**：Email 输入 `user@example.com`，密码输入 `abc123`，点击「登录」。  
**期望输出**：显示密码长度错误讯息，不调用 `login(email, password)`，页面不跳转。

---

## [x] 【function 逻辑】输入未同时包含英文与数字的密码后提交显示密码格式错误并中止登录
**示例输入**：Email 输入 `user@example.com`，密码输入 `abcdefgh` 或 `12345678`，点击「登录」。  
**期望输出**：显示密码需包含英文与数字的错误讯息，不调用 `login(email, password)`，页面不跳转。

---

## [x] 【function 逻辑】修正输入内容后再次提交会清除栏位错误状态
**示例输入**：先以无效 Email 或无效密码提交一次，再改为 `user@example.com` 与 `abc12345` 后重新提交。  
**期望输出**：先前显示的 Email 或密码错误讯息被清除，对应输入框不再带有错误样式。

---

## [x] 【function 逻辑】提交有效账号密码后进入 loading 状态并禁用表单
**示例输入**：Email 输入 `user@example.com`，密码输入 `abc12345`，点击「登录」，并让 `login` Promise 暂不完成。  
**期望输出**：Email 输入框、密码输入框与提交按钮被禁用，按钮文案切换为加载中的提示并显示 spinner。

---

## [x] 【Mock API】登录成功后调用 login 并跳转到 /dashboard
**示例输入**：Email 输入 `user@example.com`，密码输入 `abc12345`，mock `login` 成功返回。  
**期望输出**：调用一次 `login("user@example.com", "abc12345")`，成功后导航至 `/dashboard`，并使用 `replace: true`。

---

## [x] 【Mock API】登录失败且后端回传 message 时显示后端错误讯息
**示例输入**：Email 输入 `user@example.com`，密码输入 `abc12345`，mock `login` 拒绝并回传 `{ response: { data: { message: "账号或密码错误" } } }`。  
**期望输出**：页面显示 `账号或密码错误` 错误讯息，loading 状态结束，按钮恢复可操作。

---

## [x] 【Mock API】登录失败且后端未回传 message 时显示预设错误讯息
**示例输入**：Email 输入 `user@example.com`，密码输入 `abc12345`，mock `login` 拒绝且无 `response.data.message`。  
**期望输出**：页面显示预设错误讯息「登录失败，请稍后再试」，loading 状态结束，按钮恢复可操作。

---

## [x] 【验证权限】已登录使用者进入登录页时自动跳转到 /dashboard
**示例输入**：进入 `/login` 页面，`isAuthenticated = true`。  
**期望输出**：组件挂载后立即导航至 `/dashboard`，并使用 `replace: true`，不让已登录使用者停留在登录页。
