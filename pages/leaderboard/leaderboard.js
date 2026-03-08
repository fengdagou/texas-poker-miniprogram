/**
 * 排行榜页面逻辑
 */

Page({
  data: {
    currentTab: 'week',
    rankList: [],
    myRank: null,
    myScore: 0
  },

  onLoad() {
    this.loadRanking()
  },

  onShow() {
    this.loadRanking()
  },

  // 切换榜单
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadRanking()
  },

  // 加载排行榜数据
  loadRanking() {
    const { currentTab } = this.data
    
    // TODO: 从云开发或服务器获取数据
    // 这里使用模拟数据
    const mockData = this.getMockRanking(currentTab)
    
    this.setData({
      rankList: mockData.list,
      myRank: mockData.myRank,
      myScore: mockData.myScore
    })
  },

  // 模拟数据（实际应从服务器获取）
  getMockRanking(tab) {
    const baseScores = {
      week: 50000,
      month: 200000,
      all: 1000000
    }

    const list = []
    for (let i = 0; i < 10; i++) {
      list.push({
        userId: `user_${i}`,
        name: `玩家${i + 1}`,
        avatar: `/images/avatar${i % 3 + 1}.png`,
        score: baseScores[tab] - i * 1000,
        trend: i < 3 ? 'up' : (i < 6 ? 'same' : 'down')
      })
    }

    return {
      list,
      myRank: 156,
      myScore: 12500
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRanking()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
