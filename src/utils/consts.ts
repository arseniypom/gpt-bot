import dayjs from 'dayjs';
import { IUser } from '../../db/User';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import {
  AiModel,
  AiModelsLabels,
  AiRequestMode,
  AssistantRoleLabels,
  SubscriptionLevels,
} from '../types/types';
import { TOKEN_PACKAGES } from '../bot-token-packages';
import { getBotUrl, getChannelTelegramName } from './utilFunctions';

export const BASIC_REQUEST_COST = 1.5;
export const PRO_REQUEST_COST = 3;
export const IMAGE_GENERATION_COST = 10;
export const IMAGE_ANALYSIS_COST = 4;
export const VOICE_ADDITIONAL_COST = 0.5;

export const MAX_BOT_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_LENGTH_FREE = 5;
export const MAX_HISTORY_LENGTH_START_OPTIMUM = 15;
export const MAX_HISTORY_LENGTH_PREMIUM_ULTRA = 30;

export const DEFAULT_AI_MODEL = 'GPT_4O_MINI';
export const MAX_USER_MESSAGE_LENGTH = 3000;

export const modelSettings: Record<
  AiModel,
  {
    cost?: number;
    limitPriority: (
      | 'basicRequestsLeftThisWeek'
      | 'basicRequestsLeftToday'
      | 'proRequestsLeftThisMonth'
      | 'tokens'
    )[];
    statsKey: keyof IUser['stats'];
  }
> = {
  GPT_4O_MINI: {
    cost: BASIC_REQUEST_COST,
    limitPriority: [
      'basicRequestsLeftThisWeek',
      'basicRequestsLeftToday',
      'tokens',
    ],
    statsKey: 'basicReqsMade',
  },
  GPT_4O: {
    cost: PRO_REQUEST_COST,
    limitPriority: ['proRequestsLeftThisMonth', 'tokens'],
    statsKey: 'proReqsMade',
  },
  O1: {
    limitPriority: ['proRequestsLeftThisMonth'],
    statsKey: 'o1ReqsMade',
  },
};

const channelTelegramName = getChannelTelegramName();
if (!channelTelegramName) {
  throw new Error('Env var CHANNEL_TELEGRAM_NAME_* is not defined');
}

