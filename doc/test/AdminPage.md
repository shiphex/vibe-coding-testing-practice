---
description: AdminPage 测试案例
---

> 状态：初始为 [ ]、完成为 [x]
> 注意：状态只能在测试通过后由流程更新。
> 测试类型：前端元素、function 逻辑、验证权限

---

## [x] 【前端元素】管理后台初始渲染显示返回链接、标题、角色徽章与登出按钮
**示例输入**：进入 `/admin` 页面，`user = { username: "dean", role: "admin" }`。  
**期望输出**：页面显示返回 `/dashboard` 的链接、标题「管理后台」、角色徽章与「登出」按钮。

---

## [x] 【前端元素】页面显示管理员专属说明与三项权限提示
**示例输入**：进入 `/admin` 页面，`user = { username: "dean", role: "admin" }`。  
**期望输出**：页面显示「管理员专属页面」说明，并呈现「只有 admin 角色可以访问」、「user 角色会被重定向」、「受路由守卫保护」三项权限提示。

---

## [x] 【function 逻辑】点击返回链接可返回 /dashboard
**示例输入**：进入 `/admin` 页面并点击「返回」链接。  
**期望输出**：链接目标为 `/dashboard`，用户可经由该链接返回仪表板。

---

## [x] 【function 逻辑】点击登出后调用 logout 并跳转到 /login
**示例输入**：进入 `/admin` 页面并点击「登出」。  
**期望输出**：调用一次 `logout()`，并导航到 `/login`，同时使用 `replace: true` 且 `state: null`。

---

## [x] 【function 逻辑】根据用户角色显示对应角色徽章文案
**示例输入**：分别以 `role = "admin"` 与 `role = "user"` 渲染页面内容。  
**期望输出**：`admin` 显示「管理员」徽章；`user` 显示「一般用户」徽章。

---

## [x] 【验证权限】admin 角色进入 /admin 时可看到管理后台页面
**示例输入**：以已登录且 `role = "admin"` 的身份访问 `/admin`。  
**期望输出**：通过 `ProtectedRoute` 与 `RoleBasedRoute` 验证后，成功显示管理后台页面内容。

---

## [x] 【验证权限】一般用户进入 /admin 时会被重定向到 /dashboard
**示例输入**：以已登录且 `role = "user"` 的身份访问 `/admin`。  
**期望输出**：通过登录验证但不通过角色验证，页面被重定向到 `/dashboard`。

---

## [x] 【验证权限】未登录用户进入 /admin 时会被重定向到 /login
**示例输入**：以未登录状态访问 `/admin`。  
**期望输出**：无法通过 `ProtectedRoute` 验证，页面被重定向到 `/login`。

---

## [x] 【验证权限】权限验证进行中时显示路由守卫的 loading 状态
**示例输入**：访问 `/admin` 页面时，路由守卫仍处于 `isLoading = true`。  
**期望输出**：页面显示权限验证中的 loading spinner 与提示文案，而不是直接显示管理后台内容。
