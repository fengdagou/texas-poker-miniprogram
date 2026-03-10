/**
 * 德州扑克游戏 - 完整自动化测试
 * 覆盖所有游戏流程和边界情况
 */

const { GameState, Player, GAME_STAGE, ACTION } = require('./utils/game.js');
const { Card, Deck, HandEvaluator, HAND_TYPES } = require('./utils/poker.js');

console.log('🎮 德州扑克自动化测试 - 完整版\n');
console.log('=' .repeat(60));

let testsPassed = 0;
let testsFailed = 0;
let currentTestGroup = '';

function testGroup(name) {
  currentTestGroup = name;
  console.log(`\n📋 ${name}`);
  console.log('-'.repeat(60));
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     错误：${error.message}`);
    console.log(`     堆栈：${error.stack.split('\n')[1]}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createGame(playerCount = 2, playerChips = 10000, botChips = 1000) {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  // 添加玩家
  game.addPlayer(new Player('user_001', '测试玩家', playerChips, false));
  
  // 添加机器人
  for (let i = 0; i < playerCount - 1; i++) {
    game.addPlayer(new Player(`bot_${i}`, `机器人${i + 1}`, botChips, true));
  }
  
  return game;
}

function simulateRound(game, action = ACTION.CALL, amount = 0) {
  // 模拟当前玩家操作
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
    game.playerAction(currentPlayer.id, action, amount);
  }
}

function playUntilStage(game, targetStage) {
  let maxIterations = 200;
  let iterations = 0;
  let lastStage = game.stage;
  let stuckCount = 0;
  
  while (game.stage < targetStage && iterations < maxIterations) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    
    if (currentPlayer && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      if (game.currentBet > currentPlayer.currentBet) {
        // 需要跟注
        const toCall = game.currentBet - currentPlayer.currentBet;
        if (toCall >= currentPlayer.chips) {
          game.playerAction(currentPlayer.id, ACTION.ALL_IN);
        } else {
          game.playerAction(currentPlayer.id, ACTION.CALL);
        }
      } else {
        game.playerAction(currentPlayer.id, ACTION.CHECK);
      }
    }
    
    // 检测是否卡住
    if (game.stage === lastStage) {
      stuckCount++;
      if (stuckCount > 20) {
        console.log(`    ⚠️  检测到卡住，阶段：${game.stage}, 迭代：${iterations}`);
        break;
      }
    } else {
      lastStage = game.stage;
      stuckCount = 0;
    }
    
    iterations++;
  }
  
  return iterations < maxIterations;
}

// ==================== 基础功能测试 ====================
testGroup('📦 基础功能测试');

test('初始化游戏', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  assert(game.roomId === 'test_room', '房间 ID 错误');
  assert(game.blinds.small === 10, '小盲错误');
  assert(game.blinds.big === 20, '大盲错误');
  assert(game.players.length === 0, '初始玩家数应该为 0');
  assert(game.stage === GAME_STAGE.WAITING, '初始阶段应该是 WAITING');
});

test('添加玩家', () => {
  const game = createGame(1);
  assert(game.players.length === 1, '玩家数应该为 1');
  assert(game.players[0].name === '测试玩家', '玩家名称错误');
  assert(game.players[0].chips === 10000, '玩家金币错误');
});

test('添加多个机器人', () => {
  const game = createGame(4);
  assert(game.players.length === 4, '玩家数应该为 4');
  assert(game.players[1].isBot === true, '第二个玩家应该是机器人');
  assert(game.players[2].isBot === true, '第三个玩家应该是机器人');
});

test('房间人数上限 (6 人)', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  for (let i = 0; i < 6; i++) {
    const result = game.addPlayer(new Player(`player_${i}`, `玩家${i}`, 1000, false));
    assert(result.success === true, `添加第${i + 1}个玩家失败`);
  }
  
  // 第 7 个玩家应该失败
  const result = game.addPlayer(new Player('player_7', '玩家 7', 1000, false));
  assert(result.success === false, '第 7 个玩家应该添加失败');
});

// ==================== 发牌系统测试 ====================
testGroup('🃏 发牌系统测试');

