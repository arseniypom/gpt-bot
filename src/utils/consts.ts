import dayjs from 'dayjs';
import { IUser } from '../../db/User';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { AiModel, AiModelsLabels } from '../types/types';
import { TOKEN_PACKAGES } from '../bot-token-packages';

export const BASIC_REQUEST_COST = 1.5;
export const PRO_REQUEST_COST = 3;
export const IMAGE_GENERATION_COST = 10;

export const MAX_BOT_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_LENGTH = 5;
export const DEFAULT_AI_MODEL = 'GPT_4O_MINI';
export const MAX_USER_MESSAGE_LENGTH = 3000;

export const COMMANDS = [
  {
    command: 'balance',
    description: '🏦 Текущий баланс запросов',
  },
  {
    command: 'topup',
    description: '🪙 Пополнить баланс токенов',
  },
  {
    command: 'newchat',
    description: '🗑️ Очистка контекста (новый чат)',
  },
  {
    command: 'models',
    description: '⚙️ Настройки',
  },
  {
    command: 'image',
    description: '🖼️ Сгенерировать изображение',
  },
  {
    command: 'help',
    description: 'ℹ️ Общая информация',
  },
  {
    command: 'support',
    description: '🆘 Обратиться в поддержку',
  },
];

export const BUTTON_LABELS = {
  profile: '👤 Мой профиль',
  settings: '⚙️ Настройки',
  subscribe: '🎉 Подключить подписку',
  buyTokens: '🪙 Купить токены',
  image: '🖼️ Сгенерировать изображение',
  help: 'ℹ️ Информация',
  support: '🆘 Поддержка',
};

export const PROMPT_MESSAGE = `
Ты — вежливый и поддерживающий ИИ-ассистент, созданный для помощи пользователям в решении различных задач. Ты используешь модели GPT-4o-mini, GPT-4o и DALL-E 3.
Отвечай понятно и структурированно, используя простой язык. Старайся быть кратким, но информативным.
Ты можешь:
– перевести текст на любой язык
– написать пост, статью, имеил или краткое изложение
– решить задачи и написать учебные работы
– придумать контент-план, историю, сценарий или любой другой креатив
– провести сложные расчёты, анализ и исследования
– расписать меню на неделю под любые специфические запросы
– сгенерировать изображение по текстовому запросу пользователя через модель DALL-E 3
И многое другое.
Всегда обращайся на Вы и помни, что ты учитываешь только последние ${MAX_HISTORY_LENGTH} сообщений в чате для поддержания контекста.
Если пользователь просит тебя форматировать ответ в виде таблицы, скажи, что таблица будет некорректно отображаться в телеграме и сделай форматирование в виде упорядоченного или неупорядоченного списка.
Ни в коем случае не используй знаки форматирования заголовков, такие как *, _, <, > и т.д. Всегда вместо **Заголовок** или <Заголовок> используй Заголовок. Также не используй escape-последовательности в тексте, такие как \\* и \\<\\>, то есть вместо \(x\) пиши (x).
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

export const START_MESSAGE_V2 = `
  👋 Здравствуйте\\!  
Я \\- Ваш универсальный ИИ\\-ассистент ✔️

🎁 *На Вашем балансе уже есть несколько базовых и PRO запросов, чтобы протестировать мои возможности\\!*
Используйте команду /balance, чтобы взглянуть\\.
  
Помогу:
🔄 перевести текст на любой язык
✍️ написать пост, статью, имеил или краткое изложение
📚 решить задачи и написать учебные работы
💡 придумать контент\\-план, историю, сценарий или любой другой креатив
📝 провести сложные расчёты, анализ и исследования
🍽️ расписать меню на неделю под любые специфические запросы
🖼️ сгенерировать изображение по текстовому описанию
\\.\\.\\.и многое другое\\!

