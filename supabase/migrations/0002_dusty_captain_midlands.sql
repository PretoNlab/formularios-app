ALTER TYPE "public"."plan" ADD VALUE 'founder';--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "settings" SET DEFAULT '{"showProgressBar":true,"showQuestionNumbers":true,"allowPartialResponses":true,"notifyOnResponse":false,"notificationEmail":null,"redirectUrl":null,"closeMessage":"Este formulário não está mais aceitando respostas.","responseLimit":null,"closedAt":null,"downloadUrl":null,"downloadLabel":null,"autoResponderEnabled":false,"autoResponderEmailFieldId":null,"autoResponderSubject":null,"autoResponderBody":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "is_analytics_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "response_quota" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "response_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "form_quota" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "brand_kit" jsonb;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_share_token_unique" UNIQUE("share_token");