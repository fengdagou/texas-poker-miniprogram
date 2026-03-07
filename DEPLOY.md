# 🚀 自动化部署配置指南

## 第一步：在 GitHub 配置 Secrets

1. 打开仓库：https://github.com/fengdagou/texas-poker-miniprogram
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 3 个密钥：

### 添加 Secrets

| Name | Value | 说明 |
|------|-------|------|
| `WECHAT_APPID` | `wx8d8c88ef31ceba32` | 小程序 AppID |
| `WECHAT_APPSECRET` | `bc895de361f3032c2141580c2377c9ed` | 小程序密钥 |
| `WECHAT_PRIVATE_KEY` | (见下方) | 上传私钥 |

### 生成 WECHAT_PRIVATE_KEY

**方法 1：用微信开发者工具生成（推荐）**

1. 打开微信开发者工具
2. 设置 → 安全设置 → 上传代码私钥
3. 点"生成私钥"
4. 复制生成的私钥内容（包含 BEGIN/END）

**方法 2：使用已生成的私钥**

我已经帮你生成了私钥，位置：`~/.wechat-miniprogram/private.key`

查看命令：
```bash
cat ~/.wechat-miniprogram/private.key
```

复制全部内容（包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`），粘贴到 GitHub Secrets。

---

## 第二步：在微信后台配置

1. 登录 https://mp.weixin.qq.com
2. 进入小程序管理后台
3. 左侧：**开发** → **开发管理** → **开发设置**
4. 找到 **"上传代码私钥"** 部分
5. 点 **"上传"**，选择生成的私钥文件：`~/.wechat-miniprogram/private.key`
6. 确认上传

---

## 第三步：测试部署

推送代码测试：

```bash
cd /home/admin/.openclaw/workspace/texas-poker-miniprogram
git add .
git commit -m "test: 测试自动部署"
git push
```

然后：
1. 打开 GitHub Actions：https://github.com/fengdagou/texas-poker-miniprogram/actions
2. 查看部署进度
3. 成功后去微信后台查看版本

---

## 📝 使用说明

### 自动部署流程

每次 `git push` 后：
1. ✅ GitHub Actions 自动运行
2. ✅ 自动上传代码到微信后台
3. ✅ 自动更新版本号
4. ⚠️ 需要手动在微信后台提交审核

### 版本号管理

修改 `project.config.json` 中的 `version` 字段：
```json
{
  "version": "1.0.1"
}
```

### 查看部署结果

- GitHub Actions 日志：https://github.com/fengdagou/texas-poker-miniprogram/actions
- 微信后台版本列表：https://mp.weixin.qq.com → 版本管理

---

## ⚠️ 注意事项

1. **私钥保密** - 不要泄露给他人
2. **首次需要手动审核** - 第一个版本需要微信审核
3. **体验版** - 可以先设为体验版，扫码测试
4. **审核时间** - 正式版审核需要 1-7 天

---

## 🎯 快速上手

```bash
# 1. 修改代码
# 2. 提交推送
git add .
git commit -m "feat: 更新内容"
git push

# 3. 等 GitHub Actions 完成
# 4. 去微信后台查看版本
```

---

**配置完成后，每次推送代码都会自动部署！** 🎉