_P\\.S\\. Доступные модели: GPT\\-4o\\-mini и GPT\\-4o для текстовых ответов и DALL\\-E 3 🆕 для генерации изображений /models\\._

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const HELP_MESSAGE = `
*❓ Как пользоваться ботом?*
Чтобы начать общение с ботом, просто отправьте любое текстовое сообщение\\. Для генерации изображений используйте кнопку "🖼️ Сгенерировать изображение" или команду /image\\.

*💬 Запросы:*
Любое текстовое сообщение, отправленное в чат, считается запросом\\. Нажатия кнопок и команды запросами __не считаются__\\.
Каждый запрос потребляет либо 1 запрос, либо 1\\.5\\-10 токенов из Вашего баланса\\. Запросы делятся на базовые и PRO в зависимости от модели\\.

*🤖 Доступные модели:*  
→ GPT\\-4o mini \\(базовая\\) — быстрая и легковесная версия модели 4o, подходит для решения задач средней сложности
→ GPT\\-4o \\(PRO\\) — высокоинтеллектуальная флагманская модель для сложных многоэтапных задач
→ DALL\\-E 3 — генерация изображений
Сменить модель: /models

*🪙 Токены*
Токены — это внутренняя валюта, которую можно тратить на доп\\. запросы вне подписки\\.
1 __базовый__ запрос \\= 1\\.5 токена
1 __PRO__ запрос \\= 3 токена
1 __генерация изображения__ \\= 10 токенов
Купить токены: /topup
  `;

export const TOPUP_MESSAGE = `
*🪙 Выберите количество токенов\nдля пополнения*

→ ${TOKEN_PACKAGES.token1.description}
→ ${TOKEN_PACKAGES.token2.description} _Популярный ✨_
→ ${TOKEN_PACKAGES.token3.description}

Что такое токены и на что их можно тратить: /help
`;

export const SUPPORT_MESSAGE_POSTFIX =
  'Пожалуйста, попробуйте позже или обратитесь в поддержку /support';

export const YOOKASSA_PAYMENT_MESSAGE =
  '*💳 Для оплаты нажмите кнопку "Оплатить" ниже*\n\n_🔐 Вы будете перенаправлены на страницу платежной системы Юкасса\n__Платеж будет безопасно проведен на стороне Юкасса, бот не имеет доступа к данным Вашей карты и нигде их не сохраняет___';

export const SUBSCRIPTIONS_MESSAGE = `
*Описание уровней подписки*

*${SUBSCRIPTIONS.FREE.icon} ${SUBSCRIPTIONS.FREE.title}*
– Базовые запросы (GPT-4o mini) — ${SUBSCRIPTIONS.FREE.basicRequestsPerWeek} в неделю

*${SUBSCRIPTIONS.START.icon} ${SUBSCRIPTIONS.START.title}*
– Базовые запросы (GPT-4o mini) — ${SUBSCRIPTIONS.START.basicRequestsPerDay} в день
– Генерация изображений (DALL-E 3) — ${SUBSCRIPTIONS.START.imageGenerationPerMonth} в месяц

*${SUBSCRIPTIONS.OPTIMUM.icon} ${SUBSCRIPTIONS.OPTIMUM.title}*
– Базовые запросы (GPT-4o mini) — ${SUBSCRIPTIONS.OPTIMUM.basicRequestsPerDay} в день
– PRO запросы (GPT-4o) — ${SUBSCRIPTIONS.OPTIMUM.proRequestsPerMonth} в месяц
– Генерация изображений (DALL-E 3) — ${SUBSCRIPTIONS.OPTIMUM.imageGenerationPerMonth} в месяц

*${SUBSCRIPTIONS.PREMIUM.icon} ${SUBSCRIPTIONS.PREMIUM.title}*
– Базовые запросы (GPT-4o mini) — ${SUBSCRIPTIONS.PREMIUM.basicRequestsPerDay} в день
– PRO запросы (GPT-4o) — ${SUBSCRIPTIONS.PREMIUM.proRequestsPerMonth} в месяц
– Генерация изображений (DALL-E 3) — ${SUBSCRIPTIONS.PREMIUM.imageGenerationPerMonth} в месяц

*${SUBSCRIPTIONS.ULTRA.icon} ${SUBSCRIPTIONS.ULTRA.title}*
– Базовые запросы (GPT-4o mini) — ${SUBSCRIPTIONS.ULTRA.basicRequestsPerDay} в день
– PRO запросы (GPT-4o) — ${SUBSCRIPTIONS.ULTRA.proRequestsPerMonth} в месяц
– Генерация изображений (DALL-E 3) — ${SUBSCRIPTIONS.ULTRA.imageGenerationPerMonth} в месяц

Нажмите на кнопку ниже, чтобы выбрать уровень 👇
`;