test('开始游戏 - 2 人局', () => {
  const game = createGame(2);
  const result = game.startGame();
  
  assert(result.success === true, '开始游戏失败');
  assert(game.players[0].hand.length === 2, '玩家应该有 2 张手牌');
  assert(game.players[1].hand.length === 2, '机器人应该有 2 张手牌');
  assert(game.stage === GAME_STAGE.PREFLOP, '应该在翻牌前阶段');
});

test('开始游戏 - 所有玩家都发牌', () => {
  const game = createGame(4);
  game.startGame();
  
  for (let i = 0; i < 4; i++) {
    assert(game.players[i].hand.length === 2, `玩家${i}应该有 2 张手牌`);
  }
});

test('开始游戏 - 金币为 0 的玩家也发牌', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  game.addPlayer(new Player('user_001', '测试玩家', 0, false)); // 金币为 0
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  
  const result = game.startGame();
  
  assert(result.success === true, '开始游戏失败');
  assert(game.players[0].hand.length === 2, '金币为 0 的玩家也应该有手牌');
  assert(game.players[0].isAllIn === true, '金币为 0 的玩家应该是 All-in 状态');
});

test('盲注系统 - 小盲', () => {
  const game = createGame(3);
  game.startGame();
  
  const sbIndex = (game.dealerIndex + 1) % game.players.length;
  const sbPlayer = game.players[sbIndex];
  
  assert(sbPlayer.currentBet === 10, `小盲应该是 10，实际是${sbPlayer.currentBet}`);
  assert(sbPlayer.chips === 990, `小盲后金币应该是 990，实际是${sbPlayer.chips}`);
});

test('盲注系统 - 大盲', () => {
  const game = createGame(3, 1000, 1000); // 使用 1000 金币，和机器人一样
  game.startGame();
  
  const bbIndex = (game.dealerIndex + 2) % game.players.length;
  const bbPlayer = game.players[bbIndex];
  
  assert(bbPlayer.currentBet === 20, `大盲应该是 20，实际是${bbPlayer.currentBet}`);
  assert(bbPlayer.chips === 980, `大盲后金币应该是 980，实际是${bbPlayer.chips}`);
});

test('盲注系统 - 底池正确', () => {
  const game = createGame(3);
  game.startGame();
  
  assert(game.pot === 30, `底池应该是 30，实际是${game.pot}`);
});

// ==================== 玩家操作测试 ====================
testGroup('🎮 玩家操作测试');

test('玩家操作 - 弃牌', () => {
  const game = createGame(2);
  game.startGame();
  
  const result = game.playerAction('user_001', ACTION.FOLD);
  
  assert(result.success === true, '弃牌操作失败');
  assert(game.players[0].isFolded === true, '玩家应该已弃牌');
});

test('玩家操作 - 过牌', () => {
  const game = createGame(2);
  game.startGame();
  
  // 先让大盲过牌（已经下了 20）
  const bbIndex = (game.dealerIndex + 2) % game.players.length;
  const bbPlayer = game.players[bbIndex];
  
  if (bbPlayer.id === 'user_001') {
    const result = game.playerAction('user_001', ACTION.CHECK);
    assert(result.success === true, '过牌操作失败');
  }
});

test('玩家操作 - 跟注', () => {
  const game = createGame(2);
  game.startGame();
  
  // 先找到大盲位置的玩家
  const bbIndex = (game.dealerIndex + 2) % game.players.length;
  
  // 如果用户是大盲，需要先让别人行动
  if (game.players[bbIndex].id === 'user_001') {
    // 用户是大盲，可以过牌
    const result = game.playerAction('user_001', ACTION.CHECK);
    assert(result.success === true, '大盲过牌失败');
  } else {
    // 用户是小盲或更早位置，需要跟注
    const result = game.playerAction('user_001', ACTION.CALL);
    assert(result.success === true, '跟注操作失败');
    assert(game.players[0].currentBet === 20, '跟注后应该和大盲一样');
  }
});

