#!/usr/bin/env node
/**
 * 德州扑克游戏自动化测试
 * 模拟游戏流程，检查所有功能是否正常
 */

const { GameState, Player, GAME_STAGE, ACTION } = require('./utils/game.js');
const { Card, Deck, HandEvaluator, HAND_TYPES } = require('./utils/poker.js');

console.log('🎮 开始自动化测试...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// 测试 1: 初始化游戏
test('初始化游戏', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  assert(game.roomId === 'test_room', '房间 ID 错误');
  assert(game.players.length === 0, '初始玩家数应该为 0');
});

// 测试 2: 添加玩家
test('添加玩家', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  const player = new Player('user_001', '测试玩家', 10000, false);
  const result = game.addPlayer(player);
  
  assert(result.success === true, '添加玩家失败');
  assert(game.players.length === 1, '玩家数应该为 1');
});

// 测试 3: 添加机器人
test('添加机器人', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  
  assert(game.players.length === 2, '玩家数应该为 2');
  assert(game.players[1].isBot === true, '第二个玩家应该是机器人');
});

// 测试 4: 开始游戏并发牌
test('开始游戏并发牌', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  
  const result = game.startGame();
  
  assert(result.success === true, '开始游戏失败');
  assert(game.players[0].hand.length === 2, '玩家应该有 2 张手牌');
  assert(game.players[1].hand.length === 2, '机器人应该有 2 张手牌');
});

// 测试 5: 盲注系统
test('盲注系统', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.addPlayer(new Player('bot_1', '机器人 2', 1000, true));
  
  game.startGame();
  
  assert(game.pot >= 30, '底池应该至少有盲注 30');
  assert(game.stage === GAME_STAGE.PREFLOP, '应该在翻牌前阶段');
});

// 测试 6: 玩家操作 - 弃牌
test('玩家操作 - 弃牌', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  // 模拟到用户回合
  const result = game.playerAction('user_001', ACTION.FOLD);
  
  assert(result.success === true, '弃牌操作失败');
  assert(game.players[0].isFolded === true, '玩家应该已弃牌');
});

// 测试 7: 玩家操作 - 跟注
test('玩家操作 - 跟注', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  const result = game.playerAction('user_001', ACTION.CALL);
  
  assert(result.success === true, '跟注操作失败');
});

// 测试 8: 玩家操作 - 加注
test('玩家操作 - 加注', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  const result = game.playerAction('user_001', ACTION.RAISE, 50);
  
  assert(result.success === true, '加注操作失败');
  assert(game.players[0].currentBet >= 50, '玩家下注应该至少 50');
});

// 测试 9: 游戏阶段推进
test('游戏阶段推进', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.addPlayer(new Player('bot_1', '机器人 2', 1000, true));
  game.startGame();
  
  // 模拟完整的一轮下注（需要 3 个玩家都行动）
  let rounds = 0;
  while (game.stage === GAME_STAGE.PREFLOP && rounds < 10) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer.isFolded && !currentPlayer.isAllIn) {
      game.playerAction(currentPlayer.id, ACTION.CALL);
    }
    rounds++;
  }
  
  assert(game.stage >= GAME_STAGE.FLOP, `应该进入翻牌阶段，当前阶段：${game.stage}`);
  assert(game.communityCards.length >= 3, `应该有至少 3 张公共牌，当前：${game.communityCards.length}`);
});

// 测试 10: 公共牌显示
test('公共牌显示', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.addPlayer(new Player('bot_1', '机器人 2', 1000, true));
  game.startGame();
  
  // 模拟完整的一轮下注
  let rounds = 0;
  while (game.stage === GAME_STAGE.PREFLOP && rounds < 10) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer.isFolded && !currentPlayer.isAllIn) {
      game.playerAction(currentPlayer.id, ACTION.CALL);
    }
    rounds++;
  }
  
  const state = game.getState('user_001');
  
  assert(state.communityCards.length >= 3, `公共牌应该至少 3 张，当前：${state.communityCards.length}`);
  assert(state.communityCards[0].rank, '公共牌应该有 rank');
  assert(state.communityCards[0].suit, '公共牌应该有 suit');
});

// 测试 11: 手牌显示
test('手牌显示', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  const state = game.getState('user_001');
  const myPlayer = state.players[0];
  
  assert(myPlayer.hand.length === 2, '应该有 2 张手牌');
  assert(myPlayer.hand[0].rank, '手牌应该有 rank');
  assert(myPlayer.hand[0].suit, '手牌应该有 suit');
});

// 测试 12: 玩家下注显示
test('玩家下注显示', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  game.playerAction('user_001', ACTION.RAISE, 50);
  
  const state = game.getState('user_001');
  
  assert(state.players[0].currentBet >= 50, '玩家下注应该显示');
  assert(state.pot >= 70, '底池应该包含下注');
});

// 测试 13: 牌型评估
test('牌型评估', () => {
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
  assert(result.type === HAND_TYPES.ROYAL_FLUSH || result.type === HAND_TYPES.STRAIGHT_FLUSH || result.type === HAND_TYPES.FLUSH, 
    `应该是皇家同花顺/同花顺/同花，实际是${result.typeName}`);
});

// 测试 14: 游戏结束判定
test('游戏结束判定', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  // 快速模拟到游戏结束
  while (game.stage < GAME_STAGE.FINISHED) {
    if (game.stage === GAME_STAGE.PREFLOP) {
      game.playerAction(game.players[game.currentPlayerIndex].id, ACTION.CHECK);
    } else if (game.stage < GAME_STAGE.SHOWDOWN) {
      game.playerAction(game.players[game.currentPlayerIndex].id, ACTION.CHECK);
    }
  }
  
  assert(game.stage === GAME_STAGE.FINISHED, '游戏应该结束');
  assert(game.winner !== null, '应该有获胜者');
});

// 测试 15: getState 数据完整性
test('getState 数据完整性', () => {
  const game = new GameState('test_room', 'user_001', { small: 10, big: 20 });
  
  game.addPlayer(new Player('user_001', '测试玩家', 10000, false));
  game.addPlayer(new Player('bot_0', '机器人', 1000, true));
  game.startGame();
  
  const state = game.getState('user_001');
  
  assert(state.roomId, '应该有 roomId');
  assert(state.stage !== undefined, '应该有 stage');
  assert(state.pot !== undefined, '应该有 pot');
  assert(Array.isArray(state.communityCards), 'communityCards 应该是数组');
  assert(Array.isArray(state.players), 'players 应该是数组');
  assert(state.players[0].currentBet !== undefined, '应该有 currentBet');
  assert(state.players[0].chips !== undefined, '应该有 chips');
});

// 输出测试结果
console.log('\n' + '='.repeat(50));
console.log(`测试结果：${testsPassed} 通过，${testsFailed} 失败`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  console.log('\n❌ 有测试失败，请检查代码！');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过！');
  process.exit(0);
}
