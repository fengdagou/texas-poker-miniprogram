// 完整的德州扑克游戏测试
const { GameState, Player, GAME_STAGE, ACTION } = require('./utils/game.js')

console.log('='.repeat(60))
console.log('🎴 德州扑克 v2.4.2 - 完整自动化测试')
console.log('='.repeat(60))

let testsPassed = 0
let testsFailed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    testsPassed++
  } catch (e) {
    console.log(`❌ ${name}`)
    console.log(`   错误：${e.message}`)
    testsFailed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

// 测试 1: 游戏初始化
test('游戏初始化', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  assert(game.players.length === 0, '初始玩家数应为 0')
  assert(game.stage === GAME_STAGE.WAITING, '初始阶段应为 WAITING')
  assert(game.pot === 0, '初始底池应为 0')
})

// 测试 2: 添加玩家
test('添加玩家', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  const p1 = new Player('player1', '玩家 1', 1000, false)
  const bot1 = new Player('bot_1', '机器人 Alpha', 1000, true)
  const bot2 = new Player('bot_2', '机器人 Beta', 1000, true)
  
  game.addPlayer(p1)
  game.addPlayer(bot1)
  game.addPlayer(bot2)
  
  assert(game.players.length === 3, '玩家数应为 3')
  assert(game.players[0].isBot === false, '玩家 1 应是人类')
  assert(game.players[1].isBot === true, '玩家 2 应是机器人')
  assert(game.players[2].isBot === true, '玩家 3 应是机器人')
})

// 测试 3: 开始游戏
test('开始游戏', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  const result = game.startGame()
  
  assert(result.success === true, '游戏启动应成功')
  assert(game.stage === GAME_STAGE.PREFLOP, '阶段应为翻牌前')
  assert(game.pot === 30, '底池应为 30 (10+20)')
  assert(game.currentBet === 20, '当前下注应为 20')
})

// 测试 4: 盲注设置
test('盲注设置', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  // 检查盲注玩家
  const sbIndex = (game.dealerIndex + 1) % 3
  const bbIndex = (game.dealerIndex + 2) % 3
  
  assert(game.players[sbIndex].currentBet === 10, '小盲应下注 10')
  assert(game.players[bbIndex].currentBet === 20, '大盲应下注 20')
  assert(game.pot === 30, '底池应为 30')
})

// 测试 5: 当前玩家设置
test('当前玩家设置', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  const bbIndex = (game.dealerIndex + 2) % 3
  const expectedCurrentPlayerIndex = (bbIndex + 1) % 3
  
  console.log(`   庄家索引：${game.dealerIndex}`)
  console.log(`   大盲索引：${bbIndex}`)
  console.log(`   当前玩家索引：${game.currentPlayerIndex} (期望：${expectedCurrentPlayerIndex})`)
  
  assert(game.currentPlayerIndex === expectedCurrentPlayerIndex, '当前玩家应是大盲左边的玩家')
})

// 测试 6: 机器人操作 - 过牌
test('机器人操作 - 过牌', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  const currentPlayer = game.players[game.currentPlayerIndex]
  const toCall = game.currentBet - currentPlayer.currentBet
  
  console.log(`   当前玩家：${currentPlayer.name}`)
  console.log(`   需要跟注：${toCall}`)
  
  // 如果需要跟注为 0，应该可以过牌
  if (toCall === 0) {
    const result = game.playerAction(currentPlayer.id, ACTION.CHECK)
    assert(result.success === true, '过牌应成功')
  } else {
    const result = game.playerAction(currentPlayer.id, ACTION.CALL)
    assert(result.success === true, '跟注应成功')
  }
})

// 测试 7: 完整翻牌前流程
test('完整翻牌前流程', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  console.log('   翻牌前操作:')
  let rounds = 0
  while (game.stage === GAME_STAGE.PREFLOP && rounds < 10) {
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
      console.log('   ✅ 进入翻牌阶段')
      break
    }
    rounds++
  }
  
  assert(game.stage === GAME_STAGE.FLOP, '应进入翻牌阶段')
  assert(game.communityCards.length === 3, '应有 3 张公共牌')
})

// 测试 8: 状态同步
test('状态同步', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  const state = game.getState('player1')
  
  assert(state.stage === GAME_STAGE.PREFLOP, '状态阶段应正确')
  assert(state.players.length === 3, '状态玩家数应正确')
  assert(state.players[0].hand.length === 2, '玩家 1 应有 2 张手牌')
  assert(state.players[1].hand.length === 0, '机器人手牌对玩家 1 隐藏')
  assert(state.communityCards.length === 0, '翻牌前公共牌应为 0')
})

// 测试 9: 游戏流程完整性
test('游戏流程完整性', () => {
  const game = new GameState('test_room', 'player1', { small: 10, big: 20 })
  game.addPlayer(new Player('player1', '玩家 1', 1000, false))
  game.addPlayer(new Player('bot_1', '机器人 Alpha', 1000, true))
  game.addPlayer(new Player('bot_2', '机器人 Beta', 1000, true))
  
  game.startGame()
  
  // 模拟所有玩家过牌直到结束
  let totalRounds = 0
  while (game.stage < GAME_STAGE.FINISHED && totalRounds < 50) {
    const player = game.players[game.currentPlayerIndex]
    if (player.isFolded || player.isAllIn) {
      game.nextPlayer()
      continue
    }
    
    const toCall = game.currentBet - player.currentBet
    if (toCall === 0) {
      game.playerAction(player.id, ACTION.CHECK)
    } else {
      game.playerAction(player.id, ACTION.CALL)
    }
    
    totalRounds++
  }
  
  console.log(`   总轮数：${totalRounds}`)
  console.log(`   最终阶段：${game.stage}`)
  console.log(`   赢家：${game.winner ? game.winner.players.map(p => p.name).join(', ') : '无'}`)
  
  assert(game.stage === GAME_STAGE.FINISHED, '游戏应结束')
  assert(game.winner !== null, '应有赢家')
})

// 测试结果
console.log('='.repeat(60))
console.log('📊 测试结果')
console.log('='.repeat(60))
console.log(`✅ 通过：${testsPassed}`)
console.log(`❌ 失败：${testsFailed}`)
console.log(`📋 总计：${testsPassed + testsFailed}`)

if (testsFailed === 0) {
  console.log('\n🎉 所有测试通过！游戏逻辑正常！')
} else {
  console.log('\n⚠️ 有测试失败，请检查代码！')
  process.exit(1)
}
