---
description: DashboardPage 测试案例
---

> 状态：初始为 [ ]、完成为 [x]
> 注意：状态只能在测试通过后由流程更新。
> 测试类型：前端元素、function 逻辑、Mock API、验证权限

---

## [x] 【前端元素】仪表板初始渲染显示标题、欢迎信息与登出按钮
**示例输入**：进入 `/dashboard` 页面，`user = { username: "dean", role: "admin" }`，商品资料尚未载入完成。  
**期望输出**：页面显示「仪表板」标题、欢迎文案 `Welcome, dean 👋`、角色徽章、登出按钮，以及商品区块标题「商品列表」。

---

## [x] 【前端元素】admin 角色显示前往管理后台链接
**示例输入**：进入 `/dashboard` 页面，`user = { username: "dean", role: "admin" }`。  
**期望输出**：页面显示前往 `/admin` 的「管理后台」导航链接。

---

## [x] 【前端元素】一般用户不显示前往管理后台链接
**示例输入**：进入 `/dashboard` 页面，`user = { username: "dean", role: "user" }`。  
**期望输出**：页面不显示前往 `/admin` 的「管理后台」导航链接。

---

## [x] 【function 逻辑】根据用户名首字母显示头像内容
**示例输入**：进入 `/dashboard` 页面，`user = { username: "dean", role: "user" }`。  
**期望输出**：欢迎卡片头像显示大写首字母 `D`。

---

## [x] 【function 逻辑】根据用户角色显示对应角色徽章文案
**示例输入**：分别以 `role = "admin"` 与 `role = "user"` 进入 `/dashboard` 页面。  
**期望输出**：`admin` 显示「管理员」徽章；`user` 显示「一般用户」徽章。

---

## [x] 【function 逻辑】点击登出后调用 logout 并跳转到 /login
**示例输入**：进入 `/dashboard` 页面并点击「登出」。  
**期望输出**：调用一次 `logout()`，并导航到 `/login`，同时使用 `replace: true` 且 `state: null`。

---

## [x] 【Mock API】商品载入中时显示 loading 状态
**示例输入**：进入 `/dashboard` 页面，并让 `getProducts()` Promise 暂不完成。  
**期望输出**：页面显示 loading spinner 与 `載入商品中...` 文案。

---

## [x] 【Mock API】商品读取成功后显示商品卡片列表
**示例输入**：进入 `/dashboard` 页面，mock `getProducts()` 成功回传 2 笔以上商品资料。  
**期望输出**：页面显示对应数量的商品卡片，且每张卡片呈现商品名称、描述与格式化后的价格。

---

## [x] 【Mock API】商品读取失败且后端回传 message 时显示后端错误讯息
**示例输入**：进入 `/dashboard` 页面，mock `getProducts()` 拒绝并回传 `{ response: { status: 500, data: { message: "服务器错误，请稍后再试" } } }`。  
**期望输出**：页面显示 `服务器错误，请稍后再试` 错误讯息，并结束 loading 状态。

---

## [x] 【Mock API】商品读取失败且后端未回传 message 时显示预设错误讯息
**示例输入**：进入 `/dashboard` 页面，mock `getProducts()` 拒绝且无 `response.data.message`。  
**期望输出**：页面显示预设错误讯息「无法载入商品资料」，并结束 loading 状态。

---

## [x] 【Mock API】商品读取失败且状态为 401 时不显示一般错误讯息并结束 loading
**示例输入**：进入 `/dashboard` 页面，mock `getProducts()` 拒绝并回传 `{ response: { status: 401 } }`。  
**期望输出**：页面不会显示一般错误讯息区块，且 loading 状态结束，将 401 交由拦截器后续处理。

---

## [x] 【验证权限】页面在 admin 身份下提供进入 /admin 的导航入口
**示例输入**：进入 `/dashboard` 页面，`user = { username: "dean", role: "admin" }`。  
**期望输出**：页面提供可点击的 `/admin` 导航入口，表示 admin 具有进入管理后台的权限。
