import { IUser } from '../../db/User';
import { AiModel, AiModelsLabels } from '../types/types';

export const MAX_HISTORY_LENGTH = 5;
export const DEFAULT_AI_MODEL = 'GPT_4O_MINI';
export const MAX_USER_MESSAGE_LENGTH = 3000;

export const PROMPT_MESSAGE = `
Ты — вежливый и поддерживающий ИИ-ассистент, созданный для помощи пользователям в решении различных задач. Ты используешь модели GPT-4o-mini, GPT-4o и DALL-E 3.
Отвечай понятно и структурированно, используя простой язык. Старайся быть кратким, но информативным.
Ты можешь:
– перевести любой текст на любой язык
– написать пост, статью, имеил или краткое изложение
– решить задачи и написать учебные работы
– придумать контент-план, историю, сценарий или любой другой креатив
– провести сложные расчёты, анализ и исследования
– расписать меню на неделю под любые специфические запросы
– сгенерировать изображение по текстовому запросу пользователя через модель DALL-E 3
И многое другое.
Всегда обращайся на Вы и помни, что ты учитываешь только последние ${MAX_HISTORY_LENGTH} сообщений в чате для поддержания контекста.
Если пользователь просит тебя форматировать ответ в виде таблицы, скажи, что таблица будет некорректно отображаться в телеграме и сделай форматирование в виде упорядоченного или неупорядоченного списка.
Ни в коем случае не используй знаки форматирования заголовков, такие как *, _ и т.д. Всегда вместо <**Заголовок**> используй <Заголовок>.
`;

export const START_MESSAGE = `
👋 Здравствуйте\\!  
Я \\- Ваш универсальный ИИ\\-ассистент ✔️

🎁 *На Вашем балансе уже есть несколько базовых и PRO запросов, чтобы протестировать мои возможности\\!*
Используйте команду /balance, чтобы взглянуть\\.
  
Помогу:  
📚 решить задачи по любому предмету
✍️ написать статью, имеил или поздравление с днем рождения
💡 придумать историю или любой другой креатив
📝 составить план или предложить несколько решений проблемы
🍽️ расписать меню на неделю под любые специфические запросы
🖼️ сгенерировать изображение
  
И многое другое\\!
  
_P\\.S\\. Доступные модели: GPT\\-4o\\-mini и GPT\\-4o для текстовых ответов и DALL\\-E 3 🆕 для генерации изображений /models\\._

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const START_MESSAGE_V2 =
  `
  👋 Здравствуйте\\!  
Я \\- Ваш универсальный ИИ\\-ассистент ✔️

🎁 *На Вашем балансе уже есть несколько базовых и PRO запросов, чтобы протестировать мои возможности\\!*
Используйте команду /balance, чтобы взглянуть\\.
  
Помогу:
🔄 перевести любой текст на любой язык
✍️ написать пост, статью, имеил или краткое изложение
📚 решить задачи и написать учебные работы
💡 придумать контент\\-план, историю, сценарий или любой другой креатив
📝 провести сложные расчёты, анализ и исследования
🍽️ расписать меню на неделю под любые специфические запросы
🖼️ сгенерировать изображение по текстовому описанию
\\.\\.\\.и многое другое\\!

_P\\.S\\. Доступные модели: GPT\\-4o\\-mini и GPT\\-4o для текстовых ответов и DALL\\-E 3 🆕 для генерации изображений /models\\._

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`

export const HELP_MESSAGE = `
*Команды:*
/balance — проверить баланс запросов
/topup — пополнить баланс
/newchat — начать новый чат, не связанный с предыдущими запросами \\(очистить контекст\\)
/image — сгенерировать изображение по Вашему запросу  
/models — выбрать модель ИИ\\-чата 

*Запросы:*
Любое __текстовое сообщение__, отправленное в ИИ\\-чат, считается запросом\\.
Каждый запрос потребляет один запрос из Вашего баланса\\. Запрсы делятся на базовые и PRO в зависимости от модели\\.

*Доступные модели:*  
*GPT\\-4o mini* \\(базовая\\) — быстрая и легковесная версия модели 4o, подходит для решения задач средней сложности
*GPT\\-4o* \\(PRO\\) — высокоинтеллектуальная флагманская модель для сложных многоэтапных задач
*DALL\\-E 3* — генерация изображений
  `;

export const SUPPORT_MESSAGE_POSTFIX =
  'Пожалуйста, попробуйте позже или обратитесь в поддержку /support';

export const getNoBalanceMessage = (model: AiModel) => {
  return `У вас нет доступных запросов для обращения к ${AiModelsLabels[model]}`;
};

export const getBalanceMessage = (user: IUser) => {
  return `
*Ваш текущий баланс 💰 *

⭐️ Базовые запросы: ${user.basicRequestsBalance}
🌟 PRO запросы: ${user.proRequestsBalance}
🖼️ Генерация изображений: ${user.imageGenerationBalance}

_\\*Про виды запросов: /help_
  `;
};
