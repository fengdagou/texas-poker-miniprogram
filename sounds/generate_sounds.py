#!/usr/bin/env python3
"""
音效生成脚本
使用 Python 生成简单的游戏音效
需要安装：pip install numpy scipy
"""

import numpy as np
from scipy.io.wavfile import write
import os

# 输出目录
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_tone(frequency, duration, sample_rate=44100, volume=0.5):
    """生成简单的音调"""
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    wave = volume * np.sin(2 * np.pi * frequency * t)
    
    # 添加淡入淡出
    fade_in = np.linspace(0, 1, int(sample_rate * 0.01))
    fade_out = np.linspace(1, 0, int(sample_rate * 0.05))
    
    wave[:len(fade_in)] *= fade_in
    wave[-len(fade_out):] *= fade_out
    
    return (wave * 32767).astype(np.int16)

def generate_noise(duration, sample_rate=44100, volume=0.3):
    """生成白噪声（用于筹码声）"""
    samples = int(sample_rate * duration)
    noise = volume * np.random.uniform(-1, 1, samples)
    
    # 添加淡出
    fade_out = np.linspace(1, 0, int(sample_rate * 0.1))
    noise[-len(fade_out):] *= fade_out
    
    return (noise * 32767).astype(np.int16)

def generate_deal_sound():
    """发牌音效 - 短促的纸牌声"""
    # 高频短音
    wave1 = generate_tone(800, 0.1, volume=0.3)
    wave2 = generate_tone(1200, 0.05, volume=0.2)
    
    # 混合
    length = max(len(wave1), len(wave2))
    mixed = np.zeros(length, dtype=np.int16)
    mixed[:len(wave1)] += wave1
    mixed[:len(wave2)] += wave2
    
    return mixed

def generate_chip_sound():
    """筹码碰撞声 - 金属质感"""
    # 高频噪声 + 音调
    noise = generate_noise(0.2, volume=0.4)
    tone = generate_tone(2000, 0.15, volume=0.2)
    
    # 混合
    length = max(len(noise), len(tone))
    mixed = np.zeros(length, dtype=np.int16)
    mixed[:len(noise)] += noise
    mixed[:len(tone)] += tone
    
    return mixed

def generate_win_sound():
    """胜利音效 - 欢快的上行音阶"""
    sample_rate = 44100
    notes = [523, 659, 784, 1047]  # C5, E5, G5, C6
    duration = 0.2
    
    waves = []
    for i, freq in enumerate(notes):
        wave = generate_tone(freq, duration, volume=0.4)
        # 添加延迟
        delay = int(sample_rate * i * 0.1)
        padded = np.zeros(delay + len(wave), dtype=np.int16)
        padded[delay:] = wave
        waves.append(padded)
    
    # 混合所有音符
    max_len = max(len(w) for w in waves)
    mixed = np.zeros(max_len, dtype=np.int16)
    for wave in waves:
        mixed[:len(wave)] += wave
    
    return mixed

def generate_lose_sound():
    """失败音效 - 低沉的下行音阶"""
    sample_rate = 44100
    notes = [392, 349, 311, 261]  # G4, F4, Eb4, C4
    duration = 0.3
    
    waves = []
    for i, freq in enumerate(notes):
        wave = generate_tone(freq, duration, volume=0.3)
        delay = int(sample_rate * i * 0.15)
        padded = np.zeros(delay + len(wave), dtype=np.int16)
        padded[delay:] = wave
        waves.append(padded)
    
    max_len = max(len(w) for w in waves)
    mixed = np.zeros(max_len, dtype=np.int16)
    for wave in waves:
        mixed[:len(wave)] += wave
    
    return mixed

def generate_fold_sound():
    """弃牌音效 - 轻柔的滑动声"""
    # 低频滑动音
    sample_rate = 44100
    duration = 0.3
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    
    # 频率从高到低
    frequency = 600 * np.exp(-t * 5)
    wave = 0.3 * np.sin(2 * np.pi * frequency * t)
    
    # 淡出
    fade_out = np.linspace(1, 0, int(sample_rate * 0.2))
    wave[-len(fade_out):] *= fade_out
    
    return (wave * 32767).astype(np.int16)

def save_sound(wave, filename, sample_rate=44100):
    """保存音效文件"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    write(filepath, sample_rate, wave)
    print(f"✅ 生成：{filename}")

def main():
    print("🎵 开始生成音效文件...\n")
    
    try:
        # 生成音效
        sounds = {
            'deal.wav': generate_deal_sound(),
            'chip.wav': generate_chip_sound(),
            'win.wav': generate_win_sound(),
            'lose.wav': generate_lose_sound(),
            'fold.wav': generate_fold_sound(),
        }
        
        # 保存文件
        for filename, wave in sounds.items():
            save_sound(wave, filename)
        
        print("\n✅ 音效生成完成！")
        print(f"📁 保存位置：{OUTPUT_DIR}")
        print("\n⚠️ 注意：")
        print("  - 背景音乐需要更复杂的生成，建议手动下载")
        print("  - bet.mp3 可以使用 chip.wav 代替")
        print("  - 文件格式为 WAV，小程序也支持")
        
    except Exception as e:
        print(f"\n❌ 生成失败：{e}")
        print("\n请安装依赖：pip install numpy scipy")
        print("或使用手动下载的音效文件")

if __name__ == '__main__':
    main()