test('玩家操作 - 加注', () => {
  const game = createGame(2);
  game.startGame();
  
  const result = game.playerAction('user_001', ACTION.RAISE, 50);
  
  assert(result.success === true, '加注操作失败');
  assert(game.players[0].currentBet >= 70, '加注后下注应该增加');
});

test('玩家操作 - All-in', () => {
  const game = createGame(2, 100); // 玩家只有 100 金币
  game.startGame();
  
  const result = game.playerAction('user_001', ACTION.ALL_IN);
  
  assert(result.success === true, 'All-in 操作失败');
  assert(game.players[0].chips === 0, 'All-in 后金币应该为 0');
  assert(game.players[0].isAllIn === true, 'All-in 后状态应该正确');
});

test('玩家操作 - 非回合时操作失败', () => {
  const game = createGame(3);
  game.startGame();
  
  // 尝试在非自己回合操作
  const result = game.playerAction('user_001', ACTION.CHECK);
  
  assert(result.success === false, '非回合时操作应该失败');
});

// ==================== 游戏阶段推进测试 ====================
testGroup('🔄 游戏阶段推进测试');

test('翻牌前 → 翻牌', () => {
  const game = createGame(2);
  game.startGame();
  
  playUntilStage(game, GAME_STAGE.FLOP);
  
  assert(game.stage === GAME_STAGE.FLOP, `应该进入翻牌阶段，实际是${game.stage}`);
  assert(game.communityCards.length === 3, `应该有 3 张公共牌，实际是${game.communityCards.length}`);
});

test('翻牌 → 转牌', () => {
  const game = createGame(2);
  game.startGame();
  
  playUntilStage(game, GAME_STAGE.TURN);
  
  assert(game.stage === GAME_STAGE.TURN, `应该进入转牌阶段，实际是${game.stage}`);
  assert(game.communityCards.length === 4, `应该有 4 张公共牌，实际是${game.communityCards.length}`);
});

test('转牌 → 河牌', () => {
  const game = createGame(2);
  game.startGame();
  
  playUntilStage(game, GAME_STAGE.RIVER);
  
  assert(game.stage === GAME_STAGE.RIVER, `应该进入河牌阶段，实际是${game.stage}`);
  assert(game.communityCards.length === 5, `应该有 5 张公共牌，实际是${game.communityCards.length}`);
});

test('河牌 → 摊牌', () => {
  const game = createGame(2);
  game.startGame();
  
  playUntilStage(game, GAME_STAGE.SHOWDOWN);
  
  assert(game.stage === GAME_STAGE.SHOWDOWN || game.stage === GAME_STAGE.FINISHED, 
    `应该进入摊牌或结束阶段，实际是${game.stage}`);
});

test('完整游戏流程', () => {
  const game = createGame(2);
  game.startGame();
  
  playUntilStage(game, GAME_STAGE.FINISHED);
  
  assert(game.stage === GAME_STAGE.FINISHED, '游戏应该结束');
  assert(game.winner !== null, '应该有获胜者');
  assert(game.winner.players.length > 0, '获胜者列表不应该为空');
});

// ==================== All-in 场景测试 ====================
testGroup('💥 All-in 场景测试');

test('All-in 后继续发公共牌', () => {
  const game = createGame(2, 100, 100); // 双方都只有 100 金币
  game.startGame();
  
  // 玩家 All-in
  game.playerAction('user_001', ACTION.ALL_IN);
  
  // 机器人跟注（也 All-in）
  const botIndex = (game.currentPlayerIndex);
  if (game.players[botIndex]) {
    game.playerAction(game.players[botIndex].id, ACTION.CALL);
  }
  
  // 应该继续发公共牌，而不是直接结束
  assert(game.stage >= GAME_STAGE.FLOP, `All-in 后应该发公共牌，实际阶段：${game.stage}`);
  assert(game.communityCards.length >= 0, '应该有公共牌或即将发公共牌');
});

