// app.js
App({
  onLaunch() {
    // 初始化本地存储
    this.initStorage()
  },

  initStorage() {
    // 初始化金币
    const coins = wx.getStorageSync('coins')
    if (!coins) {
      wx.setStorageSync('coins', 1000) // 初始赠送 1000 金币
    }
    
    // 初始化用户 ID
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      wx.setStorageSync('userId', newUserId)
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    gameId: null,
    roomId: null
  },

  // 获取金币
  getCoins() {
    return wx.getStorageSync('coins') || 0
  },

  // 增加金币
  addCoins(amount) {
    const coins = this.getCoins()
    wx.setStorageSync('coins', coins + amount)
    return coins + amount
  },

  // 减少金币
  deductCoins(amount) {
    const coins = this.getCoins()
    if (coins < amount) {
      return false
    }
    wx.setStorageSync('coins', coins - amount)
    return true
  },

  // 生成房间 ID
  generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase()
  }
})
