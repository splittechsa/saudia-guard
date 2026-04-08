-- 1. تعطيل القيود مؤقتاً لضمان عدم حدوث تعليق بسبب المفاتيح الخارجية
SET session_replication_role = 'replica';

-- 2. استيراد الملفات حسب ترتيب الأهمية (Hierarchy)

-- أ. البروفايلات (أساس المستخدمين)
COPY public.profiles FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/profiles-export-2026-04-08_07-43-15.csv' WITH CSV HEADER;

-- ب. المتاجر (تعتمد على البروفايلات)
COPY public.stores FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/stores-export-2026-04-08_07-45-49.csv' WITH CSV HEADER;

-- ج. الاشتراكات ومفاتيح API (تعتمد على المتاجر/البروفايلات)
COPY public.subscriptions FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/subscriptions-export-2026-04-08_07-55-57.csv' WITH CSV HEADER;
COPY public.store_api_keys FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/store_api_keys-export-2026-04-08_07-45-03.csv' WITH CSV HEADER;

-- د. التذاكر والرسائل (خدمة العملاء)
COPY public.support_tickets FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/support_tickets-export-2026-04-08_07-56-15.csv' WITH CSV HEADER;
COPY public.ticket_messages FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/ticket_messages-export-2026-04-08_07-57-01.csv' WITH CSV HEADER;

-- هـ. التنبيهات والبث واللوقات (البيانات التشغيلية)
COPY public.security_alerts FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/security_alerts-export-2026-04-08_07-44-02.csv' WITH CSV HEADER;
COPY public.broadcasts FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/broadcasts-export-2026-04-08_07-42-43.csv' WITH CSV HEADER;
COPY public.analytics_logs FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/analytics_logs-export-2026-04-08_07-33-55.csv' WITH CSV HEADER;
COPY public.analytics_logs_archive FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/analytics_logs_archive-export-2026-04-08_07-42-08.csv' WITH CSV HEADER;
COPY public.system_logs FROM 'https://oolubvzjmfalxgmjvjkx.supabase.co/storage/v1/object/public/migration/system_logs-export-2026-04-08_07-57-09.csv' WITH CSV HEADER;

-- 3. إعادة تفعيل القيود فوراً لحماية البيانات
SET session_replication_role = 'origin';