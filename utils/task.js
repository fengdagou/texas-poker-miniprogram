/**
 * 每日任务系统
 */

// 任务类型
const TASK_TYPES = {
  DAILY_SIGNIN: 'daily_signin',      // 每日签到
  PLAY_GAMES: 'play_games',          // 玩游戏局数
  WIN_GAMES: 'win_games',            // 获胜局数
  GET_HAND: 'get_hand',              // 获得特定牌型
  ALL_IN: 'all_in',                  // 全下次数
  BLUFF: 'bluff',                    // 诈唬成功
}

// 任务配置
const TASK_CONFIG = {
  daily_signin: {
    title: '每日签到',
    description: '每天登录游戏',
    target: 1,
    reward: 1000,
    type: 'count'
  },
  play_games: {
    title: '游戏达人',
    description: '完成 5 局游戏',
    target: 5,
    reward: 500,
    type: 'count'
  },
  win_games: {
    title: '常胜将军',
    description: '获胜 3 局',
    target: 3,
    reward: 1000,
    type: 'count'
  },
  get_straight: {
    title: '顺子高手',
    description: '获得 2 次顺子',
    target: 2,
    reward: 800,
    type: 'count'
  },
  get_flush: {
    title: '同花大师',
    description: '获得 2 次同花',
    target: 2,
    reward: 800,
    type: 'count'
  },
  all_in_win: {
    title: '孤注一掷',
    description: '全下获胜 1 次',
    target: 1,
    reward: 1500,
    type: 'count'
  }
}

class TaskManager {
  constructor() {
    this.tasks = {}
    this.lastSigninDate = null
    this.load()
  }

  /**
   * 加载任务进度
   */
  load() {
    const saved = wx.getStorageSync('taskData')
    if (saved) {
      this.tasks = saved.tasks || {}
      this.lastSigninDate = saved.lastSigninDate
    }
    
    // 检查是否是新的一天
    this.checkNewDay()
  }

  /**
   * 保存任务进度
   */
  save() {
    wx.setStorageSync('taskData', {
      tasks: this.tasks,
      lastSigninDate: this.lastSigninDate
    })
  }

  /**
   * 检查是否是新的一天
   */
  checkNewDay() {
    const today = new Date().toDateString()
    
    if (this.lastSigninDate !== today) {
      // 新的一天，重置每日任务
      this.resetDailyTasks()
    }
  }

  /**
   * 重置每日任务
   */
  resetDailyTasks() {
    for (let key in TASK_CONFIG) {
      this.tasks[key] = {
        progress: 0,
        completed: false,
        claimed: false
      }
    }
    this.save()
  }

  /**
   * 获取所有任务状态
   */
  getTasks() {
    const result = []
    
    for (let key in TASK_CONFIG) {
      const config = TASK_CONFIG[key]
      const task = this.tasks[key] || {
        progress: 0,
        completed: false,
        claimed: false
      }
      
      result.push({
        id: key,
        title: config.title,
        description: config.description,
        target: config.target,
        reward: config.reward,
        progress: task.progress,
        completed: task.completed,
        claimed: task.claimed
      })
    }
    
    return result
  }

  /**
   * 更新任务进度
   */
  updateTask(taskId, increment = 1) {
    if (!this.tasks[taskId]) {
      this.tasks[taskId] = {
        progress: 0,
        completed: false,
        claimed: false
      }
    }

    const task = this.tasks[taskId]
    const config = TASK_CONFIG[taskId]

    if (task.completed || task.claimed) return false

    task.progress += increment

    if (task.progress >= config.target) {
      task.completed = true
      this.showNotification(config.title, '任务完成！')
    }

    this.save()
    return task.completed
  }

  /**
   * 每日签到
   */
  signin() {
    const today = new Date().toDateString()
    
    if (this.lastSigninDate === today) {
      return {
        success: false,
        message: '今天已经签到过了'
      }
    }

    this.lastSigninDate = today
    this.updateTask('daily_signin')
    this.save()

    return {
      success: true,
      reward: TASK_CONFIG.daily_signin.reward,
      message: '签到成功！获得 1000 金币'
    }
  }

  /**
   * 领取奖励
   */
  claimReward(taskId) {
    if (!this.tasks[taskId]) return { success: false }

    const task = this.tasks[taskId]
    const config = TASK_CONFIG[taskId]

    if (!task.completed || task.claimed) {
      return {
        success: false,
        message: '任务未完成或已领取'
      }
    }

    task.claimed = true
    this.save()

    // 添加金币
    const coins = wx.getStorageSync('playerCoins') || 10000
    wx.setStorageSync('playerCoins', coins + config.reward)

    return {
      success: true,
      reward: config.reward,
      message: `领取 ${config.reward} 金币！`
    }
  }

  /**
   * 显示通知
   */
  showNotification(title, content) {
    wx.showToast({
      title: content,
      icon: 'success',
      duration: 2000
    })
  }

  /**
   * 游戏结束回调
   */
  onGameEnd(isWin, handType) {
    // 更新游戏局数
    this.updateTask('play_games')

    // 更新获胜局数
    if (isWin) {
      this.updateTask('win_games')
    }

    // 更新特定牌型
    if (handType) {
      const handTaskMap = {
        'straight': 'get_straight',
        'flush': 'get_flush'
      }
      if (handTaskMap[handType]) {
        this.updateTask(handTaskMap[handType])
      }
    }
  }

  /**
   * 全下事件
   */
  onAllIn(isWin) {
    if (isWin) {
      this.updateTask('all_in_win')
    }
  }
}

// 单例
const taskManager = new TaskManager()

module.exports = taskManager
