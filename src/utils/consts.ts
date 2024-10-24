import { IUser } from '../../db/User';
import { AiModel, AiModelsLabels } from '../types/types';

export const MAX_HISTORY_LENGTH = 5;
export const DEFAULT_AI_MODEL = 'GPT_3_5_TURBO';

export const PROMPT_MESSAGE = `
Ты — вежливый и поддерживающий ИИ-ассистент, созданный для помощи пользователям в решении различных задач.
Отвечай понятно и структурированно, используя простой язык. Старайся быть кратким, но информативным.
Ты можешь:
- Решать задачи по различным предметам
- Помогать в написании статей, писем, сообщений и поздравлений
- Придумывать истории и креативные идеи
- Составлять планы и предлагать решения проблем
- Расписывать меню на неделю по указанным запросам
- Генерировать изображения по запросу пользователя через модель DALL-E 3
И многое другое.
Всегда обращайся на Вы и помни, что ты учитываешь только последние ${MAX_HISTORY_LENGTH} сообщений в чате для поддержания контекста.
`;

export const START_MESSAGE = `
*Здравствуйте\\! 👋  
Я \\- Ваш универсальный ИИ\\-ассистент 🤓*
  
Помогу:  
📚 решить задачи по любому предмету
✍️ написать статью, имеил или поздравление с днем рождения
💡 придумать историю или любой другой креатив
📝 составить план или предложить несколько решений проблемы
🍽️ расписать меню на неделю под любые специфические запросы
🖼️ сгенерировать изображение
  
И многое другое\\! 💼

*Кстати, у меня есть для Вас подарок\\! 🎁*
И он уже у Вас на счету 💰
Используйте команду /balance, чтобы взглянуть\\.
  
_P\\.S\\. Я работаю на базе OpenAI API 🔗, использую модели GPT\\-4o\\-mini, GPT\\-4o, GPT\\-3\\.5 Turbo для текстовых ответов и DALL\\-E 3 для генерации изображений\\._
`;

export const HELP_MESSAGE = `
/balance — проверить баланс запросов
/topup — пополнить баланс
/newchat — начать новый чат, не связанный с предыдущими запросами  
/image — сгенерировать изображение по Вашему запросу  
/models — выбрать модель ИИ\\-чата 
  
В настоящий момент доступны:  
*GPT\\-3\\.5 Turbo* — быстрая базовая модель для решения повседневных задач  
*GPT\\-4o mini* — быстрая и легковесная версия модели 4o, подходит для решения задач средней сложности  
*GPT\\-4o* — высокоинтеллектуальная флагманская модель для сложных многоэтапных задач

Для генерации изображений используется модель *DALL\\-E 3*
  
*Важная информация*:  
В текущей версии при ответе на любой вопрос бот использует 5 последних сообщений: три от пользователя \\+ запрос и три свои\\. Доступа к более старым сообщениям у него нет, то есть он не может учитывать контекст, данный пользователем 4 и более сообщений назад\\.
  `;

export const getNoBalanceMessage = (model: AiModel) => {
  return `У вас нет доступных запросов для обращения к ${AiModelsLabels[model]}. Используйте команду /topup для пополнения баланса.`;
};

export const getBalanceMessage = (user: IUser) => {
  return `
*Ваш текущий баланс 💰 *
––––––
*Базовые запросы* \\(GPT\\-3\\.5, GPT\\-4o\\-mini\\):
⭐️ ${user.basicRequestsBalance}
*ПРО запросы* \\(GPT\\-4o\\):
🌟 ${user.proRequestsBalance}
*Генерация изображений*:
🖼️ ${user.imageGenerationBalance}
  `;
};
