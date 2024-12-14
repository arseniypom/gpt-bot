import 'dotenv/config';
import axios from 'axios';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);
import fs from 'fs';
import path from 'path';
import { Document, Types } from 'mongoose';
import {
  User as TelegramUser,
  Message as TelegramMessage,
} from '@grammyjs/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { MyContext } from '../types/types';
import { transcribeVoice } from '../utils/gpt';
import { getBotApiKey, logError } from '../utils/utilFunctions';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { handleTextMessage } from './textMessageHandler';
import { IUser } from '../../db/User';

export const handleVoiceMessage = async ({
  user,
  ctx,
  responseMessage,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    };
  ctx: MyContext;
  responseMessage: TelegramMessage.CommonMessage & MessageXFragment;
}) => {
  const voice = ctx.msg!.voice;
  const duration = voice?.duration;
  const telegramId = (ctx.from as TelegramUser).id;

  if (process.env.ADMIN_TELEGRAM_ID) {
    ctx.forwardMessage(process.env.ADMIN_TELEGRAM_ID);
  }

  if (duration && duration > 120) {
    await ctx.reply(
      '🔊 Голосовое сообщение не может быть длиннее 120 секунд (2 минуты)',
    );
    return;
  }
  const fileSize = voice?.file_size;

  if (fileSize && fileSize > 20 * 1024 * 1024) {
    // More than 20 MB
    await ctx.reply(
      '🔊 Голосовое сообщение слишком большое, попробуйте еще раз',
    );
    return;
  }

  const file = await ctx.getFile();
  const filePath = file.file_path;
  if (!filePath) {
    await ctx.reply('🔊 Произошла ошибка при получении голосового сообщения');
    return;
  }

  const token = getBotApiKey();
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const voicesDir = path.join(__dirname, '../../voices');
  if (!fs.existsSync(voicesDir)) {
    fs.mkdirSync(voicesDir, { recursive: true });
  }
  const localFilePath = path.join(
    voicesDir,
    `${telegramId}_${voice?.file_id}.oga`,
  );
  const convertedFilePath = path.join(
    voicesDir,
    `${telegramId}_${voice?.file_id}.mp3`,
  );

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(localFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await new Promise((resolve, reject) => {
      ffmpeg(localFilePath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(convertedFilePath);
    });

    const transcription = await transcribeVoice(convertedFilePath);
    await handleTextMessage({
      user,
      ctx,
      responseMessage,
      messageText: transcription,
      voiceFileId: voice?.file_id,
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при обработке голосового сообщения. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in voiceMessageHandler',
      error,
    });
  } finally {
    if (fs.existsSync(convertedFilePath)) {
      fs.unlink(convertedFilePath, (err) => {
        if (err) console.error('Error deleting converted file:', err);
      });
    }
    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) console.error('Error deleting local file:', err);
      });
    }
  }
};
