# 📤 微信后台上传指南

**版本**: v1.1.0  
**日期**: 2026-03-08

---

## ✅ 方法 1：微信开发者工具上传（推荐）

**最简单！不需要配置私钥！**

### 步骤

1. **打开微信开发者工具**

2. **导入项目**
   ```
   项目路径：/home/admin/.openclaw/workspace/texas-poker-miniprogram
   AppID: wx8d8c88ef31ceba32
   ```

3. **点击上传按钮**
   - 右上角 **"上传"** 按钮
   - 或菜单：项目 → 上传

4. **填写信息**
   ```
   版本号：1.1.0
   项目备注：v1.1.0 功能完整版：音效、动画、AI、任务、排行榜、荷官
   ```

5. **点击上传**
   - 等待上传完成
   - 成功后去微信后台查看

---

## ⚠️ 方法 2：命令行上传（需要配置私钥）

### 配置上传私钥

1. **登录微信后台**: https://mp.weixin.qq.com

2. **下载私钥**
   - 开发管理 → 开发设置
   - 找到 **"小程序代码上传私钥"**
   - 点击 **"重置"** 或 **"下载"**
   - 保存私钥文件

3. **替换本地私钥**
   ```bash
   # 备份旧私钥
   cp ~/.wechat-miniprogram/private.key ~/.wechat-miniprogram/private.key.backup
   
   # 将下载的新私钥复制到正确位置
   cp /path/to/downloaded/private.key ~/.wechat-miniprogram/private.key
   
   # 设置权限
   chmod 600 ~/.wechat-miniprogram/private.key
   ```

4. **重新上传**
   ```bash
   cd /home/admin/.openclaw/workspace/texas-poker-miniprogram
   npx miniprogram-ci upload \
     --appid wx8d8c88ef31ceba32 \
     --project-path . \
     --private-key-path ~/.wechat-miniprogram/private.key \
     --upload-version 1.1.0 \
     --upload-description "v1.1.0 功能完整版"
   ```

---

## 📋 上传后操作

### 1. 查看版本

登录微信后台：
- 版本管理 → 开发版本
- 应该能看到 **1.1.0 版本**

### 2. 设为体验版

- 点击 1.1.0 版本
- **"选为体验版"**
- 扫码体验

### 3. 提交审核

- 点击 **"提交审核"**
- 填写审核信息
- 等待 1-7 天

---

## 🎯 本次更新内容

### 新增功能
- ✅ 音效系统（6 个音效）
- ✅ 动画效果（发牌、下注、胜利等）
- ✅ AI 难度分级（4 种难度）
- ✅ 每日任务系统
- ✅ 排行榜（周榜/月榜/总榜）
- ✅ 美女荷官（3 种皮肤）

### 优化改进
- ✅ 代码模块化重构
- ✅ 错误处理优化
- ✅ 自动降级机制
- ✅ 完整文档

### 文件统计
- 总文件：30+ 个
- 代码量：约 3000 行
- 音效：6 个 WAV 文件
- 图片：3 个 SVG 荷官

---

## 🔧 常见问题

### Q1: 上传失败提示 "access_token missing"
**解决**: 使用方法 1（微信开发者工具上传），或重新配置私钥

### Q2: 找不到上传按钮
**解决**: 确保已登录开发者账号，且有上传权限

### Q3: 音效不播放
**解决**: 检查 sounds 目录是否有 WAV 文件，或手动静音测试

### Q4: 荷官图片不显示
**解决**: 检查 images/dealer 目录是否有 SVG 文件

---

## 📞 需要帮助？

查看其他文档：
- `README.md` - 项目说明
- `FINAL_REPORT.md` - 完成报告
- `TEST_REPORT.md` - 测试报告
- `DEPLOY.md` - 部署指南

---

**最后更新**: 2026-03-08  
**版本**: v1.1.0
