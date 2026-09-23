CREATE TYPE "public"."match_status" AS ENUM('available', 'limited', 'sold_out', 'finished');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_number" integer NOT NULL,
	"slug" varchar(160) NOT NULL,
	"competition" varchar(160) NOT NULL,
	"stage" varchar(40) NOT NULL,
	"group_name" varchar(10),
	"round" varchar(100) NOT NULL,
	"home_team" varchar(120) NOT NULL,
	"away_team" varchar(120) NOT NULL,
	"home_short" varchar(12) NOT NULL,
	"away_short" varchar(12) NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"venue" varchar(160),
	"city" varchar(100) NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Riyadh' NOT NULL,
	"match_date" timestamp with time zone NOT NULL,
	"match_time" varchar(30),
	"status" "match_status" DEFAULT 'available' NOT NULL,
	"ticket_label" varchar(120) NOT NULL,
	"accent_color" varchar(30) DEFAULT 'emerald' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"note" text,
	"source_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_match_number_unique" UNIQUE("match_number"),
	CONSTRAINT "matches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
