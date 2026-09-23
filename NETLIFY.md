# نشر منصة المباريات على Netlify

المشروع مجهز للبناء على Netlify باستخدام Vite للواجهة وNetlify Functions لمسارات tRPC وExpress. ملف `netlify.toml` يحدد أمر البناء، مجلد النشر، مجلد الوظائف، وتحويلات SPA وAPI.

## الإعداد

اربط مستودع المشروع في Netlify، وسيستخدم الأمر `pnpm build` ومجلد النشر `dist/public`. أضف المتغيرات التالية في **Site configuration → Environment variables**:

| المتغير | الاستخدام |
|---|---|
| `NEON_DATABASE_URL` | رابط PostgreSQL الخاص بقاعدة Neon |
| `JWT_SECRET` | سر جلسات تسجيل الدخول |
| `VITE_APP_ID` | معرّف تطبيق Manus OAuth إذا كانت لوحة الإدارة ستستخدم تسجيل الدخول |
| `OAUTH_SERVER_URL` | عنوان خادم OAuth |
| `VITE_OAUTH_PORTAL_URL` | رابط بوابة تسجيل الدخول |
| `OWNER_OPEN_ID` | معرّف مالك المشروع لمنحه دور الإدارة |

لا يوضع أي رابط قاعدة بيانات أو سر داخل Git أو ملفات الواجهة. بعد الحفظ شغّل Deploy، وستُخدم الواجهة من `dist/public` وتُمرر طلبات `/api/*` إلى Function باسم `api`.

## ملاحظة عن لوحة التحكم

الموقع العام يعمل دون تسجيل دخول. عمليات إضافة وتعديل وحذف المباريات تمر عبر tRPC داخل Function وتحتاج متغيرات OAuth السابقة عند تفعيل لوحة الإدارة على نطاق Netlify.
