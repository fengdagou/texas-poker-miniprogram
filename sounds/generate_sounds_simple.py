#!/usr/bin/env python3
"""
简易音效生成器 - 无需外部依赖
使用标准库生成简单的 WAV 音效
"""

import wave
import struct
import math
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_wave(frequency, duration, sample_rate=44100, volume=0.5):
    """生成正弦波"""
    samples = int(sample_rate * duration)
    wave_data = []
    
    for i in range(samples):
        value = volume * math.sin(2 * math.pi * frequency * i / sample_rate)
        # 淡入淡出
        if i < samples * 0.05:  # 淡入
            value *= i / (samples * 0.05)
        if i > samples * 0.8:  # 淡出
            value *= (samples - i) / (samples * 0.2)
        wave_data.append(value)
    
    return wave_data

def generate_noise(duration, sample_rate=44100, volume=0.3):
    """生成白噪声"""
    import random
    samples = int(sample_rate * duration)
    return [volume * random.uniform(-1, 1) for _ in range(samples)]

def save_wav(data, filename, sample_rate=44100):
    """保存为 WAV 文件"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # 转换为 16 位整数
    wave_data = [int(x * 32767) for x in data]
    
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)  # 单声道
        wav_file.setsampwidth(2)  # 16 位
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(struct.pack(f'{len(wave_data)}h', *wave_data))
    
    print(f"✅ 生成：{filename}")

def main():
    print("🎵 开始生成音效文件（简易版）...\n")
    
    # 发牌音效 - 短促高频
    deal = generate_wave(800, 0.1) + generate_wave(1200, 0.05)
    save_wav(deal, 'deal.wav')
    
    # 筹码音效 - 噪声 + 高频
    chip = generate_noise(0.15, volume=0.4) + generate_wave(2000, 0.1, volume=0.2)
    save_wav(chip, 'chip.wav')
    
    # 下注音效（使用筹码音效）
    import shutil
    shutil.copy(os.path.join(OUTPUT_DIR, 'chip.wav'), os.path.join(OUTPUT_DIR, 'bet.wav'))
    print("✅ 生成：bet.wav (复制 chip.wav)")
    
    # 胜利音效 - 上行音阶
    win = []
    for i, freq in enumerate([523, 659, 784, 1047]):
        win.extend(generate_wave(freq, 0.15, volume=0.4))
    save_wav(win, 'win.wav')
    
    # 失败音效 - 下行音阶
    lose = []
    for i, freq in enumerate([392, 349, 311, 261]):
        lose.extend(generate_wave(freq, 0.2, volume=0.3))
    save_wav(lose, 'lose.wav')
    
    # 弃牌音效 - 滑动音
    fold = generate_wave(600, 0.2)
    fold.extend(generate_wave(400, 0.15))
    save_wav(fold, 'fold.wav')
    
    print("\n✅ 音效生成完成！")
    print(f"📁 保存位置：{OUTPUT_DIR}")
    print("\n📋 生成的文件:")
    for f in ['deal.wav', 'chip.wav', 'bet.wav', 'win.wav', 'lose.wav', 'fold.wav']:
        filepath = os.path.join(OUTPUT_DIR, f)
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"  ✓ {f} ({size} bytes)")
    
    print("\n⚠️ 背景音乐文件较大，建议手动下载")
    print("   参考：sounds/DOWNLOAD_GUIDE.md")

if __name__ == '__main__':
    main()
