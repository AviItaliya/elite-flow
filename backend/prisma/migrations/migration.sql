-- Prevent duplicate pending new subscription payments.
CREATE UNIQUE INDEX
"Payment_one_pending_new_subscription_per_company"
ON "Payment" ("companyId")
WHERE "purpose" = 'NEW_SUBSCRIPTION'::"PaymentPurpose"
AND "status" = 'PENDING'::"PaymentStatus";


-- Prevent duplicate pending renewal payments.
CREATE UNIQUE INDEX
"Payment_one_pending_renewal_per_subscription"
ON "Payment" ("renewalForSubscriptionId")
WHERE "purpose" = 'RENEWAL'::"PaymentPurpose"
AND "status" = 'PENDING'::"PaymentStatus"
AND "renewalForSubscriptionId" IS NOT NULL;


-- Prevent duplicate pending plan change payments.
CREATE UNIQUE INDEX
"Payment_one_pending_plan_change_per_subscription"
ON "Payment" ("planChangeForSubscriptionId")
WHERE "purpose" = 'PLAN_CHANGE'::"PaymentPurpose"
AND "status" = 'PENDING'::"PaymentStatus"
AND "planChangeForSubscriptionId" IS NOT NULL;