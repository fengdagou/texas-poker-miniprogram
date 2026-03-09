# 📤 微信后台手动上传指南

## 问题原因

GitHub Actions 自动部署可能因为以下原因失败：
1. WECHAT_PRIVATE_KEY 未配置或过期
2. WECHAT_APPID/APPSECRET 配置错误
3. GitHub Actions 权限问题

## 解决方案：手动上传

### 方法 1：使用微信开发者工具（推荐）⭐

#### 步骤 1：下载代码

```bash
# 方式 A: 直接下载 ZIP
访问：https://github.com/fengdagou/texas-poker-miniprogram/archive/master.zip
解压到本地

# 方式 B: Git 克隆
git clone https://github.com/fengdagou/texas-poker-miniprogram.git
cd texas-poker-miniprogram
```

#### 步骤 2：打开微信开发者工具

1. 下载并安装：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 打开微信开发者工具
3. 登录你的微信账号

#### 步骤 3：导入项目

1. 点击 **"+"** 或 **"导入项目"**
2. 项目目录：选择刚下载的 `texas-poker-miniprogram` 文件夹
3. AppID：`wx8d8c88ef31ceba32`（或你的测试号）
4. 点击 **"导入"**

#### 步骤 4：上传代码

1. 点击右上角 **"上传"** 按钮（或按 Ctrl/Cmd + U）
2. 填写版本信息：
   - **版本号**: `2.3.0-hint`
   - **项目备注**: `古典风格 + 荷官发牌 + 语音 + 出牌提示`
3. 点击 **"上传"**

#### 步骤 5：微信后台设置

1. 访问：https://mp.weixin.qq.com
2. 左侧菜单：**版本管理**
3. 找到刚上传的版本 `2.3.0-hint`
4. 点击 **"设为体验版"**
5. 扫码体验测试

---

### 方法 2：修复 GitHub Actions

#### 步骤 1：检查 Secrets 配置

访问：https://github.com/fengdagou/texas-poker-miniprogram/settings/secrets/actions

确保以下 Secrets 已配置：

| Name | Value | 说明 |
|------|-------|------|
| `WECHAT_APPID` | `wx8d8c88ef31ceba32` | 小程序 AppID |
| `WECHAT_APPSECRET` | (你的密钥) | 小程序密钥 |
| `WECHAT_PRIVATE_KEY` | (私钥内容) | 上传私钥（base64 编码） |

#### 步骤 2：生成私钥（如果没有）

1. 打开微信开发者工具
2. 设置 → 安全设置 → 上传代码私钥
3. 点击 **"生成私钥"**
4. 复制私钥内容（包含 BEGIN/END）
5. 上传到微信后台：开发 → 开发管理 → 开发设置

#### 步骤 3：重新触发部署

```bash
cd /home/admin/.openclaw/workspace/texas-poker-miniprogram
git commit --allow-empty -m "ci: 重新触发部署"
git push
```

---

## 📋 当前版本信息

**最新版本**: v2.3.0-hint
**提交**: `7e03946`
**提交时间**: 2026-03-09 09:28

### 更新内容

1. ✅ 古典风格设计
2. ✅ 荷官 Victoria 发牌动画
3. ✅ 5 条荷官语音（Microsoft Azure）
4. ✅ 出牌提示功能（视觉 + 音效 + 震动）

---

## 🎯 快速验证

上传后，在微信后台查看：

1. **版本管理** → 应该有 `2.3.0-hint`
2. **设为体验版** → 扫码测试
3. **测试项目**：
   - [ ] 首页古典风格
   - [ ] Victoria 发牌动画
   - [ ] 荷官语音播放
   - [ ] 出牌提示框
   - [ ] 提示音 + 震动

---

## ⚠️ 常见问题

### Q: 看不到新版本？
A: 刷新页面，或等待 1-2 分钟同步

### Q: 上传失败？
A: 检查 AppID 是否正确，私钥是否已上传到微信后台

### Q: 体验版二维码无效？
A: 确保你是项目成员（需要管理员添加）

---

**推荐使用方法 1（微信开发者工具）最快最直接！** 🚀