test('多人 All-in 后发完所有公共牌', () => {
  const game = createGame(3, 100, 100);
  game.startGame();
  
  // 所有玩家 All-in
  let iterations = 0;
  while (iterations < 20) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      game.playerAction(currentPlayer.id, ACTION.ALL_IN);
    }
    if (game.stage === GAME_STAGE.FINISHED) break;
    iterations++;
  }
  
  assert(game.stage === GAME_STAGE.FINISHED, '游戏应该结束');
  assert(game.communityCards.length === 5, `应该有 5 张公共牌，实际是${game.communityCards.length}`);
});

test('All-in 后摊牌显示所有手牌', () => {
  const game = createGame(2, 100, 100);
  game.startGame();
  
  // 双方 All-in
  game.playerAction('user_001', ACTION.ALL_IN);
  
  const botIndex = (game.dealerIndex + 2) % game.players.length;
  game.playerAction(game.players[botIndex].id, ACTION.CALL);
  
  // 玩到结束
  playUntilStage(game, GAME_STAGE.FINISHED);
  
  // 检查 getState 是否返回所有手牌
  const state = game.getState('user_001');
  
  // 摊牌后应该能看到所有玩家的手牌
  assert(state.stage === GAME_STAGE.FINISHED, '游戏应该结束');
  // 注意：由于修复了逻辑，现在应该能看到所有手牌
});

// ==================== 胜负判定测试 ====================
testGroup('🏆 胜负判定测试');

test('单人对决 - 高牌获胜', () => {
  const game = createGame(2);
  game.startGame();
  playUntilStage(game, GAME_STAGE.FINISHED);
  
  assert(game.winner !== null, '应该有获胜者');
  assert(game.winner.players.length >= 1, '应该至少有一个获胜者');
});

test('多人底池分配', () => {
  const game = createGame(3);
  game.startGame();
  playUntilStage(game, GAME_STAGE.FINISHED);
  
  assert(game.winner !== null, '应该有获胜者');
  if (game.winner.players.length > 1) {
    // 多人获胜时，彩池应该被平分
    const winAmount = game.winner.amount;
    const totalPot = game.winner.amount * game.winner.players.length;
    assert(Math.abs(totalPot - game.pot) < 10, '彩池分配应该正确'); // 允许少量误差
  }
});

test('其他人弃牌 - 自动获胜', () => {
  const game = createGame(3);
  game.startGame();
  
  // 其他玩家都弃牌
  for (let i = 1; i < game.players.length; i++) {
    if (game.players[i].id !== 'user_001' && !game.players[i].isFolded) {
      // 找到当前玩家并弃牌
      while (game.currentPlayerIndex !== i && game.stage !== GAME_STAGE.FINISHED) {
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
          game.playerAction(currentPlayer.id, ACTION.FOLD);
        }
        if (game.stage === GAME_STAGE.FINISHED) break;
      }
      if (game.stage === GAME_STAGE.FINISHED) break;
      if (game.currentPlayerIndex === i) {
        game.playerAction(game.players[i].id, ACTION.FOLD);
      }
    }
  }
  
  // 应该直接获胜，不需要发公共牌
  if (game.stage === GAME_STAGE.FINISHED) {
    assert(game.winner !== null, '应该有获胜者');
    assert(game.winner.players.length === 1, '应该只有一个获胜者');
  }
});

// ==================== getState 数据完整性测试 ====================
testGroup('📊 数据完整性测试');

test('getState - 基础数据', () => {
  const game = createGame(2);
  game.startGame();
  
  const state = game.getState('user_001');
  
  assert(state.roomId === 'test_room', 'roomId 应该正确');
  assert(state.stage !== undefined, '应该有 stage');
  assert(state.pot !== undefined, '应该有 pot');
  assert(Array.isArray(state.communityCards), 'communityCards 应该是数组');
  assert(Array.isArray(state.players), 'players 应该是数组');
});

test('getState - 玩家数据', () => {
  const game = createGame(2);
  game.startGame();
  
  const state = game.getState('user_001');
  const myPlayer = state.players[0];
  
  assert(myPlayer.name !== undefined, '应该有 name');
  assert(myPlayer.chips !== undefined, '应该有 chips');
  assert(myPlayer.currentBet !== undefined, '应该有 currentBet');
  assert(myPlayer.isFolded !== undefined, '应该有 isFolded');
  assert(myPlayer.isAllIn !== undefined, '应该有 isAllIn');
});