export const getNoBalanceMessage = (model: AiModel) => {
  return `У вас нет доступных запросов для обращения к ${AiModelsLabels[model]}`;
};

export const getBalanceMessage = (user: IUser) => {
  return `
*Текущий баланс токенов*
🪙 ${user.tokensBalance.toString().replace(/\./g, '\\.')}

_\\*Подробнее о токенах\nи видах запросов: /help_
  `;
};

export const getProfileMessage = (user: IUser) => {
  const expirationDate = dayjs(user.subscriptionExpiry)
    .format('DD.MM.YYYY')
    .replace(/\./g, '\\.');
  const weeklyRequestsExpirationDate = dayjs(user.weeklyRequestsExpiry)
    .format('DD.MM.YYYY')
    .replace(/\./g, '\\.');
  const isNewSubscriptionLevelShown =
    user.newSubscriptionLevel &&
    user.newSubscriptionLevel !== user.subscriptionLevel;
  const newSubscriptionLevelTitle =
    user.newSubscriptionLevel && SUBSCRIPTIONS[user.newSubscriptionLevel].title;

  const freeRequestsMessage =
    user.subscriptionLevel === 'FREE'
      ? `\n\nОстаток бесплатных запросов на неделю: ${user.basicRequestsLeftThisWeek}/${SUBSCRIPTIONS.FREE.basicRequestsPerWeek}\n_Обновятся ${weeklyRequestsExpirationDate}_`
      : '';

  return `
*Ваш уровень подписки: ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
    SUBSCRIPTIONS[user.subscriptionLevel].title
  }*${user.subscriptionExpiry ? `\n_Действует до ${expirationDate}_` : ''}${
    isNewSubscriptionLevelShown
      ? `\n_После будет переключен на ${newSubscriptionLevelTitle}_`
      : ''
  }${freeRequestsMessage}

*Остаток запросов по подписке на сегодня*
⭐️ Базовые: ${user.basicRequestsLeftToday}
🌟 PRO: ${user.proRequestsLeftThisMonth}
🖼️ Генерация изображений: ${user.imageGenerationLeftThisMonth}

*Доступные токены*
🪙 ${user.tokensBalance.toString().replace(/\./g, '\\.')}

_\\*Подробнее о токенах\nи видах запросов: /help_
  `;
};

export const getManageSubscriptionMessage = (user: IUser) => {
  const expirationDate = dayjs(user.subscriptionExpiry)
    .format('DD.MM.YYYY')
    .replace(/\./g, '\\.');
  const price = SUBSCRIPTIONS[user.subscriptionLevel].price;
  const displayPrice = price ? `${price}₽` : 'Бесплатно';

  return `
*Ваш уровень подписки*: ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
    SUBSCRIPTIONS[user.subscriptionLevel].title
  }
*Описание*: ${SUBSCRIPTIONS[user.subscriptionLevel].description}
*Стоимость*: ${displayPrice}
${
  user.subscriptionExpiry
    ? `*Действует до*: ${expirationDate}\n\n_После окончания действия подписка будет автоматически продлена_`
    : ''
}
  `;
};

export const UNSUBSCRIBE_REASONS = {
  tokens: 'Я использую токены, подписка не нужна',
  somethingNotWorking: 'Что-то не работает',
  notUsingBot: 'Я не пользуюсь ботом',
  subscriptionTooExpensive: 'Подписка слишком дорогая',
  enoughFreeTariff: 'Мне хватает бесплатного тарифа',
  otherReason: 'Другое',
};
