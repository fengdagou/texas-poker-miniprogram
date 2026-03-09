// pages/test/test.js - 游戏调试测试页面
Page({
  data: {
    logs: [],
    game: null,
    myIndex: 0
  },

  onLoad() {
    this.addLog('=== 游戏调试测试 ===')
    this.runTests()
  },

  addLog(message) {
    const logs = this.data.logs
    const timestamp = new Date().toLocaleTimeString()
    logs.push(`[${timestamp}] ${message}`)
    this.setData({ logs })
    console.log(message)
  },

  runTests() {
    const { GameState, Player, GAME_STAGE, ACTION } = require('../../utils/game.js')
    
    // 测试 1: 创建游戏
    this.addLog('📋 测试 1: 创建游戏')
    const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
    this.setData({ game })
    this.addLog('✅ 游戏创建成功')
    
    // 测试 2: 添加玩家
    this.addLog('📋 测试 2: 添加玩家')
    const p1 = new Player('player1', '玩家 1', 1000, false)
    const bot1 = new Player('bot_1', '机器人 Alpha', 1000, true)
    const bot2 = new Player('bot_2', '机器人 Beta', 1000, true)
    game.addPlayer(p1)
    game.addPlayer(bot1)
    game.addPlayer(bot2)
    this.addLog(`✅ 添加 3 个玩家`)
    this.addLog(`   玩家：${game.players.map(p => p.name).join(', ')}`)
    
    // 测试 3: 开始游戏
    this.addLog('📋 测试 3: 开始游戏')
    const result = game.startGame()
    this.addLog(`✅ 游戏启动：${result.success ? '成功' : '失败'}`)
    this.addLog(`   庄家索引：${game.dealerIndex}`)
    this.addLog(`   当前玩家索引：${game.currentPlayerIndex}`)
    this.addLog(`   底池：${game.pot}`)
    
    // 测试 4: 检查盲注
    this.addLog('📋 测试 4: 检查盲注')
    game.players.forEach((p, i) => {
      this.addLog(`   [${i}] ${p.name}: chips=${p.chips}, bet=${p.currentBet}, action=${p.lastAction || '无'}`)
    })
    
    // 测试 5: 检查当前玩家
    this.addLog('📋 测试 5: 检查当前玩家')
    const currentPlayer = game.players[game.currentPlayerIndex]
    this.addLog(`   当前玩家：${currentPlayer.name}`)
    this.addLog(`   是否机器人：${currentPlayer.isBot}`)
    
    // 测试 6: 模拟机器人操作
    this.addLog('📋 测试 6: 模拟机器人操作')
    const toCall = game.currentBet - currentPlayer.currentBet
    this.addLog(`   需要跟注：${toCall}`)
    
    if (toCall === 0) {
      game.playerAction(currentPlayer.id, ACTION.CHECK)
      this.addLog(`   - ${currentPlayer.name} 过牌`)
    } else {
      game.playerAction(currentPlayer.id, ACTION.CALL)
      this.addLog(`   - ${currentPlayer.name} 跟注 ${toCall}`)
    }
    
    this.addLog(`   新的当前玩家索引：${game.currentPlayerIndex}`)
    
    // 测试 7: 继续模拟
    this.addLog('📋 测试 7: 继续模拟游戏流程')
    let round = 0
    while (game.stage === GAME_STAGE.PREFLOP && round < 10) {
      const player = game.players[game.currentPlayerIndex]
      if (player.isFolded || player.isAllIn) {
        game.nextPlayer()
        continue
      }
      
      const toCall = game.currentBet - player.currentBet
      if (toCall === 0) {
        game.playerAction(player.id, ACTION.CHECK)
        this.addLog(`   - ${player.name} 过牌`)
      } else {
        game.playerAction(player.id, ACTION.CALL)
        this.addLog(`   - ${player.name} 跟注 ${toCall}`)
      }
      
      if (game.stage !== GAME_STAGE.PREFLOP) {
        this.addLog('   ✅ 进入翻牌阶段！')
        break
      }
      round++
    }
    
    this.addLog(`\n   公共牌：${game.communityCards.map(c => c.rank + c.suit).join(' ')}`)
    this.addLog(`   游戏阶段：${game.stage}`)
    
    // 测试 8: 检查状态
    this.addLog('📋 测试 8: 检查状态同步')
    const state = game.getState('player1')
    this.addLog(`   阶段：${state.stage}`)
    this.addLog(`   玩家数量：${state.players.length}`)
    this.addLog(`   我的手牌：${state.players[0].hand.length} 张`)
    
    this.addLog('\n=== 测试完成 ===')
  },

  copyLogs() {
    wx.setClipboardData({
      data: this.data.logs.join('\n')
    })
  }
})
