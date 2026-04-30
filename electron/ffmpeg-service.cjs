'use strict';

/**
 * ffmpeg-service.cjs
 *
 * Provides local video rendering capabilities using FFmpeg.
 * This runs in the Electron main process and exposes IPC handlers
 * for trimming, re-encoding, and concatenating video clips.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Point fluent-ffmpeg to the bundled binary
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Register all FFmpeg IPC handlers.
 * Call this once from main.cjs during app.whenReady().
 */
function registerFFmpegHandlers(mainWindow) {

  // ─── Trim a video clip ──────────────────────────────────────────────────
  ipcMain.handle('ffmpeg:trim', async (_, { inputPath, outputPath, startTime, duration }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .outputOptions(['-c', 'copy']) // fast copy without re-encoding
        .on('start', (cmd) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'trim', status: 'started', cmd });
        })
        .on('progress', (progress) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'trim', percent: progress.percent || 0 });
        })
        .on('end', () => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'trim', status: 'done' });
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          reject({ success: false, error: err.message });
        })
        .run();
    });
  });

  // ─── Re-encode a video (change format, resolution, bitrate) ─────────────
  ipcMain.handle('ffmpeg:reencode', async (_, { inputPath, outputPath, options }) => {
    const { width, height, videoBitrate, audioBitrate, format } = options || {};
    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputPath);

      if (width && height) cmd = cmd.size(`${width}x${height}`);
      if (videoBitrate) cmd = cmd.videoBitrate(videoBitrate);
      if (audioBitrate) cmd = cmd.audioBitrate(audioBitrate);
      if (format) cmd = cmd.format(format);

      cmd
        .output(outputPath)
        .on('start', (cmdStr) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'reencode', status: 'started', cmd: cmdStr });
        })
        .on('progress', (progress) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'reencode', percent: progress.percent || 0 });
        })
        .on('end', () => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'reencode', status: 'done' });
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          reject({ success: false, error: err.message });
        })
        .run();
    });
  });

  // ─── Concatenate multiple clips into one ────────────────────────────────
  ipcMain.handle('ffmpeg:concat', async (_, { inputPaths, outputPath }) => {
    return new Promise((resolve, reject) => {
      // Create a temporary file list for FFmpeg concat demuxer
      const listPath = outputPath + '.txt';
      const listContent = inputPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
      fs.writeFileSync(listPath, listContent);

      ffmpeg()
        .input(listPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('start', (cmd) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'concat', status: 'started', cmd });
        })
        .on('progress', (progress) => {
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'concat', percent: progress.percent || 0 });
        })
        .on('end', () => {
          fs.unlinkSync(listPath); // cleanup temp file
          mainWindow?.webContents.send('ffmpeg:progress', { stage: 'concat', status: 'done' });
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          try { fs.unlinkSync(listPath); } catch {}
          reject({ success: false, error: err.message });
        })
        .run();
    });
  });

  // ─── Generate thumbnail from video at a given timestamp ─────────────────
  ipcMain.handle('ffmpeg:thumbnail', async (_, { inputPath, outputPath, timestamp }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp || '00:00:01'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x180',
        })
        .on('end', () => {
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          reject({ success: false, error: err.message });
        });
    });
  });

  // ─── Get video metadata (duration, resolution, codec) ───────────────────
  ipcMain.handle('ffmpeg:probe', async (_, { inputPath }) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject({ success: false, error: err.message });
        const video = metadata.streams.find(s => s.codec_type === 'video');
        const audio = metadata.streams.find(s => s.codec_type === 'audio');
        resolve({
          success: true,
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          video: video ? { codec: video.codec_name, width: video.width, height: video.height, fps: eval(video.r_frame_rate) } : null,
          audio: audio ? { codec: audio.codec_name, sampleRate: audio.sample_rate, channels: audio.channels } : null,
        });
      });
    });
  });
}

module.exports = { registerFFmpegHandlers };
