(async function () {
  const runtimeConfig = window.PFChatConfig || {};
  const currentScript = document.currentScript || Array.from(document.scripts).reverse().find(function (item) {
    return /widget\.js(\?.*)?$/i.test(String(item.src || ''));
  }) || null;
  const widgetScriptUrl = String(runtimeConfig.widgetScriptUrl || currentScript?.src || '').trim();
  const widgetBaseUrl = String(
    runtimeConfig.widgetBaseUrl ||
    (widgetScriptUrl ? widgetScriptUrl.replace(/\/widget\.js(\?.*)?$/i, '') : '')
  ).replace(/\/+$/, '');
  const apiBase = String(runtimeConfig.apiBase || `${widgetBaseUrl}/api`).replace(/\/+$/, '');
  const siteId = String(runtimeConfig.siteId || '').trim();

  if (!siteId) {
    console.error('PFChatConfig.siteId is required');
    return;
  }

  function loadWidgetStyles() {
    const href = `${widgetBaseUrl}/widget.css`;
    if (!href || document.querySelector(`link[data-pf-chat-widget-css="${href}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.pfChatWidgetCss = href;
    document.head.appendChild(link);
  }

  async function loadWidgetSettings() {
    const response = await fetch(`${apiBase}/widget-config/${encodeURIComponent(siteId)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Widget config load failed');
    }
    return payload.config || {};
  }

  loadWidgetStyles();
  let widgetSettings;
  try {
    widgetSettings = await loadWidgetSettings();
  } catch (error) {
    console.error('PF chat widget failed to load config', error);
    return;
  }
  const avatarUrl = String(widgetSettings.avatarUrl || runtimeConfig.avatarUrl || '').trim();
  const MANAGER_NAME = String(widgetSettings.managerName || '').trim();
  const MANAGER_TITLE = String(widgetSettings.managerTitle || widgetSettings.operatorMetaLabel || 'Менеджер').trim();
  const MANAGER_AVATAR_URL = String(widgetSettings.managerAvatarUrl || '').trim();
  const STORAGE_KEY = `pf_chat_state_${siteId}`;
  const OPEN_SUPPRESS_KEY = `pf_chat_snooze_until_${siteId}`;
  const AUTO_OPEN_DELAY_MS = 6000;
  const AUTO_OPEN_SNOOZE_MS = 24 * 60 * 60 * 1000;
  const FLOW_DELAY_MIN_MS = 500;
  const FLOW_DELAY_MAX_MS = 1200;
  const MAX_CHAT_FILES = 5;
  const MAX_FILE_SIZE_BYTES = Number(widgetSettings.maxUploadSize || 20 * 1024 * 1024);
  const ALLOWED_EXTENSIONS = Array.isArray(widgetSettings.allowedFileTypes) && widgetSettings.allowedFileTypes.length
    ? widgetSettings.allowedFileTypes.map(function (item) {
        const normalized = String(item || '').trim().toLowerCase();
        return normalized.startsWith('.') ? normalized : `.${normalized}`;
      })
    : ['.jpg', '.jpeg', '.png', '.pdf', '.stl', '.3mf', '.obj', '.zip'];
  const DEFAULT_HINT = String(
    widgetSettings.fileHint ||
    `Формати: ${ALLOWED_EXTENSIONS.map(function (item) { return item.replace(/^\./, '').toUpperCase(); }).join(', ')} · до ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB`
  );
  const DEFAULT_PLACEHOLDER = 'Напишіть повідомлення';
  const WELCOME_TEXT = String(widgetSettings.welcomeMessage || '👋 Привіт!');
  const WELCOME_INTRO_LABEL = String(widgetSettings.welcomeIntroLabel || widgetSettings.botMetaLabel || 'AI помічник');
  const ONLINE_STATUS_TEXT = String(widgetSettings.onlineStatusText || 'онлайн');
  const QUICK_ACTION_FLOW_MAP = {
    price: 'price',
    time: 'print_time',
    print_time: 'print_time',
    upload: 'file_upload',
    file_upload: 'file_upload',
    question: 'general_question',
    general_question: 'general_question',
    repair: 'repair',
    design: 'design',
    idea: 'idea',
    batch: 'batch'
  };
  const QUICK_ACTIONS = Array.isArray(widgetSettings.quickActions) && widgetSettings.quickActions.length
    ? widgetSettings.quickActions
    : [
        { icon: '💰', label: 'Дізнатись ціну', key: 'price', flowId: 'price' },
        { icon: '📦', label: 'Скільки часу друк', key: 'time', flowId: 'print_time' },
        { icon: '📎', label: 'Завантажити модель', key: 'upload', flowId: 'file_upload' },
        { icon: '❓', label: 'Поставити питання', key: 'question', flowId: 'general_question' }
      ];
  const BOT_TITLE = String(widgetSettings.title || 'PrintForge AI');
  const BOT_META_LABEL = String(widgetSettings.botMetaLabel || BOT_TITLE);
  const OPERATOR_META_LABEL = MANAGER_TITLE;
  const LAUNCHER_TITLE = String(widgetSettings.launcherTitle || 'AI чат');
  const LAUNCHER_META = String(widgetSettings.launcherSubtitle || 'ціна, терміни, кастом');
  const STATUS_LABELS = Object.assign(
    { ai: ONLINE_STATUS_TEXT, human: 'менеджер онлайн', closed: 'діалог завершено' },
    widgetSettings.statusLabels || {}
  );
  const FLOW_TEXT = Object.assign(
    {
      askName: 'Як до вас можна звертатися?',
      priceAskObject: 'Що саме потрібно надрукувати? Опишіть коротко.',
      printAskObject: 'Що саме потрібно надрукувати?',
      askFile: 'Чи є у вас файл моделі?',
      askSize: 'Який приблизний розмір деталі?',
      priceAskContact: 'Можете залишити Telegram або телефон для уточнення вартості?',
      priceFinal: 'Дякуємо! Ми підготуємо розрахунок і напишемо вам.',
      printTimeInfo: 'Зазвичай друк займає від 2 до 48 годин, але точний час залежить від розміру, складності та матеріалу.',
      printAskContact: 'Можете залишити Telegram або телефон, і ми напишемо точніше.',
      printFinal: 'Дякуємо! Ми уточнимо термін і напишемо вам.',
      fileIntro: 'Надішліть STL, 3MF, OBJ, ZIP або фото/ескіз — я передам файл на перевірку.',
      fileAskName: 'Супер 👍 Як вас звати?',
      fileAskDescription: 'Що це за деталь або що потрібно зробити з моделлю?',
      fileAskGoal: 'Що вас цікавить найбільше?',
      fileAskContact: 'Залиште Telegram або телефон, щоб ми могли написати вам результат.',
      fileFinal: 'Дякуємо! Файл отримано ✅ Ми перевіримо модель і відповімо найближчим часом.',
      questionIntro: 'Звичайно! Напишіть ваше питання, і я допоможу або передам менеджеру.',
      questionFallback: 'Щоб відповісти точніше, я передам ваше питання менеджеру.',
      questionAskName: 'Як до вас звертатись?',
      questionAskContact: 'Можете залишити Telegram або телефон для відповіді?',
      contactTelegram: 'Напишіть, будь ласка, ваш Telegram username або номер.',
      contactPhone: 'Напишіть, будь ласка, номер телефону для зв’язку.',
      waitOperator: 'Хочете дочекатися оператора?',
      connectOperator: 'Очікуйте, з’єдную з оператором.'
    },
    widgetSettings.flowTextOverrides || {}
  );

  function createEmptyFlowSession() {
    return {
      activeFlow: '',
      currentStep: '',
      stepState: {},
      waitingFor: '',
      collectedAnswers: {},
      uploadedFiles: [],
      language: 'uk',
      conversationId: '',
      handoffReady: false,
      leadSummary: null,
      userMessages: [],
      startedAt: '',
      updatedAt: ''
    };
  }

  function getInitials(value, fallback) {
    const source = String(value || fallback || '').trim();
    if (!source) {
      return 'OP';
    }
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  function buildChoiceAction(label, value) {
    return {
      kind: 'flow-choice',
      label,
      value
    };
  }

  function buildContactChoiceStep(prompt) {
    return {
      input: 'choice',
      prompt,
      actions: [
        buildChoiceAction('Telegram', 'telegram'),
        buildChoiceAction('Телефон', 'phone'),
        buildChoiceAction('Пропустити', 'skip')
      ],
      onChoice: function (ctx) {
        if (ctx.value === 'telegram') {
          return {
            answers: { contact_type: 'telegram', contact_value: '' },
            nextStepId: 'collect_contact_telegram'
          };
        }

        if (ctx.value === 'phone') {
          return {
            answers: { contact_type: 'phone', contact_value: '' },
            nextStepId: 'collect_contact_phone'
          };
        }

        return {
          answers: { contact_type: 'skip', contact_value: '' },
          nextStepId: 'ask_wait_for_operator'
        };
      }
    };
  }

  function buildOperatorDecisionSteps(finalText) {
    return {
      ask_wait_for_operator: {
        input: 'choice',
        prompt: FLOW_TEXT.waitOperator,
        actions: [
          buildChoiceAction('Так', 'yes'),
          buildChoiceAction('Ні', 'no')
        ],
        onChoice: function (ctx) {
          if (ctx.value === 'yes') {
            return {
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.connectOperator,
              requestHumanHandoff: true
            };
          }

          return {
            completeFlow: true,
            finalConfirmationText: finalText,
            requestHumanHandoff: false
          };
        }
      }
    };
  }

  function createFutureLeadFlow(prompts) {
    return {
      startStepId: 'ask_name',
      handoffOnComplete: true,
      steps: {
        ask_name: {
          input: 'text',
          prompt: prompts.askName,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { name: ctx.text },
              nextStepId: 'ask_details'
            };
          }
        },
        ask_details: {
          input: 'text',
          prompt: prompts.askDetails,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { object_description: ctx.text },
              nextStepId: 'ask_contact'
            };
          }
        },
        ask_contact: buildContactChoiceStep(prompts.askContact),
        collect_contact_telegram: {
          input: 'text',
          prompt: FLOW_TEXT.contactTelegram,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'telegram', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: prompts.finalText
            };
          }
        },
        collect_contact_phone: {
          input: 'text',
          prompt: FLOW_TEXT.contactPhone,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'phone', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: prompts.finalText
            };
          }
        },
        ...buildOperatorDecisionSteps(prompts.finalText)
      }
    };
  }

  function normalizeConfiguredFlowStep(step, index) {
    const input = String(step && step.input || (step && step.type === 'choice' ? 'choice' : 'text')).trim().toLowerCase();
    const supportedInput = ['text', 'choice', 'file', 'none'].includes(input) ? input : 'text';
    const type = String(step && step.type || (supportedInput === 'choice' ? 'choice' : 'message')).trim().toLowerCase();
    const options = Array.isArray(step && step.options)
      ? step.options.map(function (option) {
          const label = String(option && option.label || '').trim();
          const value = String(option && option.value || label || '').trim();
          return label ? buildChoiceAction(label, value || ('option_' + (index + 1))) : null;
        }).filter(Boolean)
      : [];

    return {
      id: String(step && step.id || ('step_' + (index + 1))).trim() || ('step_' + (index + 1)),
      type: type === 'choice' ? 'choice' : 'message',
      input: type === 'choice' ? 'choice' : supportedInput,
      prompt: String(step && step.text || '').trim(),
      actions: options
    };
  }

  function buildConfiguredFlowDefinition(action) {
    const flow = Array.isArray(action && action.flow) ? action.flow.map(normalizeConfiguredFlowStep).filter(Boolean) : [];
    if (!flow.length) return null;

    const steps = {};
    flow.forEach(function (step, index) {
      const nextStep = flow[index + 1] || null;
      const isLast = !nextStep;
      const baseStep = {
        input: step.input,
        prompt: step.prompt,
        skipAiReply: true
      };

      if (step.input === 'choice') {
        baseStep.actions = step.actions;
        baseStep.onChoice = function (ctx) {
          return isLast
            ? {
                answers: { [step.id]: ctx.label || ctx.value || '' },
                completeFlow: true,
                finalConfirmationText: 'Дякуємо! Ми зберегли ваш запит і повернемось із відповіддю.'
              }
            : {
                answers: { [step.id]: ctx.label || ctx.value || '' },
                nextStepId: nextStep.id
              };
        };
      } else if (step.input === 'file') {
        baseStep.autoOpenFilePicker = true;
        baseStep.onFiles = function (ctx) {
          return isLast
            ? {
                answers: { [step.id]: ctx.attachments.map(function (file) { return file.fileName || 'file'; }).join(', ') },
                uploadedFiles: ctx.attachments,
                completeFlow: true,
                finalConfirmationText: 'Дякуємо! Ми отримали файл і повернемось із відповіддю.'
              }
            : {
                answers: { [step.id]: ctx.attachments.map(function (file) { return file.fileName || 'file'; }).join(', ') },
                uploadedFiles: ctx.attachments,
                nextStepId: nextStep.id
              };
        };
      } else if (step.input === 'none') {
        if (isLast) {
          baseStep.completeFlow = true;
          baseStep.finalConfirmationText = 'Дякуємо! Ми зберегли ваш запит і повернемось із відповіддю.';
        } else {
          baseStep.nextStepId = nextStep.id;
        }
      } else {
        baseStep.onText = function (ctx) {
          return isLast
            ? {
                answers: { [step.id]: ctx.text },
                completeFlow: true,
                finalConfirmationText: 'Дякуємо! Ми зберегли ваш запит і повернемось із відповіддю.'
              }
            : {
                answers: { [step.id]: ctx.text },
                nextStepId: nextStep.id
              };
        };
      }

      steps[step.id] = baseStep;
    });

    return {
      startStepId: flow[0].id,
      handoffOnComplete: true,
      steps: steps
    };
  }

  const CONFIGURED_FLOW_DEFINITIONS = QUICK_ACTIONS.reduce(function (accumulator, item) {
    const flowId = String(item.flowId || QUICK_ACTION_FLOW_MAP[String(item.key || '').trim().toLowerCase()] || '').trim();
    if (!flowId) return accumulator;
    const definition = buildConfiguredFlowDefinition(item);
    if (definition) {
      accumulator[flowId] = definition;
    }
    return accumulator;
  }, {});

  const FLOW_DEFINITIONS = {
    price: {
      startStepId: 'ask_name',
      handoffOnComplete: true,
      steps: {
        ask_name: {
          input: 'text',
          prompt: FLOW_TEXT.askName,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { name: ctx.text },
              nextStepId: 'ask_object_description'
            };
          }
        },
        ask_object_description: {
          input: 'text',
          prompt: function (session) {
            return `Приємно познайомитись, ${session.collectedAnswers.name || 'друже'}! ${FLOW_TEXT.priceAskObject}`;
          },
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { object_description: ctx.text },
              nextStepId: 'ask_file'
            };
          }
        },
        ask_file: {
          input: 'choice',
          prompt: FLOW_TEXT.askFile,
          skipAiReply: true,
          acceptsDirectFiles: true,
          actions: [
            buildChoiceAction('📎 Завантажити файл', 'upload_file'),
            buildChoiceAction('❌ Файлу немає', 'no_file')
          ],
          onChoice: function (ctx) {
            if (ctx.value === 'upload_file') {
              return {
                answers: { has_file: 'yes' },
                nextStepId: 'await_file_upload'
              };
            }

            return {
              answers: { has_file: 'no' },
              nextStepId: 'ask_size'
            };
          }
        },
        await_file_upload: {
          input: 'file',
          prompt: FLOW_TEXT.fileIntro,
          skipAiReply: true,
          autoOpenFilePicker: true,
          onFiles: function (ctx) {
            return {
              answers: { has_file: 'yes' },
              uploadedFiles: ctx.attachments,
              nextStepId: 'ask_size'
            };
          }
        },
        ask_size: {
          input: 'text',
          prompt: FLOW_TEXT.askSize,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { size: ctx.text },
              nextStepId: 'ask_contact'
            };
          }
        },
        ask_contact: buildContactChoiceStep(FLOW_TEXT.priceAskContact),
        collect_contact_telegram: {
          input: 'text',
          prompt: FLOW_TEXT.contactTelegram,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'telegram', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.priceFinal
            };
          }
        },
        collect_contact_phone: {
          input: 'text',
          prompt: FLOW_TEXT.contactPhone,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'phone', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.priceFinal
            };
          }
        },
        ...buildOperatorDecisionSteps(FLOW_TEXT.priceFinal)
      }
    },
    print_time: {
      startStepId: 'ask_name',
      handoffOnComplete: true,
      steps: {
        ask_name: {
          input: 'text',
          prompt: FLOW_TEXT.askName,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { name: ctx.text },
              nextStepId: 'ask_object_description'
            };
          }
        },
        ask_object_description: {
          input: 'text',
          prompt: function (session) {
            return `Приємно познайомитись, ${session.collectedAnswers.name || 'друже'}! ${FLOW_TEXT.printAskObject}`;
          },
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { object_description: ctx.text },
              nextStepId: 'ask_file'
            };
          }
        },
        ask_file: {
          input: 'choice',
          prompt: FLOW_TEXT.askFile,
          skipAiReply: true,
          acceptsDirectFiles: true,
          actions: [
            buildChoiceAction('📎 Завантажити файл', 'upload_file'),
            buildChoiceAction('❌ Файлу немає', 'no_file')
          ],
          onChoice: function (ctx) {
            if (ctx.value === 'upload_file') {
              return {
                answers: { has_file: 'yes' },
                nextStepId: 'await_file_upload'
              };
            }

            return {
              answers: { has_file: 'no' },
              nextStepId: 'ask_size'
            };
          }
        },
        await_file_upload: {
          input: 'file',
          prompt: FLOW_TEXT.fileIntro,
          skipAiReply: true,
          autoOpenFilePicker: true,
          onFiles: function (ctx) {
            return {
              answers: { has_file: 'yes' },
              uploadedFiles: ctx.attachments,
              nextStepId: 'ask_size'
            };
          }
        },
        ask_size: {
          input: 'text',
          prompt: FLOW_TEXT.askSize,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { size: ctx.text },
              nextStepId: 'share_time_range'
            };
          }
        },
        share_time_range: {
          input: 'none',
          prompt: FLOW_TEXT.printTimeInfo,
          nextStepId: 'ask_contact'
        },
        ask_contact: buildContactChoiceStep(FLOW_TEXT.printAskContact),
        collect_contact_telegram: {
          input: 'text',
          prompt: FLOW_TEXT.contactTelegram,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'telegram', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.printFinal
            };
          }
        },
        collect_contact_phone: {
          input: 'text',
          prompt: FLOW_TEXT.contactPhone,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'phone', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.printFinal
            };
          }
        },
        ...buildOperatorDecisionSteps(FLOW_TEXT.printFinal)
      }
    },
    file_upload: {
      startStepId: 'request_file',
      handoffOnComplete: true,
      steps: {
        request_file: {
          input: 'file',
          prompt: FLOW_TEXT.fileIntro,
          skipAiReply: true,
          autoOpenFilePicker: true,
          onFiles: function (ctx) {
            return {
              uploadedFiles: ctx.attachments,
              nextStepId: 'ask_name'
            };
          }
        },
        ask_name: {
          input: 'text',
          prompt: FLOW_TEXT.fileAskName,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { name: ctx.text },
              nextStepId: 'ask_object_description'
            };
          }
        },
        ask_object_description: {
          input: 'text',
          prompt: FLOW_TEXT.fileAskDescription,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { object_description: ctx.text },
              nextStepId: 'ask_goal'
            };
          }
        },
        ask_goal: {
          input: 'choice',
          prompt: FLOW_TEXT.fileAskGoal,
          skipAiReply: true,
          actions: [
            buildChoiceAction('💰 Порахувати ціну', 'price'),
            buildChoiceAction('⏱ Дізнатись термін', 'time'),
            buildChoiceAction('✅ Перевірити модель', 'check_model'),
            buildChoiceAction('🛠 Інше', 'other')
          ],
          onChoice: function (ctx) {
            return {
              answers: { file_goal: ctx.label },
              nextStepId: 'ask_contact'
            };
          }
        },
        ask_contact: buildContactChoiceStep(FLOW_TEXT.fileAskContact),
        collect_contact_telegram: {
          input: 'text',
          prompt: FLOW_TEXT.contactTelegram,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'telegram', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.fileFinal
            };
          }
        },
        collect_contact_phone: {
          input: 'text',
          prompt: FLOW_TEXT.contactPhone,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'phone', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText: FLOW_TEXT.fileFinal
            };
          }
        },
        ...buildOperatorDecisionSteps(FLOW_TEXT.fileFinal)
      }
    },
    general_question: {
      startStepId: 'ask_question',
      handoffOnComplete: true,
      steps: {
        ask_question: {
          input: 'text',
          prompt: FLOW_TEXT.questionIntro,
          skipAiReply: false,
          onText: function (ctx) {
            const assistantBefore = countAssistantMessages(ctx.beforeMessages);
            const assistantAfter = countAssistantMessages(ctx.afterMessages);
            return {
              answers: { free_question: ctx.text },
              followUpMessages:
                assistantAfter <= assistantBefore
                  ? [FLOW_TEXT.questionFallback]
                  : [],
              nextStepId: 'ask_name'
            };
          }
        },
        ask_name: {
          input: 'text',
          prompt: FLOW_TEXT.questionAskName,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { name: ctx.text },
              nextStepId: 'ask_contact'
            };
          }
        },
        ask_contact: buildContactChoiceStep(FLOW_TEXT.questionAskContact),
        collect_contact_telegram: {
          input: 'text',
          prompt: FLOW_TEXT.contactTelegram,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'telegram', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText:
                'Дякуємо! Ми зберегли ваше питання і, за потреби, передамо менеджеру для продовження.'
            };
          }
        },
        collect_contact_phone: {
          input: 'text',
          prompt: FLOW_TEXT.contactPhone,
          skipAiReply: true,
          onText: function (ctx) {
            return {
              answers: { contact_type: 'phone', contact_value: ctx.text },
              completeFlow: true,
              finalConfirmationText:
                'Дякуємо! Ми зберегли ваше питання і, за потреби, передамо менеджеру для продовження.'
            };
          }
        },
        ...buildOperatorDecisionSteps(
          'Дякуємо! Ми зберегли ваше питання і, за потреби, передамо менеджеру для продовження.'
        )
      }
    },
    repair: createFutureLeadFlow({
      askName: 'Розкажіть, як вас звати, щоб я відкрив заявку на ремонт деталі.',
      askDetails: 'Що саме зламалось або потребує ремонту?',
      askContact: 'Можете залишити Telegram або телефон для зв’язку щодо ремонту?',
      finalText: 'Дякуємо! Ми зберегли заявку на ремонт і зв’яжемось найближчим часом.'
    }),
    design: createFutureLeadFlow({
      askName: 'Як вас звати? Підготую коротку заявку на 3D дизайн.',
      askDetails: 'Опишіть, будь ласка, що саме потрібно спроєктувати.',
      askContact: 'Залиште Telegram або телефон, щоб ми могли відповісти по 3D дизайну.',
      finalText: 'Дякуємо! Ми зберегли запит на 3D дизайн і повернемось із відповіддю.'
    }),
    idea: createFutureLeadFlow({
      askName: 'Скажіть, як вас звати, і я допоможу оформити вашу ідею.',
      askDetails: 'Опишіть ідею або задачу, яку хочете реалізувати.',
      askContact: 'Можете залишити Telegram або телефон, щоб ми повернулись із пропозиціями?',
      finalText: 'Дякуємо! Ми зберегли вашу ідею і зв’яжемось із наступними кроками.'
    }),
    batch: createFutureLeadFlow({
      askName: 'Як вас звати? Підготую заявку на партійне виробництво.',
      askDetails: 'Яка саме партія вас цікавить і що потрібно виготовити?',
      askContact: 'Залиште Telegram або телефон для уточнення партійного замовлення.',
      finalText: 'Дякуємо! Ми зберегли запит на партію і повернемось із розрахунком.'
    })
  };

  const state = {
    visitorId: '',
    conversationId: '',
    conversation: null,
    messages: [],
    flowSession: createEmptyFlowSession(),
    stream: null,
    syncTimer: null,
    streamRetryTimer: null,
    initialized: false,
    loading: false,
    isTyping: false,
    pendingTimeoutId: 0,
    pendingFilePickerTimeoutId: 0,
    flowRunId: 0,
    pendingFileStepId: '',
    pendingUploadSourceStepId: '',
    localMessageCounter: 0,
    messageOrderCounter: 0
  };
  const SYNC_INTERVAL_MS = 7000;
  const STREAM_RETRY_DELAY_MS = 2500;

  function getSavedState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        visitorId: state.visitorId,
        conversationId: state.conversationId,
        isOpen: widget.classList.contains('is-open'),
        flowSession: state.flowSession
      })
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, '<br />');
  }

  function randomDelay() {
    return Math.floor(Math.random() * (FLOW_DELAY_MAX_MS - FLOW_DELAY_MIN_MS + 1)) + FLOW_DELAY_MIN_MS;
  }

  function getNowIso() {
    return new Date().toISOString();
  }

  function normalizeLanguage(value) {
    return String(config.language || value || '').toLowerCase().startsWith('en') ? 'en' : 'uk';
  }

  function getMessageTimestamp(message) {
    const timestamp = Date.parse(message.timestamp || message.createdAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getMessageOrder(message) {
    return Number(message.order) || 0;
  }

  function sortMessages(messages) {
    return messages.slice().sort(function (left, right) {
      const orderDiff = getMessageOrder(left) - getMessageOrder(right);
      if (orderDiff !== 0) return orderDiff;
      const timeDiff = getMessageTimestamp(left) - getMessageTimestamp(right);
      if (timeDiff !== 0) return timeDiff;
      return String(left.id || '').localeCompare(String(right.id || ''));
    });
  }

  function mapSender(senderType) {
    return senderType === 'visitor' ? 'user' : 'bot';
  }

  function messageFingerprint(message) {
    const attachments = Array.isArray(message.attachments)
      ? message.attachments.map(function (file) { return String(file.fileName || '').trim().toLowerCase(); }).sort().join('|')
      : '';
    return [
      message.sender || mapSender(message.senderType || ''),
      String(message.text || '').trim(),
      String(message.type || message.messageType || 'text'),
      attachments
    ].join('::');
  }

  function normalizeMessage(message, overrides) {
    const next = Object.assign({}, message, overrides || {});
    const senderType = String(next.senderType || (next.sender === 'user' ? 'visitor' : 'ai'));
    const sender = next.sender || mapSender(senderType);
    const type = String(next.type || next.messageType || 'text');
    const timestamp = next.timestamp || next.createdAt || getNowIso();
    const order = Number(next.order) || ++state.messageOrderCounter;

    return Object.assign({}, next, {
      senderType,
      sender,
      type,
      messageType: type,
      timestamp,
      createdAt: timestamp,
      order,
      attachments: Array.isArray(next.attachments) ? next.attachments : []
    });
  }

  function getServerMessages() {
    return state.messages.filter(function (message) {
      return !message.localOnly;
    });
  }

  function getLocalOnlyMessages() {
    return state.messages.filter(function (message) {
      return message.localOnly;
    });
  }

  function getServerWelcomeMessage() {
    const serverMessages = getServerMessages();
    const firstMessage = serverMessages[0];
    if (!firstMessage) return null;
    return firstMessage.senderType === 'ai' ? firstMessage : null;
  }

  function hasConversationStarted() {
    const serverMessages = getServerMessages();
    const welcomeMessage = getServerWelcomeMessage();

    if (state.flowSession.activeFlow) {
      return true;
    }

    if (getLocalOnlyMessages().length > 0) {
      return true;
    }

    return serverMessages.some(function (message) {
      if (welcomeMessage && String(message.id) === String(welcomeMessage.id)) {
        return false;
      }
      return message.senderType === 'visitor' || message.senderType === 'operator' || message.senderType === 'system' || message.senderType === 'ai';
    });
  }

  function shouldShowWelcomeMessage() {
    return !hasConversationStarted();
  }

  function getVisibleMessages() {
    const welcomeMessage = getServerWelcomeMessage();
    const allowWelcome = shouldShowWelcomeMessage();
    const visibleMessages = state.messages.filter(function (message) {
      if (!message.isFlowMessage) {
        return true;
      }
      return !state.flowSession.activeFlow || message.flowId === state.flowSession.activeFlow;
    });
    return sortMessages(visibleMessages.filter(function (message) {
      if (welcomeMessage && String(message.id) === String(welcomeMessage.id)) {
        return allowWelcome;
      }
      return true;
    }));
  }

  function getFlowDefinition(flowId) {
    const cleanId = String(flowId || '').trim();
    return CONFIGURED_FLOW_DEFINITIONS[cleanId] || FLOW_DEFINITIONS[cleanId] || null;
  }

  function getActiveFlowDefinition() {
    return getFlowDefinition(state.flowSession.activeFlow);
  }

  function getCurrentStepDefinition() {
    const flow = getActiveFlowDefinition();
    if (!flow) return null;
    return flow.steps[state.flowSession.currentStep] || null;
  }

  function getFlowStepStatus(stepId) {
    const cleanStepId = String(stepId || '').trim();
    if (!cleanStepId) return '';
    const stepState =
      state.flowSession && state.flowSession.stepState && typeof state.flowSession.stepState === 'object'
        ? state.flowSession.stepState
        : {};
    return String(stepState[cleanStepId] || '').trim();
  }

  function setFlowStepStatus(stepId, status) {
    const cleanStepId = String(stepId || '').trim();
    if (!cleanStepId) return;

    const nextStepState = Object.assign({}, state.flowSession.stepState || {});
    if (status) {
      nextStepState[cleanStepId] = status;
    } else {
      delete nextStepState[cleanStepId];
    }

    updateFlowSession({ stepState: nextStepState });
  }

  function updateFlowSession(patch) {
    state.flowSession = Object.assign({}, state.flowSession, patch, {
      updatedAt: getNowIso(),
      conversationId: state.conversationId || state.flowSession.conversationId || ''
    });
    saveState();
    updateInputPlaceholder();
  }

  function resetFlowSession() {
    state.flowSession = createEmptyFlowSession();
    saveState();
    updateInputPlaceholder();
  }

  function autoResizeInput() {
    input.style.height = '0px';
    input.style.height = Math.min(input.scrollHeight, 132) + 'px';
  }

  function setOpen(isOpen) {
    widget.classList.toggle('is-open', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));
    launcher.setAttribute('aria-expanded', String(isOpen));
    saveState();
  }

  function setTyping(isTyping) {
    state.isTyping = Boolean(isTyping);
    typingEl.hidden = !state.isTyping;
    typingEl.setAttribute('aria-hidden', String(!state.isTyping));
  }

  function renderStatus() {
    const status = String(state.conversation?.status || 'ai');
    widget.dataset.chatState = status;
    if (status === 'human') {
      statusTextEl.textContent = STATUS_LABELS.human;
      return;
    }
    if (status === 'closed') {
      statusTextEl.textContent = STATUS_LABELS.closed;
      return;
    }
    statusTextEl.textContent = STATUS_LABELS.ai;
  }

  function hasOnlyWelcomeMessage() {
    const visibleMessages = getVisibleMessages();
    return shouldShowWelcomeMessage() && visibleMessages.length <= 1;
  }

  function isActionActiveForMessage(message) {
    return Boolean(
      message &&
      message.actions &&
      message.actions.length > 0 &&
      message.flowId === state.flowSession.activeFlow &&
      getFlowStepStatus(message.stepId) === 'pending'
    );
  }

  function renderQuickActions() {
    quickActionsEl.innerHTML = '';
    if (!hasOnlyWelcomeMessage() || !widget.classList.contains('is-open') || state.flowSession.activeFlow) {
      quickActionsEl.hidden = true;
      quickActionsEl.setAttribute('aria-hidden', 'true');
      return;
    }

    quickActionsEl.hidden = false;
    quickActionsEl.setAttribute('aria-hidden', 'false');
    quickActionsEl.innerHTML = QUICK_ACTIONS.map(function (item) {
      const flowId = String(item.flowId || QUICK_ACTION_FLOW_MAP[String(item.key || '').trim().toLowerCase()] || '').trim();
      return `
        <button class="pf-chat-quick-action" type="button" data-flow-id="${escapeHtml(flowId)}">
          <span class="pf-chat-quick-icon">${item.icon}</span>
          <span>${escapeHtml(item.label)}</span>
        </button>
      `;
    }).join('');
  }

  function renderInlineActions(message) {
    if (!Array.isArray(message.actions) || message.actions.length === 0) {
      return '';
    }

    const isActive = isActionActiveForMessage(message);
    if (!isActive) {
      return '';
    }

    return `
      <div class="pf-chat-inline-actions">
        ${message.actions
          .map(function (action) {
            return `
              <button
                class="pf-chat-inline-action"
                type="button"
                data-action-kind="${escapeHtml(action.kind || 'flow-choice')}"
                data-value="${escapeHtml(action.value || '')}"
                data-label="${escapeHtml(action.label || '')}"
                data-step-id="${escapeHtml(message.stepId || '')}"
                data-flow-id="${escapeHtml(message.flowId || '')}"
              >
                ${escapeHtml(action.label || '')}
              </button>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function renderMessage(message, index) {
    const senderType = escapeHtml(message.senderType || 'system');
    const isAiLike = senderType === 'ai' || senderType === 'operator' || senderType === 'system';
    const welcomeMessage = getServerWelcomeMessage();
    const isWelcome =
      Boolean(welcomeMessage) &&
      shouldShowWelcomeMessage() &&
      senderType === 'ai' &&
      String(message.id || '') === String(welcomeMessage.id || '');
    const attachments = Array.isArray(message.attachments)
      ? message.attachments
          .map(function (file) {
            return `
              <a class="pf-chat-attachment" href="${escapeHtml(file.publicUrl || '#')}" target="_blank" rel="noopener noreferrer">
                <span class="pf-chat-attachment-icon">📎</span>
                <span>${escapeHtml(file.fileName || 'file')}</span>
              </a>
            `;
          })
          .join('')
      : '';
    const operatorDisplayName = String(message.senderName || MANAGER_NAME || 'Operator').trim();
    const operatorAvatarContent = MANAGER_AVATAR_URL
      ? `<img class="pf-chat-avatar-photo" src="${escapeHtml(MANAGER_AVATAR_URL)}" alt="${escapeHtml(operatorDisplayName)} avatar" />`
      : escapeHtml(getInitials(operatorDisplayName, MANAGER_NAME));

    const avatar = isAiLike
      ? isWelcome
        ? `
          <div class="pf-chat-avatar pf-chat-avatar-welcome" aria-hidden="true">
            ${
              avatarUrl
                ? `<img class="pf-chat-avatar-photo" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(BOT_TITLE)} avatar" />`
                : '<span class="pf-chat-avatar-face">🙂</span>'
            }
          </div>
        `
        : `
          <div class="pf-chat-avatar" aria-hidden="true">
            ${
              senderType === 'operator'
                ? operatorAvatarContent
                : avatarUrl
                  ? `<img class="pf-chat-avatar-photo" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(BOT_TITLE)} avatar" />`
                  : 'PF'
            }
          </div>
        `
      : '';

    const meta =
      senderType === 'operator'
        ? `<span class="pf-chat-bubble-meta"><strong>${escapeHtml(operatorDisplayName)}</strong><span>${escapeHtml(OPERATOR_META_LABEL)}</span></span>`
        : senderType === 'ai'
          ? `<span class="pf-chat-bubble-meta">${escapeHtml(isWelcome ? WELCOME_INTRO_LABEL : BOT_META_LABEL)}</span>`
          : '';

    const content = message.text
        ? `<p>${nl2br(message.text)}</p>`
        : '';

    return `
      <article class="pf-chat-message pf-chat-message-${senderType} ${isWelcome ? 'pf-chat-message-welcome' : ''}">
        ${avatar}
        <div class="pf-chat-bubble">
          ${meta}
          ${content}
          ${renderInlineActions(message)}
          ${attachments}
        </div>
      </article>
    `;
  }

  function renderMessages() {
    const visibleMessages = getVisibleMessages();
    widget.dataset.chatStage = hasOnlyWelcomeMessage() ? 'intro' : 'conversation';
    messagesEl.innerHTML = visibleMessages.map(renderMessage).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
    renderStatus();
    renderQuickActions();
  }

  function updateInputPlaceholder() {
    input.placeholder = DEFAULT_PLACEHOLDER;
  }

  function addLocalMessage(message) {
    state.localMessageCounter += 1;
    state.messages.push(normalizeMessage(message, {
      id: `local-${state.localMessageCounter}-${Date.now()}`,
      senderType: message.senderType || 'ai',
      senderName: message.senderName || BOT_TITLE,
      localOnly: true,
      isFlowMessage: message.isFlowMessage !== false
    }));
    saveState();
    renderMessages();
  }

  function addUserMessage(message) {
    state.localMessageCounter += 1;
    state.messages.push(normalizeMessage(message, {
      id: `local-user-${state.localMessageCounter}-${Date.now()}`,
      sender: 'user',
      senderType: 'visitor',
      senderName: 'Visitor',
      localOnly: true,
      isFlowMessage: Boolean(state.flowSession.activeFlow),
      flowId: message.flowId || state.flowSession.activeFlow || '',
      stepId: message.stepId || state.flowSession.currentStep || ''
    }));
    saveState();
    renderMessages();
  }

  function clearPendingBotTimers() {
    if (state.pendingTimeoutId) {
      window.clearTimeout(state.pendingTimeoutId);
      state.pendingTimeoutId = 0;
    }
    if (state.pendingFilePickerTimeoutId) {
      window.clearTimeout(state.pendingFilePickerTimeoutId);
      state.pendingFilePickerTimeoutId = 0;
    }
    state.flowRunId += 1;
    state.pendingFileStepId = '';
    state.pendingUploadSourceStepId = '';
    setTyping(false);
  }

  function clearLocalFlowMessages() {
    state.messages = state.messages.filter(function (message) {
      return !message.isFlowMessage;
    });
    saveState();
    renderMessages();
  }

  function enqueueBotMessage(message) {
    const runId = state.flowRunId;
    return new Promise(function (resolve) {
      setTyping(true);
      state.pendingTimeoutId = window.setTimeout(function () {
        state.pendingTimeoutId = 0;
        if (runId !== state.flowRunId) {
          resolve(false);
          return;
        }
        setTyping(false);
        const nextMessage = Object.assign({}, message, {
          type: message.type || message.messageType || 'flow',
          messageType: message.type || message.messageType || 'flow'
        });
        addLocalMessage(nextMessage);
        postVisitorMessage({
          text: '',
          files: [],
          clientContext: buildFlowContext(getCurrentStepDefinition(), {
            skipAiReply: true,
            flowMessages: [
              {
                senderType: nextMessage.senderType || 'ai',
                senderName: nextMessage.senderName || BOT_TITLE,
                text: nextMessage.text || '',
                messageType: nextMessage.messageType
              }
            ]
          }),
          showPendingTyping: false
        }).then(function () {
          resolve(true);
        }).catch(function (error) {
          console.error(error);
          resolve(false);
        });
      }, randomDelay());
    });
  }

  function pruneLocalStepMessages(stepId) {
    if (!stepId) return;
    state.messages = state.messages.filter(function (message) {
      return message.stepId !== stepId;
    });
    saveState();
  }

  function resolvePrompt(step, session) {
    return typeof step.prompt === 'function' ? step.prompt(session) : step.prompt;
  }

  function resolveActions(step, session) {
    const actions = typeof step.actions === 'function' ? step.actions(session) : step.actions;
    return Array.isArray(actions) ? actions : [];
  }

  async function showFlowStep(stepId) {
    const flow = getActiveFlowDefinition();
    if (!flow || !flow.steps[stepId]) {
      return;
    }

    const step = flow.steps[stepId];
    updateFlowSession({
      currentStep: stepId,
      waitingFor: step.input || '',
      language: state.flowSession.language || 'uk',
      conversationId: state.conversationId
    });

    pruneLocalStepMessages(stepId);
    const prompt = resolvePrompt(step, state.flowSession);
    const actions = resolveActions(step, state.flowSession);

    if (step.input === 'choice') {
      setFlowStepStatus(stepId, 'pending');
    } else {
      setFlowStepStatus(stepId, '');
    }

    if (prompt || actions.length > 0) {
      const delivered = await enqueueBotMessage({
        text: prompt,
        actions,
        flowId: state.flowSession.activeFlow,
        stepId
      });
      if (!delivered) {
        return;
      }
    }

    if (step.autoOpenFilePicker) {
      state.pendingFileStepId = stepId;
      const runId = state.flowRunId;
      state.pendingFilePickerTimeoutId = window.setTimeout(function () {
        state.pendingFilePickerTimeoutId = 0;
        if (runId !== state.flowRunId) {
          return;
        }
        if (state.flowSession.currentStep === stepId) {
          filesInput.click();
        }
      }, 120);
    }

    if (step.input === 'none') {
      if (step.nextStepId) {
        await showFlowStep(step.nextStepId);
        return;
      }
      if (step.completeFlow) {
        await completeActiveFlow(step.finalConfirmationText || 'Дякуємо! Ми отримали вашу заявку.');
        return;
      }
    }

    updateInputPlaceholder();
    autoResizeInput();
    input.focus({ preventScroll: true });
  }

  function countAssistantMessages(messages) {
    return (messages || []).filter(function (message) {
      return message.senderType === 'ai' || message.senderType === 'system' || message.senderType === 'operator';
    }).length;
  }

  function extractLatestVisitorAttachments(messages) {
    const allMessages = Array.isArray(messages) ? messages.slice() : [];
    for (let index = allMessages.length - 1; index >= 0; index -= 1) {
      const message = allMessages[index];
      if (message.senderType === 'visitor' && Array.isArray(message.attachments) && message.attachments.length > 0) {
        return message.attachments;
      }
    }
    return [];
  }

  function buildFlowContext(step, overrides) {
    const flow = getActiveFlowDefinition();
    return Object.assign(
      {
        flowType: state.flowSession.activeFlow,
        skipAiReply: step && step.skipAiReply !== false,
        flowState: {
          activeFlow: state.flowSession.activeFlow,
          currentStep: state.flowSession.currentStep,
          collectedAnswers: state.flowSession.collectedAnswers,
          uploadedFiles: state.flowSession.uploadedFiles,
          language: state.flowSession.language,
          conversationId: state.conversationId
        },
        handoffReady: false
      },
      overrides || {},
      {
        flowType: flow ? state.flowSession.activeFlow : ''
      }
    );
  }

  function updateConversationState(payload) {
    const localOnlyMessages = getLocalOnlyMessages();
    const localByFingerprint = new Map(
      localOnlyMessages.map(function (message) {
        return [messageFingerprint(message), message];
      })
    );
    const serverFingerprints = new Set(
      (payload.messages || []).map(function (message) {
        return messageFingerprint(message);
      })
    );

    const existingServerMessages = new Map(
      getServerMessages().map(function (message) {
        return [String(message.id || ''), message];
      })
    );

    const nextServerMessages = (payload.messages || []).map(function (message) {
      const existing = existingServerMessages.get(String(message.id || ''));
      const localMatch = localByFingerprint.get(messageFingerprint(message));
      const metadataSource = localMatch || existing;
      return normalizeMessage(message, Object.assign({
        localOnly: false,
        isFlowMessage: false,
        order: existing ? existing.order : undefined
      }, metadataSource ? {
        actions: Array.isArray(metadataSource.actions) ? metadataSource.actions : [],
        flowId: metadataSource.flowId || '',
        stepId: metadataSource.stepId || '',
        isFlowMessage: metadataSource.isFlowMessage === true
      } : {}));
    });

    state.conversation = payload.conversation;
    state.messages = sortMessages(
      nextServerMessages.concat(
        localOnlyMessages.filter(function (message) {
          return !serverFingerprints.has(messageFingerprint(message));
        })
      )
    );
    saveState();
    renderMessages();
  }

  function hasServerMessage(messageId) {
    return getServerMessages().some(function (message) {
      return String(message.id || '') === String(messageId || '');
    });
  }

  function addPendingTyping() {
    if (String(state.conversation?.status || 'ai') !== 'ai') {
      return;
    }
    setTyping(true);
  }

  async function postVisitorMessage(options) {
    if (!state.conversationId) {
      throw new Error('Chat session is not ready');
    }

    const text = String(options.text || '').trim();
    const files = Array.isArray(options.files) ? options.files : [];
    const formData = new FormData();
    formData.append('siteId', siteId);
    formData.append('conversationId', state.conversationId);
    formData.append('visitorId', state.visitorId);
    formData.append('senderType', 'visitor');
    formData.append('text', text);
    formData.append('sourcePage', window.location.pathname + window.location.search);

    if (options.clientContext) {
      formData.append('clientContext', JSON.stringify(options.clientContext));
    }

    files.forEach(function (file) {
      formData.append('files', file);
    });

    state.loading = true;
    if (options.showPendingTyping) {
      addPendingTyping();
    }
    fileHintEl.textContent =
      files.length > 0 ? `Надсилаємо ${files.length} файл(ів)...` : 'Надсилаємо повідомлення...';

    try {
      const response = await fetch(`${apiBase}/messages`, {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Send failed');
      }
      updateConversationState(payload);
      return payload;
    } catch (error) {
      setTyping(false);
      fileHintEl.textContent = error.message || 'Не вдалося надіслати повідомлення';
      throw error;
    } finally {
      state.loading = false;
      window.setTimeout(function () {
        fileHintEl.textContent = DEFAULT_HINT;
      }, 1600);
    }
  }

  function validateFiles(files) {
    if (!files.length) {
      return null;
    }

    if (files.length > MAX_CHAT_FILES) {
      return `Можна надіслати до ${MAX_CHAT_FILES} файлів за раз.`;
    }

    for (const file of files) {
      const lowerName = String(file.name || '').toLowerCase();
      const hasAllowedExtension = ALLOWED_EXTENSIONS.some(function (ext) {
        return lowerName.endsWith(ext);
      });
      if (!hasAllowedExtension) {
        return 'Підтримуються STL, 3MF, OBJ, ZIP, JPG, PNG та PDF файли.';
      }
      if (Number(file.size) > MAX_FILE_SIZE_BYTES) {
        return 'Файл завеликий. Максимальний розмір: 20 MB.';
      }
    }

    return null;
  }

  function appendFlowUserMessage(summary) {
    const current = Array.isArray(state.flowSession.userMessages) ? state.flowSession.userMessages.slice() : [];
    current.push(summary);
    updateFlowSession({ userMessages: current });
  }

  function getChoiceMessageText(label, value) {
    const raw = String(label || value || '').trim();
    const clean = raw.replace(/^[^0-9A-Za-zА-Яа-яІіЇїЄєҐґ@+#]+/u, '').trim();
    return clean || raw;
  }

  function applyFlowOutcome(result) {
    if (!result) return;

    const nextAnswers = Object.assign({}, state.flowSession.collectedAnswers, result.answers || {});
    const nextUploadedFiles = state.flowSession.uploadedFiles
      .concat(Array.isArray(result.uploadedFiles) ? result.uploadedFiles : [])
      .filter(Boolean);

    updateFlowSession({
      collectedAnswers: nextAnswers,
      uploadedFiles: nextUploadedFiles
    });
  }

  function buildLeadSummary(flowId) {
    const answers = state.flowSession.collectedAnswers || {};
    const uploadedFiles = state.flowSession.uploadedFiles || [];
    const fileNames = uploadedFiles.map(function (file) {
      return String(file.fileName || '').trim();
    }).filter(Boolean);

    return {
      conversationId: state.conversationId,
      flowType: flowId,
      name: answers.name || '',
      objectDescription: answers.object_description || '',
      size: answers.size || '',
      hasFile: answers.has_file === 'yes' || uploadedFiles.length > 0,
      fileNames,
      uploadedFiles,
      fileGoal: answers.file_goal || '',
      freeQuestion: answers.free_question || '',
      contact: {
        type: answers.contact_type || '',
        value: answers.contact_value || ''
      },
      userMessages: state.flowSession.userMessages || []
    };
  }

  function formatLeadSummary(summary) {
    const contact = summary.contact && summary.contact.value
      ? `${summary.contact.type || 'contact'}: ${summary.contact.value}`
      : 'не вказано';

    return [
      'Lead summary',
      `conversation ID: ${summary.conversationId || '-'}`,
      `flow type: ${summary.flowType || '-'}`,
      `name: ${summary.name || '-'}`,
      `object description: ${summary.objectDescription || '-'}`,
      `size: ${summary.size || '-'}`,
      `file uploaded: ${summary.hasFile ? 'yes' : 'no'}`,
      `file names: ${summary.fileNames.length > 0 ? summary.fileNames.join(', ') : '-'}`,
      `file goal: ${summary.fileGoal || '-'}`,
      `question: ${summary.freeQuestion || '-'}`,
      `contact: ${contact}`,
      `user messages: ${(summary.userMessages || []).join(' | ') || '-'}`
    ].join('\n');
  }

  async function completeActiveFlow(finalConfirmationText, options) {
    const flowId = state.flowSession.activeFlow;
    const flow = getActiveFlowDefinition();
    if (!flowId || !flow) {
      return;
    }

    const summary = buildLeadSummary(flowId);
    const shouldRequestHumanHandoff =
      options && Object.prototype.hasOwnProperty.call(options, 'requestHumanHandoff')
        ? Boolean(options.requestHumanHandoff)
        : flow.handoffOnComplete !== false;

    await postVisitorMessage({
      text: '',
      files: [],
      clientContext: {
        requestHumanHandoff: shouldRequestHumanHandoff,
        assignedTo: 'telegram',
        confirmationText: shouldRequestHumanHandoff ? finalConfirmationText : '',
        leadSummary: summary,
        flowType: flowId,
        skipAiReply: true,
        flowMessages: !shouldRequestHumanHandoff && finalConfirmationText
          ? [
              {
                senderType: 'ai',
                senderName: BOT_TITLE,
                text: finalConfirmationText,
                messageType: 'flow'
              }
            ]
          : [],
        flowState: {
          activeFlow: flowId,
          currentStep: state.flowSession.currentStep,
          collectedAnswers: state.flowSession.collectedAnswers,
          uploadedFiles: state.flowSession.uploadedFiles,
          language: state.flowSession.language,
          conversationId: state.conversationId
        }
      },
      showPendingTyping: false
    });

    updateFlowSession({
      activeFlow: '',
      currentStep: '',
      stepState: {},
      waitingFor: '',
      handoffReady: true,
      leadSummary: summary
    });
  }

  async function continueFlow(result) {
    if (!result) {
      return;
    }

    applyFlowOutcome(result);

    if (Array.isArray(result.followUpMessages) && result.followUpMessages.length > 0) {
      for (const text of result.followUpMessages) {
        await enqueueBotMessage({
          text,
          flowId: state.flowSession.activeFlow,
          stepId: state.flowSession.currentStep
        });
      }
    }

    if (result.completeFlow) {
      await completeActiveFlow(result.finalConfirmationText || 'Дякуємо! Ми отримали вашу заявку.', {
        requestHumanHandoff: result.requestHumanHandoff
      });
      return;
    }

    if (result.nextStepId) {
      await showFlowStep(result.nextStepId);
    }
  }

  async function handleFlowFallback(text, files) {
    const step = getCurrentStepDefinition();
    if (text || files.length > 0) {
      addUserMessage({
        text,
        attachments: files.map(function (file) {
          return { fileName: file.name || 'file', publicUrl: '#', fileSize: Number(file.size) || 0 };
        }),
        type: files.length > 0 && !text ? 'file' : 'text'
      });
    }
    await postVisitorMessage({
      text,
      files,
      clientContext: buildFlowContext(step, { skipAiReply: true }),
      showPendingTyping: false
    });

    if (!step) {
      return;
    }

    await enqueueBotMessage({
      text: 'Я збережу це повідомлення. Щоб продовжити заявку, повернімось до поточного кроку.',
      actions: resolveActions(step, state.flowSession),
      flowId: state.flowSession.activeFlow,
      stepId: state.flowSession.currentStep
    });
  }

  async function handleFlowText(text) {
    const step = getCurrentStepDefinition();
    if (!step || step.input !== 'text') {
      await handleFlowFallback(text, []);
      return;
    }

    addUserMessage({ text, type: 'text' });
    const beforeMessages = getServerMessages().slice();
    const payload = await postVisitorMessage({
      text,
      files: [],
      clientContext: buildFlowContext(step, { visitorMessageType: 'text' }),
      showPendingTyping: step.skipAiReply === false
    });

    appendFlowUserMessage(text);
    const result = step.onText
      ? step.onText({
          text,
          beforeMessages,
          afterMessages: payload.messages || [],
          payload,
          session: state.flowSession
        })
      : null;

    await continueFlow(result);
  }

  async function handleFlowChoice(value, label, overrideStepId) {
    const stepId = String(overrideStepId || state.flowSession.currentStep || '').trim();
    const flow = getActiveFlowDefinition();
    const step = flow && flow.steps ? flow.steps[stepId] : null;
    if (!step || step.input !== 'choice') {
      return;
    }

    if (getFlowStepStatus(stepId) !== 'pending') {
      return;
    }

    if (stepId !== state.flowSession.currentStep) {
      updateFlowSession({ currentStep: stepId });
    }

    const choiceLabel = getChoiceMessageText(label, value);
    addUserMessage({ text: choiceLabel, type: 'quick_action', flowId: state.flowSession.activeFlow, stepId: stepId });
    await postVisitorMessage({
      text: choiceLabel,
      files: [],
      clientContext: buildFlowContext(step, { visitorMessageType: 'quick_action' }),
      showPendingTyping: false
    });

    appendFlowUserMessage(choiceLabel);
    const result = step.onChoice
      ? step.onChoice({
          value,
          label: choiceLabel,
          session: state.flowSession
        })
      : null;

    if (value === 'upload_file' && result && result.nextStepId) {
      state.pendingFileStepId = String(result.nextStepId || '').trim();
      state.pendingUploadSourceStepId = stepId;
      updateFlowSession({ waitingFor: 'file' });
      fileHintEl.textContent = 'Оберіть файл для завантаження';
      filesInput.click();
      return;
    }

    state.pendingFileStepId = '';
    state.pendingUploadSourceStepId = '';
    setFlowStepStatus(stepId, 'answered');
    await continueFlow(result);
  }

  async function handleFlowFiles(files, overrideStepId) {
    const stepId = overrideStepId || state.pendingFileStepId || state.flowSession.currentStep;
    const flow = getActiveFlowDefinition();
    const step = flow && flow.steps ? flow.steps[stepId] : null;
    const sourceChoiceStepId = String(
      state.pendingUploadSourceStepId ||
      ((state.flowSession.currentStep && state.flowSession.currentStep !== stepId) ? state.flowSession.currentStep : '')
    ).trim();

    if (!step) {
      await handleFlowFallback('', files);
      return;
    }

    if (sourceChoiceStepId) {
      updateFlowSession({
        currentStep: stepId,
        waitingFor: step.input || 'file'
      });
    }

    addUserMessage({
      text: '',
      attachments: files.map(function (file) {
        return { fileName: file.name || 'file', publicUrl: '#', fileSize: Number(file.size) || 0 };
      }),
      type: 'file',
      flowId: state.flowSession.activeFlow,
      stepId: stepId
    });
    const payload = await postVisitorMessage({
      text: '',
      files,
      clientContext: buildFlowContext(step, { visitorMessageType: 'file' }),
      showPendingTyping: false
    });

    state.pendingFileStepId = '';
    if (sourceChoiceStepId) {
      setFlowStepStatus(sourceChoiceStepId, 'answered');
    }
    state.pendingUploadSourceStepId = '';
    const attachments = extractLatestVisitorAttachments(payload.messages || []);
    appendFlowUserMessage(
      attachments.length > 0
        ? attachments.map(function (file) { return file.fileName; }).join(', ')
        : 'uploaded file'
    );

    const result = step.onFiles
      ? step.onFiles({
          files,
          attachments,
          payload,
          session: state.flowSession
        })
      : null;

    await continueFlow(result);
  }

  async function startFlow(flowId, label) {
    const flow = getFlowDefinition(flowId);
    if (!flow || state.loading) return;

    clearPendingBotTimers();
    clearLocalFlowMessages();
    resetFlowSession();
    updateFlowSession({
      activeFlow: flowId,
      currentStep: '',
      waitingFor: '',
      language: 'uk',
      conversationId: state.conversationId,
      handoffReady: false,
      leadSummary: null,
      startedAt: getNowIso(),
      updatedAt: getNowIso(),
      userMessages: [label]
    });

    addUserMessage({ text: label, type: 'quick_action' });
    await postVisitorMessage({
      text: label,
      files: [],
      clientContext: {
        skipAiReply: true,
        visitorMessageType: 'quick_action',
        flowState: {
          activeFlow: flowId,
          currentStep: '',
          collectedAnswers: {},
          uploadedFiles: [],
          language: 'uk',
          conversationId: state.conversationId
        }
      },
      showPendingTyping: false
    });
    await showFlowStep(flow.startStepId);
  }

  async function createSession() {
    const response = await fetch(`${apiBase}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        visitorId: state.visitorId,
        sourcePage: window.location.pathname + window.location.search,
        language: 'uk'
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Chat init failed');
    }

    state.visitorId = payload.visitorId;
    state.conversationId = payload.conversation.conversationId;
    state.conversation = payload.conversation;
    state.messages = [];
    state.flowSession.conversationId = state.conversationId;
    updateConversationState(payload);
    connectStream();
  }

  async function loadConversation() {
    const response = await fetch(
      `${apiBase}/conversations/${encodeURIComponent(state.conversationId)}/messages?visitorId=${encodeURIComponent(state.visitorId)}&siteId=${encodeURIComponent(siteId)}`
    );
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Conversation load failed');
    }
    state.messages = [];
    state.flowSession.conversationId = state.conversationId;
    updateConversationState(payload);
    connectStream();
  }

  async function syncConversation() {
    if (!state.conversationId || !state.visitorId || state.loading) return;

    try {
      const response = await fetch(
        `${apiBase}/conversations/${encodeURIComponent(state.conversationId)}/messages?visitorId=${encodeURIComponent(state.visitorId)}&siteId=${encodeURIComponent(siteId)}`
      );
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Conversation sync failed');
      }

      updateConversationState(payload);
    } catch (error) {
      console.error(error);
    }
  }

  function stopSyncLoop() {
    if (state.syncTimer) {
      window.clearInterval(state.syncTimer);
      state.syncTimer = null;
    }
  }

  function startSyncLoop() {
    stopSyncLoop();
    state.syncTimer = window.setInterval(function () {
      if (!widget.classList.contains('is-open')) return;
      if (document.visibilityState === 'hidden') return;
      syncConversation();
    }, SYNC_INTERVAL_MS);
  }

  function connectStream() {
    if (!state.conversationId || !state.visitorId) return;
    if (state.stream) {
      state.stream.close();
    }
    if (state.streamRetryTimer) {
      window.clearTimeout(state.streamRetryTimer);
      state.streamRetryTimer = null;
    }
    state.stream = new EventSource(
      `${apiBase}/conversations/${encodeURIComponent(state.conversationId)}/stream?visitorId=${encodeURIComponent(state.visitorId)}&siteId=${encodeURIComponent(siteId)}`
    );
    state.stream.addEventListener('message', function (event) {
      const message = JSON.parse(event.data);
      if (!hasServerMessage(message.id)) {
        const localMatch = state.messages.find(function (item) {
          return item.localOnly && messageFingerprint(item) === messageFingerprint(message);
        });
        state.messages.push(normalizeMessage(message, Object.assign({
          localOnly: false,
          isFlowMessage: false
        }, localMatch ? {
          flowId: localMatch.flowId || '',
          stepId: localMatch.stepId || '',
          actions: Array.isArray(localMatch.actions) ? localMatch.actions : [],
          isFlowMessage: localMatch.isFlowMessage === true
        } : {})));
      }
      setTyping(false);
      renderMessages();
    });
    state.stream.addEventListener('conversation', function (event) {
      state.conversation = JSON.parse(event.data);
      renderStatus();
      saveState();
    });
    state.stream.onerror = function () {
      if (state.stream) {
        state.stream.close();
        state.stream = null;
      }
      if (state.streamRetryTimer) return;
      state.streamRetryTimer = window.setTimeout(function () {
        state.streamRetryTimer = null;
        syncConversation();
        connectStream();
      }, STREAM_RETRY_DELAY_MS);
    };
  }

  async function init() {
    if (state.initialized) return;
    state.initialized = true;
    const saved = getSavedState();
    state.visitorId = String(saved.visitorId || '');
    state.conversationId = String(saved.conversationId || '');
    state.messages = [];
    state.flowSession = saved.flowSession && typeof saved.flowSession === 'object'
      ? Object.assign(createEmptyFlowSession(), saved.flowSession)
      : createEmptyFlowSession();
    state.flowSession.language = state.flowSession.language || 'uk';

    try {
      if (state.visitorId && state.conversationId) {
        await loadConversation();
      } else {
        resetFlowSession();
        state.messages = [];
        await createSession();
      }
      if (state.flowSession.activeFlow && state.flowSession.currentStep) {
        clearPendingBotTimers();
        await showFlowStep(state.flowSession.currentStep);
      }
      renderMessages();
      updateInputPlaceholder();
    } catch (error) {
      console.error(error);
      state.initialized = false;
    }
  }

  async function handleRegularSubmit(text, files) {
    addUserMessage({
      text,
      attachments: files.map(function (file) {
        return { fileName: file.name || 'file', publicUrl: '#', fileSize: Number(file.size) || 0 };
      }),
      type: files.length > 0 && !text ? 'file' : 'text'
    });
    await postVisitorMessage({
      text,
      files,
      clientContext: null,
      showPendingTyping: true
    });
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!state.conversationId || state.loading) return;

    const text = input.value.trim();
    const files = Array.from(filesInput.files || []);
    const validationError = validateFiles(files);
    if (validationError) {
      fileHintEl.textContent = validationError;
      return;
    }
    if (!text && files.length === 0) return;

    try {
      if (state.flowSession.activeFlow) {
        const currentStep = getCurrentStepDefinition();
        if (files.length > 0 && currentStep && (currentStep.input === 'file' || currentStep.acceptsDirectFiles)) {
          await handleFlowFiles(files, currentStep.input === 'file' ? currentStep && state.flowSession.currentStep : 'await_file_upload');
        } else if (files.length > 0) {
          await handleFlowFallback(text, files);
        } else if (text) {
          await handleFlowText(text);
        } else {
          await handleRegularSubmit(text, files);
        }
      } else {
        await handleRegularSubmit(text, files);
      }

      input.value = '';
      filesInput.value = '';
      autoResizeInput();
      renderMessages();
    } catch (error) {
      console.error(error);
    }
  }

  const widget = document.createElement('section');
  widget.className = 'pf-chat-widget';
  widget.innerHTML = `
    <button class="pf-chat-launcher" type="button" aria-label="Відкрити чат">
      <span class="pf-chat-launcher-icon">
        <span class="pf-chat-launcher-cube"></span>
      </span>
      <span class="pf-chat-launcher-copy">
        <span class="pf-chat-launcher-title">${escapeHtml(LAUNCHER_TITLE)}</span>
        <span class="pf-chat-launcher-meta">${escapeHtml(LAUNCHER_META)}</span>
      </span>
    </button>
    <div class="pf-chat-panel" aria-hidden="true">
      <div class="pf-chat-header">
        <div class="pf-chat-header-copy">
          <strong>${escapeHtml(BOT_TITLE)}</strong>
          <p class="pf-chat-subtitle" id="pfChatStatus">
            <span class="pf-chat-status-dot"></span>
            <span id="pfChatStatusText">${escapeHtml(STATUS_LABELS.ai || ONLINE_STATUS_TEXT)}</span>
          </p>
        </div>
        <button class="pf-chat-close" type="button" aria-label="Закрити чат">×</button>
      </div>
      <div class="pf-chat-messages" id="pfChatMessages"></div>
      <div class="pf-chat-typing" id="pfChatTyping" hidden>
        <div class="pf-chat-avatar pf-chat-avatar-typing">PF</div>
        <div class="pf-chat-typing-bubble">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="pf-chat-quick-actions" id="pfChatQuickActions"></div>
      <form class="pf-chat-form" id="pfChatForm">
        <label class="pf-chat-attach" aria-label="Додати файл">
          <input class="pf-chat-file-input" id="pfChatFiles" type="file" multiple accept="${escapeHtml(ALLOWED_EXTENSIONS.join(','))}" />
          <span>📎</span>
        </label>
        <div class="pf-chat-input-shell">
          <textarea id="pfChatInput" rows="1" maxlength="4000" placeholder="${DEFAULT_PLACEHOLDER}"></textarea>
        </div>
        <button type="submit" class="pf-chat-send" aria-label="Надіслати">
          <span>➜</span>
        </button>
      </form>
      <div class="pf-chat-footer">
        <span id="pfChatFileHint">${DEFAULT_HINT}</span>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  const theme = widgetSettings.theme || {};
  if (theme.primary) widget.style.setProperty('--pf-orange-500', String(theme.primary));
  if (theme.primarySoft) widget.style.setProperty('--pf-orange-400', String(theme.primarySoft));
  if (theme.headerBg) widget.style.setProperty('--pf-navy-900', String(theme.headerBg));
  if (theme.headerBgSoft) widget.style.setProperty('--pf-navy-700', String(theme.headerBgSoft));
  if (theme.surface) widget.style.setProperty('--pf-surface', String(theme.surface));
  if (theme.bubbleBg) widget.style.setProperty('--pf-bubble-bg', String(theme.bubbleBg));
  if (theme.textColor) widget.style.setProperty('--pf-ink', String(theme.textColor));

  const launcher = widget.querySelector('.pf-chat-launcher');
  const panel = widget.querySelector('.pf-chat-panel');
  const closeButton = widget.querySelector('.pf-chat-close');
  const messagesEl = widget.querySelector('#pfChatMessages');
  const form = widget.querySelector('#pfChatForm');
  const input = widget.querySelector('#pfChatInput');
  const filesInput = widget.querySelector('#pfChatFiles');
  const statusTextEl = widget.querySelector('#pfChatStatusText');
  const fileHintEl = widget.querySelector('#pfChatFileHint');
  const typingEl = widget.querySelector('#pfChatTyping');
  const quickActionsEl = widget.querySelector('#pfChatQuickActions');

  function updateViewportMetrics() {
    const viewport = window.visualViewport;
    const viewportHeight = viewport ? viewport.height : window.innerHeight;
    const viewportTop = viewport ? viewport.offsetTop : 0;
    const topGap = Math.max(12, Math.round(viewportTop + 12));
    const launcherBottom = window.matchMedia('(max-width: 768px)').matches ? 68 : 78;

    widget.style.setProperty('--pf-chat-top-offset', `${topGap}px`);
    widget.style.setProperty('--pf-chat-viewport-height', `${Math.round(viewportHeight)}px`);
    widget.style.setProperty('--pf-chat-launcher-offset', `${launcherBottom}px`);
  }

  launcher.addEventListener('click', function () {
    setOpen(!widget.classList.contains('is-open'));
    init();
    startSyncLoop();
    renderQuickActions();
    autoResizeInput();
  });

  closeButton.addEventListener('click', function () {
    setOpen(false);
    setTyping(false);
    stopSyncLoop();
    localStorage.setItem(OPEN_SUPPRESS_KEY, String(Date.now() + AUTO_OPEN_SNOOZE_MS));
  });

  form.addEventListener('submit', submitMessage);
  input.addEventListener('input', autoResizeInput);
  input.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    form.requestSubmit();
  });

  quickActionsEl.addEventListener('click', async function (event) {
    const button = event.target.closest('.pf-chat-quick-action');
    if (!button) return;
    const flowId = String(button.dataset.flowId || '');
    const action = QUICK_ACTIONS.find(function (item) {
      const itemFlowId = String(item.flowId || QUICK_ACTION_FLOW_MAP[String(item.key || '').trim().toLowerCase()] || '').trim();
      return itemFlowId === flowId;
    });
    if (!action) return;
    await startFlow(flowId, action.label);
  });

  messagesEl.addEventListener('click', async function (event) {
    const button = event.target.closest('.pf-chat-inline-action');
    if (!button || button.disabled) return;

    const flowId = String(button.dataset.flowId || '');
    const stepId = String(button.dataset.stepId || '');
    if (flowId !== state.flowSession.activeFlow || getFlowStepStatus(stepId) !== 'pending') {
      return;
    }

    const kind = String(button.dataset.actionKind || 'flow-choice');
    const value = String(button.dataset.value || '');
    const label = String(button.dataset.label || '');

    if (kind === 'flow-choice') {
      await handleFlowChoice(value, label, stepId);
    }
  });

  filesInput.addEventListener('change', async function () {
    const files = Array.from(filesInput.files || []);
    const count = files.length;
    const validationError = validateFiles(files);

    if (validationError) {
      fileHintEl.textContent = validationError;
      filesInput.value = '';
      return;
    }

    if (!count) {
      fileHintEl.textContent = DEFAULT_HINT;
      return;
    }

    fileHintEl.textContent = `Готово: ${count} файл(ів)`;

    try {
      if (state.flowSession.activeFlow) {
        const currentStep = getCurrentStepDefinition();
        if (currentStep && (currentStep.input === 'file' || currentStep.acceptsDirectFiles || state.pendingFileStepId)) {
          const targetStepId =
            state.pendingFileStepId ||
            (currentStep.input === 'file' ? state.flowSession.currentStep : 'await_file_upload');
          await handleFlowFiles(files, targetStepId);
          filesInput.value = '';
          return;
        }
      }
    } catch (error) {
      console.error(error);
      return;
    }
  });

  const saved = getSavedState();
  if (saved.isOpen) {
    setOpen(true);
    init();
    startSyncLoop();
  } else {
    const snoozeUntil = Number(localStorage.getItem(OPEN_SUPPRESS_KEY) || 0);
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile && Date.now() > snoozeUntil) {
      window.setTimeout(function () {
        setOpen(true);
        init();
        startSyncLoop();
        renderQuickActions();
        autoResizeInput();
      }, AUTO_OPEN_DELAY_MS);
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && widget.classList.contains('is-open')) {
      updateViewportMetrics();
      syncConversation();
      connectStream();
    }
  });

  window.addEventListener('focus', function () {
    updateViewportMetrics();
    if (widget.classList.contains('is-open')) {
      syncConversation();
    }
  });

  window.addEventListener('resize', updateViewportMetrics);
  window.addEventListener('orientationchange', updateViewportMetrics);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportMetrics);
    window.visualViewport.addEventListener('scroll', updateViewportMetrics);
  }

  renderQuickActions();
  renderMessages();
  autoResizeInput();
  updateInputPlaceholder();
  updateViewportMetrics();
  setTyping(false);
})();