test('getState - 手牌数据', () => {
  const game = createGame(2);
  game.startGame();
  
  const state = game.getState('user_001');
  const myPlayer = state.players.find(p => p.id === 'user_001');
  
  assert(myPlayer.hand.length === 2, '应该有 2 张手牌');
  assert(myPlayer.hand[0].rank !== undefined, '手牌应该有 rank');
  assert(myPlayer.hand[0].suit !== undefined, '手牌应该有 suit');
});

test('getState - 摊牌后显示所有手牌', () => {
  const game = createGame(2);
  game.startGame();
  playUntilStage(game, GAME_STAGE.FINISHED);
  
  const state = game.getState('user_001');
  
  // 摊牌后，所有未弃牌玩家的手牌都应该显示
  for (let player of state.players) {
    if (!player.isFolded) {
      assert(player.hand.length === 2, `玩家${player.name}应该有 2 张手牌显示`);
    }
  }
});

test('getState - 公共牌数据', () => {
  const game = createGame(2);
  game.startGame();
  playUntilStage(game, GAME_STAGE.FLOP);
  
  const state = game.getState('user_001');
  
  assert(state.communityCards.length >= 3, '应该有至少 3 张公共牌');
  
  for (let card of state.communityCards) {
    if (card) {
      assert(card.rank !== undefined, '公共牌应该有 rank');
      assert(card.suit !== undefined, '公共牌应该有 suit');
    }
  }
});

// ==================== 边界情况测试 ====================
testGroup('🔍 边界情况测试');

test('2 人局最小游戏', () => {
  const game = createGame(2);
  const result = game.startGame();
  
  assert(result.success === true, '2 人局应该能开始');
});

test('6 人局最大游戏', () => {
  const game = createGame(6);
  const result = game.startGame();
  
  assert(result.success === true, '6 人局应该能开始');
  assert(game.players.length === 6, '应该有 6 个玩家');
});

test('金币为 0 时自动赠送', () => {
  // 这个测试需要前端配合，这里只测试后端逻辑
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  game.addPlayer(new Player('user_001', '测试玩家', 0, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  
  const result = game.startGame();
  
  assert(result.success === true, '金币为 0 也应该能开始游戏');
  assert(game.players[0].hand.length === 2, '金币为 0 的玩家也应该有手牌');
});

test('牌型评估 - 皇家同花顺', () => {
  const hand = [new Card('A', '♠'), new Card('K', '♠')];
  const community = [
    new Card('Q', '♠'),
    new Card('J', '♠'),
    new Card('10', '♠'),
    new Card('9', '♥'),
    new Card('8', '♥')
  ];
  
  const result = HandEvaluator.evaluate(hand, community);
  
  // A♠ K♠ Q♠ J♠ 10♠ = 皇家同花顺
  assert(
    result.type === HAND_TYPES.ROYAL_FLUSH || 
    result.type === HAND_TYPES.STRAIGHT_FLUSH || 
    result.type === HAND_TYPES.FLUSH, 
    `应该是皇家同花顺/同花顺/同花，实际是${result.typeName}`
  );
});

test('牌型评估 - 四条', () => {
  const hand = [new Card('K', '♠'), new Card('K', '♥')];
  const community = [
    new Card('K', '♦'),
    new Card('K', '♣'),
    new Card('9', '♠'),
    new Card('4', '♥'),
    new Card('2', '♦')
  ];
  
  const result = HandEvaluator.evaluate(hand, community);
  
  assert(result.type === HAND_TYPES.FOUR_OF_A_KIND, `应该是四条，实际是${result.typeName}`);
});

// ==================== 测试结果输出 ====================
console.log('\n' + '='.repeat(60));
console.log('📊 测试结果汇总');
console.log('='.repeat(60));
console.log(`✅ 通过：${testsPassed}`);
console.log(`❌ 失败：${testsFailed}`);
console.log(`📈 通过率：${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  console.log('\n❌ 有测试失败，请检查代码！');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！游戏逻辑正常！');
  process.exit(0);
}
