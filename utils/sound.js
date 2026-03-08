/**
 * 音效管理器
 */

// 音效配置
const SOUND_CONFIG = {
  bgm: {
    url: '/sounds/bgm.mp3',
    loop: true,
    volume: 0.3
  },
  deal: {
    url: '/sounds/deal.mp3',
    volume: 0.5
  },
  bet: {
    url: '/sounds/bet.mp3',
    volume: 0.5
  },
  win: {
    url: '/sounds/win.mp3',
    volume: 0.6
  },
  lose: {
    url: '/sounds/lose.mp3',
    volume: 0.5
  },
  chip: {
    url: '/sounds/chip.mp3',
    volume: 0.4
  },
  fold: {
    url: '/sounds/fold.mp3',
    volume: 0.4
  }
}

class SoundManager {
  constructor() {
    this.bgm = null
    this.sounds = {}
    this.muted = false
    this.bgmEnabled = false
    this.init()
  }

  init() {
    try {
      // 创建背景音乐
      this.bgm = wx.createInnerAudioContext()
      this.bgm.src = SOUND_CONFIG.bgm.url
      this.bgm.loop = SOUND_CONFIG.bgm.loop
      this.bgm.volume = SOUND_CONFIG.bgm.volume
      this.bgm.autoplay = false

      // 创建音效
      for (let key in SOUND_CONFIG) {
        if (key !== 'bgm') {
          this.sounds[key] = wx.createInnerAudioContext()
          this.sounds[key].src = SOUND_CONFIG[key].url
          this.sounds[key].volume = SOUND_CONFIG[key].volume
        }
      }

      // 错误处理
      this.bgm.onError((res) => {
        // 静音模式，不显示错误
      })

      for (let key in this.sounds) {
        this.sounds[key].onError((res) => {
          // 音效文件不存在时自动静音
          console.log(`音效${key}未加载，已自动静音`)
        })
      }
    } catch (e) {
      console.log('音效系统初始化失败，已禁用:', e)
      this.muted = true
    }
  }

  // 播放背景音乐
  playBGM() {
    if (this.muted || this.bgmEnabled) return
    this.bgmEnabled = true
    this.bgm.play()
  }

  // 停止背景音乐
  stopBGM() {
    this.bgmEnabled = false
    this.bgm.stop()
  }

  // 播放音效
  play(soundKey) {
    if (this.muted) return
    const sound = this.sounds[soundKey]
    if (sound) {
      sound.stop()
      sound.currentTime = 0
      sound.play()
    }
  }

  // 静音
  setMute(muted) {
    this.muted = muted
    if (muted) {
      this.stopBGM()
    } else if (this.bgmEnabled) {
      this.playBGM()
    }
  }

  // 切换静音
  toggleMute() {
    this.setMute(!this.muted)
    return this.muted
  }

  // 销毁
  destroy() {
    this.stopBGM()
    this.bgm.destroy()
    for (let key in this.sounds) {
      this.sounds[key].destroy()
    }
  }
}

// 单例
const soundManager = new SoundManager()

module.exports = soundManager
