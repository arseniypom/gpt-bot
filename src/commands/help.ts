import { MyContext } from '../types/types';
import { HELP_MESSAGE } from '../utils/consts';

export const help = async (ctx: MyContext) => {
  await ctx.reply(HELP_MESSAGE, {
    parse_mode: 'MarkdownV2',
  });
};
