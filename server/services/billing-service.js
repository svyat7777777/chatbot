const Stripe = require('stripe');
const { PLANS, normalizePlanKey } = require('./plan-service');

const BILLING_INTERVALS = ['monthly', 'yearly'];
const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'incomplete'
]);

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function toSqlDate(value) {
  if (!value) return '';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function resolvePriceIdMap(options = {}) {
  return {
    [sanitizeText(options.proMonthlyPriceId, 160)]: { plan: 'pro', interval: 'monthly', label: 'Pro monthly' },
    [sanitizeText(options.proYearlyPriceId, 160)]: { plan: 'pro', interval: 'yearly', label: 'Pro yearly' },
    [sanitizeText(options.businessMonthlyPriceId, 160)]: { plan: 'business', interval: 'monthly', label: 'Business monthly' },
    [sanitizeText(options.businessYearlyPriceId, 160)]: { plan: 'business', interval: 'yearly', label: 'Business yearly' }
  };
}

class BillingService {
  constructor(options = {}) {
    this.workspaceService = options.workspaceService;
    this.publicBaseUrl = sanitizeText(options.publicBaseUrl, 2000).replace(/\/+$/, '');
    this.publishableKey = sanitizeText(options.publishableKey, 200);
    this.webhookSecret = sanitizeText(options.webhookSecret, 200);
    this.portalConfigurationId = sanitizeText(options.portalConfigurationId, 200);
    this.trialDays = Math.max(0, Number(options.trialDays) || 0);
    this.manualPlanSwitchingEnabled = options.manualPlanSwitchingEnabled === true;
    this.priceCatalog = {
      pro: {
        monthly: sanitizeText(options.proMonthlyPriceId, 160),
        yearly: sanitizeText(options.proYearlyPriceId, 160)
      },
      business: {
        monthly: sanitizeText(options.businessMonthlyPriceId, 160),
        yearly: sanitizeText(options.businessYearlyPriceId, 160)
      }
    };
    this.priceIdMap = Object.entries(resolvePriceIdMap(options)).reduce((accumulator, [priceId, meta]) => {
      if (priceId) accumulator[priceId] = meta;
      return accumulator;
    }, {});
    this.stripe = options.secretKey ? new Stripe(options.secretKey) : null;
  }

  isConfigured() {
    return Boolean(
      this.stripe &&
      this.priceCatalog.pro.monthly &&
      this.priceCatalog.pro.yearly &&
      this.priceCatalog.business.monthly &&
      this.priceCatalog.business.yearly
    );
  }

  isWebhookConfigured() {
    return Boolean(this.isConfigured() && this.webhookSecret);
  }

  getPriceSelection(plan, interval) {
    const nextPlan = normalizePlanKey(plan);
    const nextInterval = BILLING_INTERVALS.includes(interval) ? interval : 'monthly';
    if (nextPlan === 'basic') return null;
    const priceId = this.priceCatalog[nextPlan] && this.priceCatalog[nextPlan][nextInterval];
    if (!priceId) return null;
    return {
      plan: nextPlan,
      interval: nextInterval,
      priceId,
      label: `${PLANS[nextPlan].label} ${nextInterval}`
    };
  }

  getPriceMetaById(priceId) {
    const cleanPriceId = sanitizeText(priceId, 160);
    return cleanPriceId ? (this.priceIdMap[cleanPriceId] || null) : null;
  }

  hasManagedStripeSubscription(workspace) {
    return Boolean(
      workspace &&
      workspace.stripeCustomerId &&
      workspace.stripeSubscriptionId &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(String(workspace.subscriptionStatus || '').trim())
    );
  }

  canStartTrial(workspace) {
    if (this.trialDays <= 0) return false;
    if (!workspace) return false;
    if (workspace.trialStartedAt || workspace.trialEndsAt) return false;
    if (workspace.stripeSubscriptionId) return false;
    return normalizePlanKey(workspace.plan) === 'basic';
  }

  buildPlanBillingState(workspace) {
    const currentPriceMeta = this.getPriceMetaById(workspace && workspace.stripePriceId);
    const trialActive = Boolean(workspace && workspace.trialEndsAt && new Date(workspace.trialEndsAt.replace(' ', 'T') + 'Z').getTime() > Date.now());
    return {
      provider: 'stripe',
      configured: this.isConfigured(),
      publishableKeyConfigured: Boolean(this.publishableKey),
      portalConfigured: Boolean(this.stripe),
      webhookConfigured: this.isWebhookConfigured(),
      stripeCustomerPresent: Boolean(workspace && workspace.stripeCustomerId),
      stripeSubscriptionPresent: Boolean(workspace && workspace.stripeSubscriptionId),
      stripePriceId: workspace && workspace.stripePriceId ? workspace.stripePriceId : '',
      interval: currentPriceMeta ? currentPriceMeta.interval : '',
      trialActive,
      trialEligible: this.canStartTrial(workspace),
      trialDays: this.trialDays,
      trialEndsAt: workspace && workspace.trialEndsAt ? workspace.trialEndsAt : '',
      trialStartedAt: workspace && workspace.trialStartedAt ? workspace.trialStartedAt : '',
      currentPeriodEnd: workspace && workspace.currentPeriodEnd ? workspace.currentPeriodEnd : '',
      portalLastUrl: workspace && workspace.stripePortalLastUrl ? workspace.stripePortalLastUrl : '',
      managedByStripe: Boolean(workspace && workspace.stripeCustomerId),
      hasPaidSubscription: this.hasManagedStripeSubscription(workspace),
      actions: {
        canCheckout: this.isConfigured(),
        canManageBilling: Boolean(this.stripe && workspace && workspace.stripeCustomerId),
        manualPlanSwitchingEnabled: this.manualPlanSwitchingEnabled
      },
      prices: {
        pro: {
          monthly: this.priceCatalog.pro.monthly,
          yearly: this.priceCatalog.pro.yearly
        },
        business: {
          monthly: this.priceCatalog.business.monthly,
          yearly: this.priceCatalog.business.yearly
        }
      }
    };
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      const error = new Error('Stripe billing is not configured yet.');
      error.code = 'STRIPE_NOT_CONFIGURED';
      throw error;
    }
  }

  assertWebhookConfigured() {
    if (!this.isWebhookConfigured()) {
      const error = new Error('Stripe webhook is not configured yet.');
      error.code = 'STRIPE_WEBHOOK_NOT_CONFIGURED';
      throw error;
    }
  }

  async ensureStripeCustomer(workspace, user = null) {
    this.assertConfigured();
    if (workspace.stripeCustomerId) {
      return workspace.stripeCustomerId;
    }
    const customer = await this.stripe.customers.create({
      email: sanitizeText(user && user.email, 160) || undefined,
      name: sanitizeText(user && user.name, 160) || sanitizeText(workspace.name, 160),
      metadata: {
        workspaceId: workspace.id
      }
    });
    this.workspaceService.updateWorkspaceBilling(workspace.id, {
      stripeCustomerId: customer.id,
      billingProvider: 'stripe'
    });
    return customer.id;
  }

  async createCheckoutSession(options = {}) {
    this.assertConfigured();
    const workspace = options.workspace;
    const user = options.user || null;
    const selection = this.getPriceSelection(options.plan, options.interval);
    if (!workspace) {
      const error = new Error('Workspace not found.');
      error.code = 'WORKSPACE_NOT_FOUND';
      throw error;
    }
    if (!selection) {
      const error = new Error('Select a paid plan and billing interval.');
      error.code = 'INVALID_BILLING_SELECTION';
      throw error;
    }
    if (this.hasManagedStripeSubscription(workspace)) {
      const error = new Error('This workspace already has a Stripe subscription. Open billing portal to manage it.');
      error.code = 'SUBSCRIPTION_ALREADY_EXISTS';
      throw error;
    }

    const customerId = await this.ensureStripeCustomer(workspace, user);
    const subscriptionData = {
      metadata: {
        workspaceId: workspace.id,
        targetPlan: selection.plan,
        targetInterval: selection.interval
      }
    };
    if (this.canStartTrial(workspace)) {
      subscriptionData.trial_period_days = this.trialDays;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: workspace.id,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      line_items: [
        {
          price: selection.priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      metadata: {
        workspaceId: workspace.id,
        targetPlan: selection.plan,
        targetInterval: selection.interval
      },
      subscription_data: subscriptionData
    });

    return {
      id: session.id,
      url: session.url || '',
      plan: selection.plan,
      interval: selection.interval
    };
  }

  async createPortalSession(options = {}) {
    this.assertConfigured();
    const workspace = options.workspace;
    if (!workspace || !workspace.stripeCustomerId) {
      const error = new Error('This workspace does not have an active Stripe customer yet.');
      error.code = 'STRIPE_CUSTOMER_REQUIRED';
      throw error;
    }
    const payload = {
      customer: workspace.stripeCustomerId,
      return_url: options.returnUrl
    };
    if (this.portalConfigurationId) {
      payload.configuration = this.portalConfigurationId;
    }
    const session = await this.stripe.billingPortal.sessions.create(payload);
    this.workspaceService.updateWorkspaceBilling(workspace.id, {
      stripePortalLastUrl: session.url || workspace.stripePortalLastUrl || '',
      billingProvider: 'stripe'
    });
    return {
      url: session.url || ''
    };
  }

  constructWebhookEvent(rawBody, signature) {
    this.assertWebhookConfigured();
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  resolveWorkspaceForBillingEvent(options = {}) {
    const metadataWorkspaceId = sanitizeText(options.metadataWorkspaceId, 120);
    const subscriptionId = sanitizeText(options.subscriptionId, 160);
    const customerId = sanitizeText(options.customerId, 160);
    if (metadataWorkspaceId) {
      const workspace = this.workspaceService.getWorkspaceById(metadataWorkspaceId);
      if (workspace) return workspace;
    }
    if (subscriptionId) {
      const workspace = this.workspaceService.getWorkspaceByStripeSubscriptionId(subscriptionId);
      if (workspace) return workspace;
    }
    if (customerId) {
      const workspace = this.workspaceService.getWorkspaceByStripeCustomerId(customerId);
      if (workspace) return workspace;
    }
    return null;
  }

  async syncWorkspaceFromSubscription(subscription, metadataWorkspaceId = '') {
    if (!subscription) return null;
    const subscriptionId = sanitizeText(subscription.id, 160);
    const customerId = sanitizeText(subscription.customer, 160);
    const priceId = sanitizeText(subscription.items && subscription.items.data && subscription.items.data[0] && subscription.items.data[0].price && subscription.items.data[0].price.id, 160);
    const priceMeta = this.getPriceMetaById(priceId);
    const workspace = this.resolveWorkspaceForBillingEvent({
      metadataWorkspaceId,
      subscriptionId,
      customerId
    });
    if (!workspace) return null;

    const status = sanitizeText(subscription.status, 80) || workspace.subscriptionStatus || 'active';
    const deleted = Boolean(subscription.status === 'canceled' || subscription.cancel_at_period_end === false && subscription.ended_at);
    const nextPlan = deleted
      ? 'basic'
      : (priceMeta ? priceMeta.plan : normalizePlanKey(workspace.plan));

    return this.workspaceService.updateWorkspaceBilling(workspace.id, {
      plan: nextPlan,
      subscriptionStatus: status,
      currentPeriodEnd: toSqlDate(subscription.current_period_end),
      trialEndsAt: toSqlDate(subscription.trial_end),
      trialStartedAt: toSqlDate(subscription.trial_start) || workspace.trialStartedAt || '',
      stripeCustomerId: customerId || workspace.stripeCustomerId || '',
      stripeSubscriptionId: subscriptionId || workspace.stripeSubscriptionId || '',
      stripePriceId: priceId || workspace.stripePriceId || '',
      billingProvider: 'stripe'
    });
  }

  async handleCheckoutCompleted(session) {
    const workspace = this.resolveWorkspaceForBillingEvent({
      metadataWorkspaceId: session && session.metadata && session.metadata.workspaceId,
      subscriptionId: session && session.subscription,
      customerId: session && session.customer
    });
    if (!workspace) return null;
    const updated = this.workspaceService.updateWorkspaceBilling(workspace.id, {
      stripeCustomerId: sanitizeText(session.customer, 160) || workspace.stripeCustomerId || '',
      stripeSubscriptionId: sanitizeText(session.subscription, 160) || workspace.stripeSubscriptionId || '',
      billingProvider: 'stripe'
    });
    if (session && session.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(String(session.subscription));
      return this.syncWorkspaceFromSubscription(subscription, session && session.metadata && session.metadata.workspaceId);
    }
    return updated;
  }

  async handleInvoicePaid(invoice) {
    const subscriptionId = sanitizeText(invoice && invoice.subscription, 160);
    const customerId = sanitizeText(invoice && invoice.customer, 160);
    if (subscriptionId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return this.syncWorkspaceFromSubscription(subscription);
    }
    const workspace = this.resolveWorkspaceForBillingEvent({ customerId });
    if (!workspace) return null;
    return this.workspaceService.updateWorkspaceBilling(workspace.id, {
      subscriptionStatus: 'active',
      billingProvider: 'stripe'
    });
  }

  async handleInvoicePaymentFailed(invoice) {
    const subscriptionId = sanitizeText(invoice && invoice.subscription, 160);
    const customerId = sanitizeText(invoice && invoice.customer, 160);
    if (subscriptionId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return this.syncWorkspaceFromSubscription(subscription);
    }
    const workspace = this.resolveWorkspaceForBillingEvent({ subscriptionId, customerId });
    if (!workspace) return null;
    return this.workspaceService.updateWorkspaceBilling(workspace.id, {
      subscriptionStatus: sanitizeText(invoice && invoice.status, 80) || 'past_due',
      billingProvider: 'stripe'
    });
  }

  async handleSubscriptionDeleted(subscription) {
    const workspace = this.resolveWorkspaceForBillingEvent({
      metadataWorkspaceId: subscription && subscription.metadata && subscription.metadata.workspaceId,
      subscriptionId: subscription && subscription.id,
      customerId: subscription && subscription.customer
    });
    if (!workspace) return null;
    return this.workspaceService.updateWorkspaceBilling(workspace.id, {
      plan: 'basic',
      subscriptionStatus: sanitizeText(subscription && subscription.status, 80) || 'canceled',
      currentPeriodEnd: toSqlDate(subscription && subscription.current_period_end),
      trialEndsAt: toSqlDate(subscription && subscription.trial_end),
      trialStartedAt: toSqlDate(subscription && subscription.trial_start) || workspace.trialStartedAt || '',
      stripeCustomerId: sanitizeText(subscription && subscription.customer, 160) || workspace.stripeCustomerId || '',
      stripeSubscriptionId: sanitizeText(subscription && subscription.id, 160) || workspace.stripeSubscriptionId || '',
      stripePriceId: sanitizeText(subscription && subscription.items && subscription.items.data && subscription.items.data[0] && subscription.items.data[0].price && subscription.items.data[0].price.id, 160) || workspace.stripePriceId || '',
      billingProvider: 'stripe'
    });
  }

  async handleWebhookEvent(event) {
    if (!event || !event.type) return null;
    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(event.data.object);
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.syncWorkspaceFromSubscription(
          event.data.object,
          event.data.object && event.data.object.metadata && event.data.object.metadata.workspaceId
        );
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(event.data.object);
      case 'invoice.paid':
        return this.handleInvoicePaid(event.data.object);
      case 'invoice.payment_failed':
        return this.handleInvoicePaymentFailed(event.data.object);
      default:
        return null;
    }
  }
}

module.exports = {
  BillingService,
  BILLING_INTERVALS,
  ACTIVE_SUBSCRIPTION_STATUSES
};
