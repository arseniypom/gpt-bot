import { MyContext } from '../types/types';

export const support = async (ctx: MyContext) => {
  await ctx.conversation.enter('supportConversation');
  return;
};
