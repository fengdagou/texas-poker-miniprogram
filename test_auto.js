// 德州扑克游戏自动化测试
const { GameState, Player, GAME_STAGE, ACTION } = require('./utils/game.js')

console.log('=== 德州扑克 v2.3.1 - 自动化测试 ===\n')

// 测试 1: 游戏初始化
console.log('📋 测试 1: 游戏初始化')
const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
console.log('✅ 游戏创建成功')

// 测试 2: 添加玩家
console.log('\n📋 测试 2: 添加玩家')
const p1 = new Player('player1', '玩家 1', 1000, false)
const bot1 = new Player('bot_1', '机器人 Alpha', 1000, true)
const bot2 = new Player('bot_2', '机器人 Beta', 1000, true)
game.addPlayer(p1)
game.addPlayer(bot1)
game.addPlayer(bot2)
console.log('✅ 添加 3 个玩家：玩家 1, 机器人 Alpha, 机器人 Beta')
console.log('   玩家索引：0=玩家 1, 1=机器人 Alpha, 2=机器人 Beta')

// 测试 3: 开始游戏
console.log('\n📋 测试 3: 开始游戏')
const result = game.startGame()
console.log('✅ 游戏启动:', result.success ? '成功' : '失败')
console.log('   庄家索引:', game.dealerIndex)
console.log('   当前玩家索引:', game.currentPlayerIndex)
console.log('   底池:', game.pot)
console.log('   当前下注:', game.currentBet)

// 测试 4: 检查盲注
console.log('\n📋 测试 4: 检查盲注')
console.log('   玩家列表:')
game.players.forEach((p, i) => {
  console.log(`   [${i}] ${p.name}: chips=${p.chips}, bet=${p.currentBet}, action=${p.lastAction || '无'}`)
})

// 测试 5: 检查当前玩家
console.log('\n📋 测试 5: 检查当前玩家')
const currentPlayer = game.players[game.currentPlayerIndex]
console.log('   当前玩家:', currentPlayer.name)
console.log('   是否机器人:', currentPlayer.isBot)
console.log('   是否可以操作:', !currentPlayer.isFolded && !currentPlayer.isAllIn)

// 测试 6: 模拟机器人操作
console.log('\n📋 测试 6: 模拟机器人操作')
const state = game.getState()
const toCall = state.currentBet - currentPlayer.currentBet
console.log('   需要跟注:', toCall)
console.log('   机器人决策中...')

// 模拟机器人跟注
const actionResult = game.playerAction(currentPlayer.id, ACTION.CALL)
console.log('   机器人操作:', actionResult.success ? '成功' : '失败')
console.log('   新的当前玩家索引:', game.currentPlayerIndex)

// 测试 7: 检查下一个玩家
console.log('\n📋 测试 7: 检查下一个玩家')
const nextPlayer = game.players[game.currentPlayerIndex]
console.log('   下一个玩家:', nextPlayer.name)
console.log('   是否机器人:', nextPlayer.isBot)

// 测试 8: 完整游戏流程模拟
console.log('\n📋 测试 8: 完整游戏流程模拟')
console.log('   模拟所有玩家过牌...')

// 继续模拟直到翻牌
while (game.stage === GAME_STAGE.PREFLOP) {
  const player = game.players[game.currentPlayerIndex]
  if (player.isFolded || player.isAllIn) {
    game.nextPlayer()
    continue
  }
  
  const toCall = game.currentBet - player.currentBet
  if (toCall === 0) {
    game.playerAction(player.id, ACTION.CHECK)
    console.log(`   - ${player.name} 过牌`)
  } else {
    game.playerAction(player.id, ACTION.CALL)
    console.log(`   - ${player.name} 跟注 ${toCall}`)
  }
  
  if (game.stage !== GAME_STAGE.PREFLOP) {
    console.log('   进入翻牌阶段！')
    break
  }
}

console.log('\n   公共牌:', game.communityCards.map(c => c.rank + c.suit).join(' '))
console.log('   游戏阶段:', game.stage)

// 测试 9: 检查状态同步
console.log('\n📋 测试 9: 检查状态同步')
const fullState = game.getState('player1')
console.log('   阶段:', fullState.stage)
console.log('   玩家数量:', fullState.players.length)
console.log('   我的手牌:', fullState.players[0].hand.length, '张')
console.log('   公共牌:', fullState.communityCards.length, '张')

console.log('\n=== 所有测试完成 ===\n')