export const COMMANDS = [
  {
    command: 'start',
    description: 'Начало',
  },
  {
    command: 'profile',
    description: '👤 Профиль и баланс',
  },
  {
    command: 'settings',
    description: '⚙️ Настройки чата',
  },
  {
    command: 'image',
    description: '🖼️ Сгенерировать изображение',
  },
  {
    command: 'promocode',
    description: '🎁 Ввести промокод',
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
  settingsNew: '⚙️ Настройки чата',
  subscribe: '🎉 Подключить подписку',
  buyTokens: '🪙 Купить токены',
  image: '🖼️ Сгенерировать изображение',
  help: 'ℹ️ Информация',
  support: '🆘 Поддержка',
};

export const INLINE_BUTTON_LABELS = {
  subscription: '🎉 Подключить подписку',
  allLevels: '🎉 Все уровни',
  subscriptionManage: '🛠️ Управление подпиской',
  referralProgram: '⚡ Бесплатные запросы',
  subscriptionTrial: '🔥 8 дней за 1 рубль',
};

export const COSTS_LABELS = {
  basicRequest: BASIC_REQUEST_COST.toString().replace(/\./g, '\\.'),
  basicVoiceRequest: `${(BASIC_REQUEST_COST + VOICE_ADDITIONAL_COST)
    .toString()
    .replace(/\./g, '\\.')}`,
  proRequest: PRO_REQUEST_COST.toString().replace(/\./g, '\\.'),
  proVoiceRequest: `${(PRO_REQUEST_COST + VOICE_ADDITIONAL_COST)
    .toString()
    .replace(/\./g, '\\.')}`,
  imageGeneration: IMAGE_GENERATION_COST.toString().replace(/\./g, '\\.'),
  imageAnalysis: IMAGE_ANALYSIS_COST.toString().replace(/\./g, '\\.'),
};

export const PROMPT_MESSAGE_BASE = `
Ты — вежливый и поддерживающий ИИ-ассистент, созданный для помощи пользователям в решении различных задач.

Отвечай понятно и структурированно, используя простой, но интерактивный язык. Твои ответы должны быть:

1. Точными и полезными — всегда стремись предоставлять проверенную и релевантную информацию. Если вопрос сложный, разбивай ответ на понятные шаги и рекомендации. Выполняй задачи пользователя точно, внимательно и качественно.
2. Контекстуально адаптированными — подстраивай стиль под тип задачи: будь креативным, если вопрос требует оригинальности, и конкретным, если требуется строгий, чёткий ответ.
3. Эмпатичными и поддерживающими — отвечай с уважением к запросам пользователя, чтобы помочь им чувствовать себя уверенно и спокойно.
4. Вежливыми – всегда обращайся на Вы.

### Основные функции:
Ты умеешь много всего, например:
– Анализировать изображения и выполнять задачи, указанные на них
– Принимать голосовые сообщения и отвечать на них
- Перевести текст на любой язык
- Написать пост, статью, письмо или краткое изложение
- Решить учебные задачи и предоставить обучающие материалы
- Создать контент-план, сценарий, историю и другой креативный контент
- Провести анализ, расчёты и исследования
- Разработать меню на неделю под любые запросы
- Сгенерировать изображение через модель DALL-E 3 по текстовому запросу (команда /image)
И многое другое.

### Форматирование ответов:
- Для форматирования обычного текста используй вот такое форматирование:
Заголовки:
# Header
## Subheader
Списки:
* item 1
* item 2
* item 3
– Не используй иные средства разметки, такие как **, __, <, > и т.д.
– Для выделения текста можешь использовать единичную звездочку, например: *текст*, и никогда не используй двойную звездочку, например: **текст** – это запрещено.
– Не используй разделители (---).
– Не используй escape-последовательности в тексте, такие как \\* и \\<\\>, пример: вместо \(x\) пиши (x). Если формула содержит дробь, используй текстовый вид, например: "x = 1/2" вместо дробного представления.
– Никогда не используй форматирование формул или особую разметку или язык формул: например, latex. Вместо этого пиши формулы обычными простыми человекочитаемыми математическими символами. Вместо frac{1}{T} пиши 1/T.
Вместо text{с} или аналогов используй обычный текст: "с" (секунда) или другое слово. Всегда отдавай текст без специальных символов, используй только обычные текстовые обозначения. Все математические, физические или другие специализированные обозначения должны быть записаны словами или с использованием простых текстовых символов.
– Не используй эмоджи в ответах по умолчанию. Используй их только если пользователь прямо просит об этом.
- Если запрос требует структурированного ответа, используй списки и чёткие разделы с заголовками и подзаголовками, если уместно.
– Если пользователь просит тебя форматировать ответ в виде таблицы, скажи, что таблица будет некорректно отображаться в телеграме и сделай форматирование в виде списка.

### Специальные инструкции:
– Всегда отвечай на языке, на котором был задан вопрос.
- При сложных запросах сначала уточняй детали, чтобы правильно понять цель пользователя.
- При отсутствии достаточных данных предложи варианты решения, чтобы пользователь мог выбрать подходящий.
- При креативных запросах предлагай необычные идеи, но всегда оставляй выбор пользователю, чтобы ответ был максимально персонализированным.
- В ответах на конкретные вопросы избегай догадок и стремись к чёткости и проверенности информации.
– Если пользователь просит тебя сгенерировать изображение, уточняй, что ты можешь помочь сформулировать запрос для генерации, но саму генерацию можно сделать только через команду /image или нажатие кнопки "🖼️ Сгенерировать изображение"
`;

export const PROMPT_MESSAGE_DIALOG_MODE_POSTFIX = `
### Удержание контекста:
Учти, что ты анализируешь только последние ${MAX_HISTORY_LENGTH_FREE}-${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений, чтобы поддерживать актуальный контекст диалога. Когда контекста для ответа не хватает, ты можешь задать пользователю уточняющие вопросы
`;

export const PROMPT_MESSAGE_BASIC_MODE_POSTFIX = `
### Удержание контекста:
Ты не запоминаешь контекст диалога, каждое сообщение воспринимается как новый чат. Если пользователь предположительно задает вопросы исходя из контекста предыдущих сообщений, уточни, что ты не запоминаешь контекст и каждый вопрос ты воспринимаешь как новый. А для переключения режима диалога нужно использовать команду /settings или кнопку "⚙️ Настройки" в меню.
`;

export const PROMPT_FOR_TRANSLATOR = `
You are a professional translator assistant, who is able to translate from any language to any language. You are extremely attentive to details and it is clearly visible in the translations. Translate the user's message to the language specified in his message in the most native and natural way.

Follow these translation rules carefully:
1) Use appropriate vocabulary and grammar: preserve the tone and the emotions expressed in the original text;
2) Preserve all the details from the original text;
3) Translate the text in the most native and natural way, so that it is not distinguishable from the native English speaker-written text;
4) Use the most widely spread and common translation.
5) If no target language is specified, translate or rewrite user's message to English.
`;

export const getPromptImagePostfix = (caption: string | undefined) => `
### Работа с изображениями от пользователя:
Выполни следующую задачу на основе данных с изображения: ${
  caption ||
  'самостоятельно поставь себе задачу исходя из контекста изображения и начни свой ответ со слов "Я проанализировал изображение и постараюсь ...", пример: "Я проанализировал изображение и постараюсь решить уравнение, представленное на изображении"'
}.
Если для анализа изображения требуется больше информации, то задай пользователю уточняющие вопросы.
`;

export const START_MESSAGE_V2_old = `
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

_P\\.S\\. Доступные модели: GPT\\-4o\\-mini, GPT\\-4o и o1 для текстовых ответов /settings и DALL\\-E 3 🆕 для генерации изображений /image\\._

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const START_MESSAGE_STEP_1 = `
*Я \\- Ваш универсальный ИИ\\-ассистент*

Жмите *Знакомство*, чтобы узнать возможности бота ↓

_Оферта\\: [telegra\\.ph/Oferta\\-10\\-29](https://telegra.ph/Oferta-10-29)_
`;

export const START_MESSAGE_STEP_2 = `
*Передайте мне рутинные и неприятные дела, а сами займитесь тем, что действительно важно\\!*

Мой потенциал практически безграничен\\. Вот лишь малая часть того, что я могу:

├ 🔄 перевести текст на любой язык
├ ✍️ написать пост, статью, имеил или краткое изложение
├ 📚 объяснить материал и помочь с ДЗ
├ 💡 придумать контент\\-план, историю, сценарий или любой другой креатив
├ 📝 провести сложные расчёты, анализ и исследования
├ 🍽️ расписать меню на неделю с любыми запросами
├ ❤️‍🩹 помочь справиться со стрессом или разобраться в себе
└ 🖼️ сгенерировать изображение по текстовому описанию
\\.\\.\\.и многое другое\\!
`;

export const START_MESSAGE_STEP_2v2 = `
*Передайте мне дела, а сами займитесь тем, что действительно важно\\!*

Мой потенциал безграничен\\! Например:

├ 🗣️ отправьте голосовое сообщение и я отвечу на него
├ 👩‍💻 помогу с рабочими задачами
├ 📚 объясню материал и решу ДЗ
├ 💡 придумаю контент\\-план, историю, сценарий или любой другой креатив
├ ❤️‍🩹 побуду другом, психологом или коучем
└ 🖼️ сгенерирую изображение по описанию
\\.\\.\\.и многое другое\\!

>>>🎁 Отправьте мне сообщение и получите валюту для генерации изображений и PRO запросов\\!
`;

export const START_MESSAGE_STEP_3 = `
*Я работаю на самых современных нейросетях от компании OpenAI ⚡*

В моем арсенале есть:
→ *GPT\\-4o mini* \\(базовая\\) — быстрая модель, подходит для решения повседневных задач простой и средней сложности
→ *GPT\\-4o* \\(PRO\\) — высокоинтеллектуальная модель для сложных многоэтапных задач, осуществляет более глубокий анализ и лучше структурирует ответы
→ *o1* \\(PRO\\) — первая \\"думающая\\" модель\\. Дольше отвечает, так как рассуждает в процессе, но ответы получаются ещё более точными, развернутыми и учитывают все нюансы\\. Идеальна для решения математических задачи и программирования, составления сложных планов, сценариев и анализа
→ *DALL\\-E 3* — самая новая модель OpenAI для генерации изображений
`;

export const START_MESSAGE_STEP_4 = `
→ Есть *бесплатная версия* – даёт 20 запросов к базовой модели \\(GPT\\-4o mini\\) в неделю
→ И *платная* – отвечает на голосовые сообщения, даёт доступ к PRO моделям, генерации картинок и расширенной памяти в диалоге

*🔥 Вы можете попробовать подписку Оптимум всего за 1 рубль на 8 дней\\!*

*Оптимум подписка – это:*
\\+ прием голосовых сообщений
\\+ анализ изображений
\\+ 100 базовых запросов __в день__
\\+ 100 PRO запросов
\\+ 20 генераций изображений
\\+ расширенная память в режиме диалога

_Другие уровни подписки: /subscription_

Попробуйте сами у и убедитесь в эффективности подписки за 1₽ ↓
`;

export const START_MESSAGE_STEP_5 = `
Чтобы пользоваться ботом, Вам необходимо подписаться на канал [Кухня ИИ](https://t.me/${channelTelegramName}) 🔗\n\n_🔐 Это сделано для защиты от спама и вредоносных ботов, чтобы обеспечить пользователям комфортный бесперебойный доступ к ChatGPT_\\.\n\nПожалуйста, подпишитесь и нажмите на кнопку "✅ Я подписался\\(лась\\) на канал"
`;

export const START_MESSAGE_STEP_6 = `
*Последний шаг: управление*

1\\. Отправить запрос в ИИ: просто напишите любое текстовое сообщение в чат 💬
2\\. Сгенерировать изображение: команда /image или кнопка "🖼️ Сгенерировать изображение"
3\\. Управлять ботом можно через команды или через кнопки в меню\\*

❗ \\*Если не видите меню с кнопками: см\\. раздел _"Как открыть меню"_, команда /help
`;

export const START_MESSAGE_STEP_7 = `
*Отлично, всё готово\\!*
Чтобы начать пользоваться ботом, просто отправьте запрос текстовым сообщением 💬

_Примеры хорошо составленного запроса:_
– Что такое _\\*любая тема\\*_? Объясни максимально просто и подробно
– Предложи 5 стратегий пассивного заработка, если я _\\*Ваш род деятельности\\*_
– Составь план поездки на двоих в Париж на выходные с бюджетом \\.\\.\\.$
– Дай 5 нетривиальных способов справиться со стрессом
`;

export const FIRST_REQUEST_GIFT_MESSAGE = `
*Ура, Вы сделали первый запрос\\!*
🎁 За это я дарю Вам 20 токенов 🪙 на баланс

С помощью них можно:
→ Сгенерировать изображение \\(/image\\)
→ Получить ответ на голосовое сообщение
→ Сделать запрос к PRO модели \\(смените модель в /settings\\)

Узнать баланс – /profile
`;

export const HELP_MASSAGE_MAIN = `
*ℹ️ Часто задаваемые вопросы*

_Не нашли ответ на свой вопрос? Обратитесь в поддержку /support_
`;
export const HELP_MESSAGE_FIND_MENU = `
*🔣 Как открыть меню?*

Чтобы открыть меню, нажмите на значок квадрата в правой части поля ввода сообщения \\(обведен красным кругом на фото\\)\\. При нажатии откроется меню с кнопками для удобного управления\\. Вы также можете пользоваться командами: для этого нажмите на три синюю кнопку с тремя полосками *слева* от поля ввода\\.
  `;
export const HELP_MESSAGE_HOW_TO_USE_BOT = `
*❓ Как пользоваться ботом?*

1\\. Отправить запрос в ИИ: просто напишите любое текстовое сообщение в чат 💬
2\\. Сгенерировать изображение: команда /image или кнопка "🖼️ Сгенерировать изображение"
3\\. Управлять ботом можно через команды или через кнопки в меню\\*

❗ \\*Если не видите меню с кнопками: см\\. раздел _"Как открыть меню"_, команда /help
  `;
export const HELP_MESSAGE_REQUESTS = `
*⭐ Запросы*

Запрос к ИИ\\-боту – это любое текстовое сообщение, отправленное в чат\\. Не считаются запросами нажатия кнопок и команды\\.

Каждое сообщение\\-запрос потребляет либо 1 запрос, либо 1\\.5\\-10 токенов с Вашего баланса в зависимости от ИИ\\-модели\\.
ИИ\\-модели делятся на *базовые* и *PRO*\\.

>>В бесплатной версии доступно __${SUBSCRIPTIONS.FREE.basicRequestsPerWeek} запросов к базовой модели в неделю__, а на стартовом уровне подписки – уже *${SUBSCRIPTIONS.START.basicRequestsPerDay} в день*
  `;
export const HELP_MESSAGE_MODELS = `
*🤖 ИИ\\-модели*  
  
От выбора модели зависит качество и скорость ответа

В нашем боте доступны 3 текстовые модели и одна модель генерации изображений:
→ *GPT\\-4o mini* \\(базовая\\) — быстрая модель, подходит для решения повседневных задач простой и средней сложности
→ *GPT\\-4o* \\(PRO\\) — высокоинтеллектуальная модель для сложных многоэтапных задач, осуществляет более глубокий анализ по сравнению с GPT\\-4o mini и лучше структурирует ответы
→ *o1* \\(PRO\\) — первая \\"думающая\\" модель, дольше отвечает, так как рассуждает в процессе, но ответы получаются ещё более точными, развернутыми и учитывают все нюансы\\. Идеальна для решения математических задачи и программирования, составления сложных планов, сценариев и анализа
→ *DALL\\-E 3* — самая новая модель OpenAI для генерации изображений

\\! PRO модели и генерация изображений доступны только по подписке или за токены\\.

>>Подписка предоставляет более выгодные условия для использования моделей и начинается всего от *1₽* в месяц


Переключиться между моделями: /settings
Сгенерировать изображение: /image
  `;
export const HELP_MESSAGE_TOKENS = `
*🪙 Токены*

Токены – это внутренняя валюта, которую можно тратить на доп\\. запросы вне подписки:

*Базовые запросы \\(GPT\\-4o mini\\):*
  1 текстовый запрос \\= ${COSTS_LABELS.basicRequest} токена
  1 голосовой запрос \\= ${COSTS_LABELS.basicVoiceRequest} токена

*PRO запросы \\(GPT\\-4o и o1\\):*
  1 текстовый запрос \\= ${COSTS_LABELS.proRequest} токена
  1 голосовой запрос \\= ${COSTS_LABELS.proVoiceRequest} токена

*Генерация изображений:*
  1 генерация \\= ${COSTS_LABELS.imageGeneration} токенов

*Анализ изображения:*
  1 изображение \\= ${COSTS_LABELS.imageAnalysis} токена

→ Купить токены: /topup

_P\\.S\\. Я говорил, что подписка выгоднее, чем токены? 👀_
/subscription
    `;

export const HELP_MESSAGE_CHAT_MODES = `
*💬 Режимы чата*

Всего есть два режима: Обычный и Диалог

→ Обычный — бот отвечает на вопросы, __не запоминая контекст__ \\(каждое сообщение воспринимается как новый чат\\)\\. Этот режим подходит для простых вопросов, требующих ответ одним сообщением\\.
→ Диалог — бот запоминает контекст предыдущих сообщений\\. Этот режим подходит для более сложных вопросов, требующих развернутого ответа\\. В нем после полученния ответа удобно задавать дополнительные вопросы для дальнейшего обсуждения\\.

Переключить режим: /settings
  `;

export const TOPUP_MESSAGE = `
*🪙 Выберите количество токенов\nдля пополнения*

→ ${TOKEN_PACKAGES.token1.description}
→ ${TOKEN_PACKAGES.token2.description} _Популярный ✨_
→ ${TOKEN_PACKAGES.token3.description}

Что такое токены и на что их можно тратить: /help
`;

export const SUPPORT_MESSAGE = `
*Пожалуйста, опишите проблему как можно подробнее*
>>Время работы поддержки:
>>ПН\\-ВС 10:00\\-20:00 по Мск
`;
export const SUPPORT_MESSAGE_POSTFIX =
  'Пожалуйста, попробуйте позже или обратитесь в поддержку /support';

export const YOOKASSA_PAYMENT_MESSAGE_BASE =
  '*💳 Для оплаты нажмите кнопку "Оплатить" ↓*\n\n_🔐 Вы будете перенаправлены на страницу платежной системы Юкасса\n__Платеж будет безопасно проведен на стороне Юкасса, бот не имеет доступа к данным Вашей карты и нигде их не сохраняет___';
export const YOOKASSA_PAYMENT_MESSAGE_SUBSCRIPTION_POSTFIX =
  '\n\n_После окончания срока действия подписки она будет автоматически продлена на месяц по полной цене\\. Само собой, у Вас будет возможность отменить продление или перейти на другой уровень в любой момент до окончания действия подписки_';

export const SUBSCRIPTIONS_MESSAGE = `
*Описание уровней подписки*

*${SUBSCRIPTIONS.START.icon} ${SUBSCRIPTIONS.START.title}*  \\| ${SUBSCRIPTIONS.START.price}₽
– ${SUBSCRIPTIONS.START.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.START.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.OPTIMUM.icon} ${SUBSCRIPTIONS.OPTIMUM.title}*  \\| ${SUBSCRIPTIONS.OPTIMUM.price}₽
– ${SUBSCRIPTIONS.OPTIMUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.OPTIMUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.OPTIMUM.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.PREMIUM.icon} ${SUBSCRIPTIONS.PREMIUM.title}*  \\| ${SUBSCRIPTIONS.PREMIUM.price}₽
– ∞ Безлимит базовых запросов
– ${SUBSCRIPTIONS.PREMIUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.PREMIUM.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

*${SUBSCRIPTIONS.ULTRA.icon} ${SUBSCRIPTIONS.ULTRA.title}*  \\| ${SUBSCRIPTIONS.ULTRA.price}₽
– ∞ Безлимит базовых запросов
– ∞ Безлимит PRO запросов
– ${SUBSCRIPTIONS.ULTRA.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

__Базовые__ запросы – к модели GPT-4o mini
__PRO__ запросы – к моделям GPT-4o и o1

Почитать про разницу моделей: /help

Какой уровень подключаем?
Нажмите на кнопку ниже ↓
`;

export const SUBSCRIPTIONS_MESSAGE_WITH_TRIAL = `
*Описание уровней подписки*

*${SUBSCRIPTIONS.START.icon} ${SUBSCRIPTIONS.START.title}*  \\| ${SUBSCRIPTIONS.START.price}₽
– ${SUBSCRIPTIONS.START.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.START.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.OPTIMUM.icon} ${SUBSCRIPTIONS.OPTIMUM.title}*  \\| ~${SUBSCRIPTIONS.OPTIMUM.price}₽~ *${SUBSCRIPTIONS.OPTIMUM_TRIAL.price}₽* на 8 дней 🌟
– ${SUBSCRIPTIONS.OPTIMUM.basicRequestsPerDay} базовых запросов / день
– ${SUBSCRIPTIONS.OPTIMUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.OPTIMUM.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Стандартный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_START_OPTIMUM} сообщений)

*${SUBSCRIPTIONS.PREMIUM.icon} ${SUBSCRIPTIONS.PREMIUM.title}*  \\| ${SUBSCRIPTIONS.PREMIUM.price}₽
– ∞ Безлимит базовых запросов
– ${SUBSCRIPTIONS.PREMIUM.proRequestsPerMonth} PRO запросов / месяц
– ${SUBSCRIPTIONS.PREMIUM.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

*${SUBSCRIPTIONS.ULTRA.icon} ${SUBSCRIPTIONS.ULTRA.title}*  \\| ${SUBSCRIPTIONS.ULTRA.price}₽
– ∞ Безлимит базовых запросов
– ∞ Безлимит PRO запросов
– ${SUBSCRIPTIONS.ULTRA.imageGenerationPerMonth} генераций изображений / месяц
– Возможность отправлять голосовые сообщения
– Анализ изображений (безлимит)
– _Расширенный_ размер памяти в диалоге (${MAX_HISTORY_LENGTH_PREMIUM_ULTRA} сообщений)

__Базовые__ запросы – к модели GPT-4o mini
__PRO__ запросы – к моделям GPT-4o и o1

Почитать про разницу моделей и режим диалога: /help

Какой уровень подключаем?
Нажмите на кнопку ниже ↓
`;

export const ROLES_DESCRIPTION_MESSAGE = `
🎭 *Выберите роль ИИ\\-ассистента:*

→ *Обычный* – общий ИИ, способный помочь с любым запросом
→ *Переводчик* – специализированный ИИ\\-переводчик, заточенный на перевод любых языков в любые языки в максимально естественной форме, с сохранением контекста, тональности и стиля\\. Целевой язык перевода укажите в запросе, по умолчанию Ваш текст будет переведён на английский
`;

export const getNoBalanceMessage = ({
  reqType,
  canActivateTrial,
  isFreeUser,
  mode,
}: {
  reqType: AiModel | 'image';
  canActivateTrial: boolean;
  isFreeUser: boolean;
  mode?: AiRequestMode;
}) => {
  const modelLabel =
    reqType !== 'image' && AiModelsLabels[reqType].replace(/[-()]/g, '\\$&');

  let title;
  if (reqType === 'image') {
    title = '✖︎ Нет доступных запросов для генерации изображений ✖︎';
  } else {
    if (mode === 'voice') {
      title = `✖︎ Нет доступных голосовых запросов к модели ${modelLabel} ✖︎`;
    } else if (mode === 'imageVision') {
      title = `✖︎ Анализ изображений недоступен ✖︎`;
    } else {
      title = `✖︎ Нет доступных запросов к модели ${modelLabel} ✖︎`;
    }
  }

  let callToAction;
  if (isFreeUser) {
    callToAction =
      reqType === 'O1'
        ? 'подключите подписку 🚀'
        : 'подключите подписку или пополните баланс токенов 🪙';
  } else {
    callToAction =
      reqType === 'O1'
        ? 'переключитесь на другой уровень подписки ↓'
        : 'пополните баланс токенов или переключитесь на другой уровень подписки ↓';
  }

  const offer = canActivateTrial
    ? `*Подписка ChatGPT стоит от 2000₽ в месяц, а у нас Вы можете попробовать её всего за ${SUBSCRIPTIONS.OPTIMUM_TRIAL.price}₽\\!*`
    : `*Подписка ChatGPT стоит от 2000₽ в месяц, а у нас – всего от ${SUBSCRIPTIONS.START.price}₽ в месяц\\!*`;
  const freeUserOfferMessagePostfix = `
${offer}

С подпиской я буду гораздо эффективнее:
→ Доступ к продвинутым моделям
→ Голосовые запросы \\(оправляйте голосовые сообщения вместо набора текста\\!\\)
→ Генерация изображений
→ Расширенная память в диалоге
→ Приоритет в получении ответов
💎 А ещё платные пользователи первыми получают доступ к новым функциям\\!
  `;

  return `
*${title}*
Чтобы продолжить, ${callToAction}
${isFreeUser ? freeUserOfferMessagePostfix : ''}
  `;
};

export const getHDGenerationNotAvailableMessage = ({
  canActivateTrial,
  isFreeUser,
}: {
  canActivateTrial: boolean;
  isFreeUser: boolean;
}) => {
  const trialOffer = canActivateTrial
    ? `
🎁 Попробуйте подписку Оптимум
всего за ${SUBSCRIPTIONS.OPTIMUM_TRIAL.price}₽\\!

*Оптимум подписка – это:*
\\+ прием голосовых сообщений
\\+ анализ изображений
\\+ 100 базовых запросов __в день__
\\+ 100 PRO запросов
\\+ 20 генераций изображений
\\+ расширенная память контекста диалога
`
    : '';

  const messsagePostfix = isFreeUser
    ? ''
    : `
Чтобы перейти на другой уровень подписки после окончания действия текущей, нажмите на кнопку ниже ↓\n\n_Если Вы хотите перейти на другой уровень как можно скорее, не дожидаясь окончания действия текущей подписки, обратитесь в поддержку /support_
`;
  return `*Генерация изображений в HD качестве доступна только для уровня ${
    SUBSCRIPTIONS.OPTIMUM.title
  } и выше 🚀*\n${trialOffer || messsagePostfix}`;
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
  activeRole: AssistantRoleLabels,
) => {
  const modelLabel = activeModel.replace(/-/g, '\\-');
  return `
*Текущие настройки ⚙️*
→ ИИ\\-модель: *${modelLabel.replace(/[()]/g, '\\$&')}* ${
    activeModel === AiModelsLabels.GPT_4O_MINI ? '\\(Базовая\\)' : '\\(PRO\\)'
  }
→ Роль ассистента: *${activeRole.replace(/[()]/g, '\\$&')}*

🔄 Начать новый чат – сброс контекста
_Подробнее про модели: /help_
  `;
};

export const getProfileMessage = (user: IUser) => {
  const isFreeSubscription = user.subscriptionLevel === 'FREE';
  const isImageAnalysisAvailable =
    user.subscriptionLevel !== SubscriptionLevels.FREE &&
    user.subscriptionLevel !== SubscriptionLevels.START;

  // Free user
  const weeklyRequestsExpirationDate = dayjs(user.weeklyRequestsExpiry)
    .format('DD.MM.YYYY')
    .replace(/\./g, '\\.');
  const freeRequestsMessage = isFreeSubscription
    ? `\n\n*Остаток бесплатных запросов:* ${user.basicRequestsLeftThisWeek}/${SUBSCRIPTIONS.FREE.basicRequestsPerWeek}\n_Обновятся ${weeklyRequestsExpirationDate}_`
    : '';
  const trialMessage =
    isFreeSubscription && user.canActivateTrial
      ? `\n🎁 Попробуйте Оптимум: 8 дней за ${SUBSCRIPTIONS.OPTIMUM_TRIAL.price}₽\\!\nЖмите "Подключить подписку" ↓`
      : '';

  // Paid user
  const currSubscriptionData = SUBSCRIPTIONS[user.subscriptionLevel];
  const basicRequestsLeftToday =
    currSubscriptionData.basicRequestsPerDay === 1000
      ? '_безлимит_'
      : `${user.basicRequestsLeftToday}/${currSubscriptionData.basicRequestsPerDay} на сегодня`;
  const proRequestsLeftThisMonth =
    currSubscriptionData.proRequestsPerMonth === 1000
      ? '_безлимит_'
      : `${user.proRequestsLeftThisMonth}/${currSubscriptionData.proRequestsPerMonth} на мес\\.`;
  const imageGenerationLeftThisMonth = `${user.imageGenerationLeftThisMonth}/${
    currSubscriptionData.imageGenerationPerMonth
  } на мес\\.${
    isImageAnalysisAvailable ? '\n🕵️ Анализ изображений: _безлимит_\n' : '\n'
  }`;
  const requestsLeftMessage = !isFreeSubscription
    ? `\n*Остаток запросов:*
⭐️ Базовые: ${basicRequestsLeftToday}
🌟 PRO: ${proRequestsLeftThisMonth}
🖼️ Генерация изображений: ${imageGenerationLeftThisMonth}`
    : '';

  return `
*Уровень подписки:* ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
    SUBSCRIPTIONS[user.subscriptionLevel].title
  }${trialMessage}${freeRequestsMessage}
${requestsLeftMessage}
*Токены:* 🪙 ${user.tokensBalance.toString().replace(/\./g, '\\.')}

_\\*Подробнее о токенах и видах\nзапросов: /help_
  `;
};

export const getManageSubscriptionMessage = (user: IUser) => {
  const expirationDate = dayjs(user.subscriptionExpiry)
    .format('DD.MM.YYYY')
    .replace(/\./g, '\\.');
  const currSubscriptionData = SUBSCRIPTIONS[user.subscriptionLevel];

  const displayPrice = currSubscriptionData.price
    ? `${currSubscriptionData.price}₽`
    : 'Бесплатно';

  const isNewSubscriptionLevelShown =
    user.newSubscriptionLevel &&
    user.newSubscriptionLevel !== user.subscriptionLevel;
  const newSubscriptionLevelTitle =
    user.newSubscriptionLevel && SUBSCRIPTIONS[user.newSubscriptionLevel].title;

  return `
*Уровень подписки*: ${SUBSCRIPTIONS[user.subscriptionLevel].icon} ${
    SUBSCRIPTIONS[user.subscriptionLevel].title
  }
*Описание*: ${SUBSCRIPTIONS[user.subscriptionLevel].description}
*Стоимость*: ${displayPrice}
${user.subscriptionExpiry ? `*Действует до*: ${expirationDate}\n` : ''}
${
  isNewSubscriptionLevelShown
    ? `_После окончания действия уровень подписки будет переключен на ${newSubscriptionLevelTitle}\\._`
    : '_После окончания действия подписка будет автоматически продлена_'
}
  `;
};

export const getReferralProgramMessage = (user: IUser) => {
  const botUrl = getBotUrl();
  const botUrlSanitized = botUrl
    ?.replace(/^https:\/\//, '')
    .replace(/[.-_]/g, '\\$&');

  return `
*👥 Реферальная программа*

🪙 Вы можете бесплатно получить 12 токенов за каждого приглашенного друга\\!

⋅ Ваш друг также получит 12 токенов
⋅ Запросы зачислятся на баланс, когда друг активирует бота, перейдя по Вашей ссылке
⋅ Токены можно потратить на запросы или генерацию изображений \\(подробнее: /help\\)
⋅ Вы можете пригласить до 10 друзей \\(например, отправив ссылку в общий чат с друзьями или коллегами\\)

Друзей приглашено: ${user.referralProgram.invitedUserIds.length} / 10

⭐ Персональная ссылка:
[${botUrlSanitized}?start\\=ref\\_${user.telegramId}](${botUrl}?start=ref_${user.telegramId})
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
