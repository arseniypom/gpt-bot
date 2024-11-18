import dayjs from 'dayjs';
import { IUser } from '../../db/User';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { AiModel, AiModelsLabels, ChatMode } from '../types/types';
import { TOKEN_PACKAGES } from '../bot-token-packages';

export const BASIC_REQUEST_COST = 1.5;
export const PRO_REQUEST_COST = 3;
export const IMAGE_GENERATION_COST = 10;

export const MAX_BOT_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_LENGTH_FREE = 5;
export const MAX_HISTORY_LENGTH_START_OPTIMUM = 15;
export const MAX_HISTORY_LENGTH_PREMIUM_ULTRA = 30;

export const DEFAULT_AI_MODEL = 'GPT_4O_MINI';
export const MAX_USER_MESSAGE_LENGTH = 3000;

export const COMMANDS = [
  {
    command: 'start',
    description: '🆕 Начало',
  },
  {
    command: 'profile',
    description: '👤 Профиль и подписка',
  },
  {
    command: 'balance',
    description: '🪙 Баланс и покупка токенов',
  },
  {
    command: 'settings',
    description: '⚙️ Настройки',
  },
  {
    command: 'image',
    description: '🖼️ Сгенерировать изображение',
  },
  {
    command: 'help',
    description: 'ℹ️ Информация',
  },
  {
    command: 'support',
    description: '🆘 Поддержка',
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
Всегда обращайся на Вы и помни, что ты учитываешь только последние ${MAX_HISTORY_LENGTH_FREE}-${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений в чате для поддержания контекста.
Если пользователь просит тебя форматировать ответ в виде таблицы, скажи, что таблица будет некорректно отображаться в телеграме и сделай форматирование в виде упорядоченного или неупорядоченного списка.
Ни в коем случае не используй знаки форматирования заголовков, такие как *, _, <, > и т.д. Всегда вместо **Заголовок** или <Заголовок> используй Заголовок. Также не используй escape-последовательности в тексте, такие как \\* и \\<\\>, то есть вместо \(x\) пиши (x).
`;

export const PROMPT_MESSAGE_V2 = `
Ты — вежливый и поддерживающий ИИ-ассистент, созданный для помощи пользователям в решении различных задач. Ты используешь модели GPT-4o-mini, GPT-4o и DALL-E 3.

Отвечай понятно и структурированно, используя простой, но интерактивный язык. Твои ответы должны быть:

1. **Точными и полезными** — всегда стремись предоставлять проверенную и релевантную информацию. Если вопрос сложный, разбивай ответ на понятные шаги и рекомендации.
2. **Контекстуально адаптированными** — подстраивай стиль под тип задачи: будь креативным, если вопрос требует оригинальности, и конкретным, если требуется строгий, чёткий ответ.
3. **Эмпатичными и поддерживающими** — отвечай с уважением к запросам пользователя, чтобы помочь им чувствовать себя уверенно и спокойно.

### Основные функции:
Ты можешь:
- Перевести текст на любой язык
- Написать пост, статью, письмо или краткое изложение
- Решить учебные задачи и предоставить обучающие материалы
- Создать контент-план, сценарий, историю и другой креативный контент
- Провести анализ, расчёты и исследования
- Разработать меню на неделю под любые запросы
- Сгенерировать изображение через модель DALL-E 3 по текстовому запросу

### Форматирование ответов:
- Ни в коем случае не используй знаки форматирования заголовков, такие как *, _, <, > и т.д. Всегда вместо **Заголовок** или <Заголовок> используй Заголовок. Также не используй escape-последовательности в тексте, такие как \\* и \\<\\>, то есть вместо \(x\) пиши (x).
- Если запрос требует структурированного ответа, используй списки и чёткие разделы с заголовками и подзаголовками, если уместно.

### Удержание контекста:
Учти, что ты анализируешь только последние ${MAX_HISTORY_LENGTH_FREE}-${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений, чтобы поддерживать актуальный контекст диалога. 

### Специальные инструкции:
- При сложных запросах сначала уточняй детали, чтобы правильно понять цель пользователя.
- При отсутствии достаточных данных предложи варианты решения, чтобы пользователь мог выбрать подходящий.
- При креативных запросах предлагай необычные идеи, но всегда оставляй выбор пользователю, чтобы ответ был максимально персонализированным.
- В ответах на конкретные вопросы избегай догадок и стремись к чёткости и проверенности информации.
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

_P\\.S\\. Доступные модели: GPT\\-4o\\-mini и GPT\\-4o для текстовых ответов /settings и DALL\\-E 3 🆕 для генерации изображений /image\\._

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const START_MESSAGE_STEP_1 = `
*Я \\- Ваш универсальный ИИ\\-ассистент*

На связи 24/7, чтобы оптимизировать Вашу жизнь и освободить время для чего\\-то приятного\\!

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const START_MESSAGE_STEP_2 = `
*Оставьте мне рутинные и сложные дела, а сами займитесь тем, что действительно важно\\!*

Мой потенциал практически безграничен\\. Вот лишь малая часть того, что я могу:

├ 🔄 перевести текст на любой язык
├ ✍️ написать пост, статью, имеил или краткое изложение
├ 📚 решить задачи и написать учебные работы
├ 💡 придумать контент\\-план, историю, сценарий или любой другой креатив
├ 📝 провести сложные расчёты, анализ и исследования
├ 🍽️ расписать меню на неделю с любыми запросами
├ ❤️‍🩹 помочь справиться со стрессом или разобраться в себе
└ 🖼️ сгенерировать изображение по текстовому описанию
\\.\\.\\.и многое другое\\!
`;

export const START_MESSAGE_STEP_3 = `
*Я работаю на самых современных нейросетях от компании OpenAI*

В моем арсенале есть:
→ *GPT\\-4o mini* \\(базовая\\) — быстрая модель, подходит для решения повседневных задач простой и средней сложности
→ *GPT\\-4o* \\(PRO\\) — высокоинтеллектуальная модель для сложных многоэтапных задач, осуществляет более глубокий анализ и лучше структурирует ответы
→ *DALL\\-E 3* — самая новая модель OpenAI для генерации изображений
`;

export const START_MESSAGE_STEP_4 = `
*Можете\\!*

У нас есть бесплатная версия и платная подписка с расширенными возможностями\\.
Бесплатная версия позволяет делать 15 запросов к базовой модели \\(GPT\\-4o mini\\) в неделю, и Вы уже можете её протестировать\\.

*Но у меня есть сюрприз\\!*
*🔥 Попробуйте подписку *Оптимум 🚀* всего за 1 рубль на 3 дня\\!*

Уверен, Вы догадываетесь, что подписка даёт куда больше возможностей, но я предлагаю убедиться в этом лично\\!

*Оптимум подписка – это:*
– 50 базовых запросов *в день*
– 50 PRO запросов
– 20 генераций изображений
`;

export const START_MESSAGE_STEP_5 = `
*Уровни подписки и цены \\(руб\\. / месяц\\):*

→ *${SUBSCRIPTIONS.START.title} ${SUBSCRIPTIONS.START.icon}* \\| ${SUBSCRIPTIONS.START.price}₽
_20 базовых запросов в день и 10 генераций изображений в месяц_
→ *${SUBSCRIPTIONS.OPTIMUM.title} ${SUBSCRIPTIONS.OPTIMUM.icon}* \\| ${SUBSCRIPTIONS.OPTIMUM.price}₽
_50 базовых запросов в день, 50 PRO запросов и 20 генераций изображений в месяц_
→ *${SUBSCRIPTIONS.PREMIUM.title} ${SUBSCRIPTIONS.PREMIUM.icon}* \\| ${SUBSCRIPTIONS.PREMIUM.price}₽
_100 базовых запросов в день, 100 PRO запросов и 30 генераций изображений в месяц_
→ *${SUBSCRIPTIONS.ULTRA.title} ${SUBSCRIPTIONS.ULTRA.icon}* \\| ${SUBSCRIPTIONS.ULTRA.price}₽
_300 базовых запросов в день, 300 PRO запросов и 50 генераций изображений в месяц_

А ещё вы можете покупать токены 🪙 и тратить их по своему усмотрению
➕ Плюс \\– они не имеют срока действия
➖ Минус \\– подписка гораздо выгоднее

Ознакомиться со всеми преимуществами подписки и выбрать подходящий уровень: /subscription
Подробнее почитать про токены: /help
`;

export const START_MESSAGE_STEP_6 = `
*Управление*

1\\. Чтобы отправить запрос, просто напиши мне любое текстовое сообщение 💬
2\\. Чтобы сгенерировать изображение, используйте команду /image или кнопку “🖼️ Сгенерировать изображение”
3\\. Управлять функциями можно через команды или через кнопки в меню\\*

\\*Чтобы открыть меню, нажмите на значок квадрата в правой части поля ввода сообщения \\(обведен красным кругом на фото\\)\\. При нажатии откроется меню с кнопками для удобного управления\\. Вы также можете пользоваться командами: для этого нажмите на три синюю кнопку с тремя полосками *слева* от поля ввода\\.
`;

export const START_MESSAGE_STEP_7 = `
*Отлично, всё готово\\!*

Чтобы начать пользоваться ИИ\\-помощником, просто отправьте мне ваш запрос текстом

_Например:_
– Что такое _\\*любая тема\\*_? Объясни так, чтобы понял ребенок
– Предложи 5 стратегий пассивного заработка, если я _\\*Ваш род деятельности\\*_
– Составь план поездки на двоих в Париж на выходные с бюджетом XXX$
– Дай 5 нетривиальных способов справиться со стрессом
`;

export const HELP_MASSAGE_MAIN = `
*ℹ️ Информация \\| Что Вы хотите узнать?*

Нажмите на кнопку для выбора темы ↓
`;
export const HELP_MESSAGE_FIND_MENU = `
*🔣 Как открыть меню?*

Чтобы открыть меню, нажмите на значок квадрата в правой части поля ввода сообщения \\(обведен красным кругом на фото\\)\\. При нажатии откроется меню с кнопками для удобного управления\\. Вы также можете пользоваться командами: для этого нажмите на три синюю кнопку с тремя полосками *слева* от поля ввода\\.
  `;
export const HELP_MESSAGE_HOW_TO_USE_BOT = `
*❓ Как пользоваться ботом?*

Чтобы начать общение с ботом, просто отправьте любое текстовое сообщение\\.

Для генерации изображений используйте кнопку
"🖼️ Сгенерировать изображение" или команду /image\\.
  `;
export const HELP_MESSAGE_REQUESTS = `
*⭐ Запросы*

Запрос к ИИ\\-боту – это любое текстовое сообщение, отправленное в чат\\. Нажатия кнопок и команды запросами не считаются\\.

Каждое сообщение\\-запрос потребляет либо 1 запрос, либо 1\\.5\\-10 токенов с Вашего баланса в заивисимости от ИИ\\-модели\\.
ИИ\\-модели делятся на *базовые* и *PRO*\\.

>>В бесплатной версии доступно __${SUBSCRIPTIONS.FREE.basicRequestsPerWeek} запросов к базовой модели в неделю__, а на стартовом уровне подписки – уже *${SUBSCRIPTIONS.START.basicRequestsPerDay} в день*
  `;
export const HELP_MESSAGE_MODELS = `
*🤖 ИИ\\-модели*  
  
От выбора модели зависит качество и скорость ответа

В нашем боте доступны 2 текстовые модели и одна модель генерации изображений:
→ *GPT\\-4o mini* \\(базовая\\) — быстрая модель, подходит для решения повседневных задач простой и средней сложности
→ *GPT\\-4o* \\(PRO\\) — высокоинтеллектуальная модель для сложных многоэтапных задач, осуществляет более глубокий анализ и лучше структурирует ответы
→ *DALL\\-E 3* — самая новая модель OpenAI для генерации изображений

\\! PRO модель и генерация изображений доступны только по подписке или за токены\\.

>>Подписка предоставляет более выгодные условия для использования моделей и начинается всего от *${SUBSCRIPTIONS.START.price}₽* в месяц


Переключиться между моделями: /settings
Сгенерировать изображение: /image
  `;
export const HELP_MESSAGE_TOKENS = `
*🪙 Токены*

Токены — это внутренняя валюта, которую можно тратить на доп\\. запросы вне подписки:

1 __базовый__ запрос \\= 1\\.5 токена
1 __PRO__ запрос \\= 3 токена
1 __генерация изображения__ \\= 10 токенов

Купить токены: /topup

_P\\.S\\. Мы говорили, что подписка выгоднее, чем токены? 👀_
/subscription
    `;

export const HELP_MESSAGE_CHAT_MODES = `
*💬 Режимы чата*

Всего есть два режима: Обычный и Диалог

→ Обычный — бот отвечает на вопросы, __не запоминая контекст__ \\(каждое сообщение воспринимается как новый чат\\)\\. Этот режим подходит для простых вопросов, требующих короткий ответ\\.
→ Диалог — бот запоминает контекст предыдущих сообщений\\. Этот режим подходит для более сложных вопросов, требующих развернутого ответа\\. В нем можно просить бота задавать дополнительные вопросы, чтобы получить более точный ответ\\.

Переключить режим: /settings
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
  '*💳 Для оплаты нажмите кнопку "Оплатить" ниже*\n\n_🔐 Вы будете перенаправлены на страницу платежной системы Юкасса\n__Платеж будет безопасно проведен на стороне Юкасса, бот не имеет доступа к данным Вашей карты и нигде их не сохраняет___\n\n_После окончания срока действия подписки она будет автоматически продлена на месяц по полной цене\\. Само собой, у Вас будет возможность отменить продление или перейти на другой уровень в любой момент до окончания действия подписки_';

export const SUBSCRIPTIONS_MESSAGE = `
*Описание уровней подписки*

*${SUBSCRIPTIONS.START.icon} ${SUBSCRIPTIONS.START.title}*  \\| ${SUBSCRIPTIONS.START.price}₽
– ${SUBSCRIPTIONS.START.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.START.imageGenerationPerMonth} генераций изображений / месяц
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.OPTIMUM.icon} ${SUBSCRIPTIONS.OPTIMUM.title}*  \\| ${SUBSCRIPTIONS.OPTIMUM.price}₽
– ${SUBSCRIPTIONS.OPTIMUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.OPTIMUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.OPTIMUM.imageGenerationPerMonth} генераций изображений / месяц
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.PREMIUM.icon} ${SUBSCRIPTIONS.PREMIUM.title}*  \\| ${SUBSCRIPTIONS.PREMIUM.price}₽
– ${SUBSCRIPTIONS.PREMIUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.PREMIUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.PREMIUM.imageGenerationPerMonth} генераций изображений / месяц
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

*${SUBSCRIPTIONS.ULTRA.icon} ${SUBSCRIPTIONS.ULTRA.title}*  \\| ${SUBSCRIPTIONS.ULTRA.price}₽
– ${SUBSCRIPTIONS.ULTRA.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.ULTRA.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.ULTRA.imageGenerationPerMonth} генераций изображений / месяц
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

__Базовые__ запросы – это запросы к GPT-4o mini
__PRO__ запросы – это запросы к GPT-4o

Почитать про разницу моделей: /help

Какой уровень подключаем?
Нажмите на кнопку ниже ↓
`;

export const SUBSCRIPTIONS_MESSAGE_WITH_TRIAL = `
*Описание уровней подписки*

*${SUBSCRIPTIONS.START.icon} ${SUBSCRIPTIONS.START.title}*  \\| ${SUBSCRIPTIONS.START.price}₽
– ${SUBSCRIPTIONS.START.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.START.imageGenerationPerMonth} генераций изображений / месяц
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.OPTIMUM.icon} ${SUBSCRIPTIONS.OPTIMUM.title}*  \\| ~${SUBSCRIPTIONS.OPTIMUM.price}₽~ *${SUBSCRIPTIONS.OPTIMUM_TRIAL.price}₽* на 3 дня 🌟
– ${SUBSCRIPTIONS.OPTIMUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.OPTIMUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.OPTIMUM.imageGenerationPerMonth} генераций изображений / месяц
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.PREMIUM.icon} ${SUBSCRIPTIONS.PREMIUM.title}*  \\| ${SUBSCRIPTIONS.PREMIUM.price}₽
– ${SUBSCRIPTIONS.PREMIUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.PREMIUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.PREMIUM.imageGenerationPerMonth} генераций изображений / месяц
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

*${SUBSCRIPTIONS.ULTRA.icon} ${SUBSCRIPTIONS.ULTRA.title}*  \\| ${SUBSCRIPTIONS.ULTRA.price}₽
– ${SUBSCRIPTIONS.ULTRA.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.ULTRA.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.ULTRA.imageGenerationPerMonth} генераций изображений / месяц
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

__Базовые__ запросы – это запросы к GPT-4o mini
__PRO__ запросы – это запросы к GPT-4o

Почитать про разницу моделей и режим диалога: /help

Какой уровень подключаем?
Нажмите на кнопку ниже ↓
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

export const getSettingsMessage = (
  activeModel: AiModelsLabels,
  chatMode: ChatMode,
) => {
  const modelLabel = activeModel.replace(/-/g, '\\-');
  return `
*Текущие настройки ⚙️*
→ Режим: ${chatMode === 'basic' ? 'Обычный' : 'Диалог'}
→ Модель: ${modelLabel} ${
    activeModel === AiModelsLabels.GPT_4O_MINI
      ? '\\(Базовые запросы\\)'
      : '\\(PRO запросы\\)'
  }
"Начать новый чат" – нажмите для сброса контекста чата в режиме Диалог

Значок ☑️ указывает на выбранную модель и режим
Нажимайте на кнопки ниже, чтобы переключать настройки ↓

_Подробнее про режимы и модели: /help_
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
*Уровень подписки: ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
    SUBSCRIPTIONS[user.subscriptionLevel].title
  }*${user.subscriptionExpiry ? `\n_Действует до ${expirationDate}_` : ''}${
    isNewSubscriptionLevelShown
      ? `\n_После будет переключен на ${newSubscriptionLevelTitle}_`
      : ''
  }${freeRequestsMessage}

*Остаток запросов по подписке*
⭐️ Базовые: ${user.basicRequestsLeftToday} на сегодня
🌟 PRO: ${user.proRequestsLeftThisMonth} на месяц
🖼️ Генерация изображений: ${user.imageGenerationLeftThisMonth} на месяц

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
*Уровень подписки*: ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
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
