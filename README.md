# DorraJewelery

متجر مجوهرات Django مع MySQL، Django Admin، كتالوج منتجات، بحث وفرز وفلاتر، modal تفاصيل وتقييمات، سلة شراء، checkout متعدد المراحل، وثيم داكن/فاتح ودعم عربي/إنجليزي.

## إعداد MySQL

أنشئ قاعدة البيانات والمستخدم (واستخدم كلمة مرور قوية ومضيفاً مقيداً بشبكة التطبيق):

```sql
CREATE DATABASE dorra_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dorra_app'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON dorra_store.* TO 'dorra_app'@'localhost';
```

اضبط متغيرات البيئة قبل تشغيل Django:

```powershell
$env:MYSQL_DATABASE = "dorra_store"
$env:MYSQL_USER = "dorra_app"
$env:MYSQL_PASSWORD = "<strong-password>"
$env:MYSQL_HOST = "127.0.0.1"
$env:MYSQL_PORT = "3306"
$env:MYSQL_POOL_SIZE = "5"
$env:MYSQL_MAX_OVERFLOW = "5"
$env:MYSQL_POOL_RECYCLE = "1800"
```

`dj_db_conn_pool` يوفر تجمعاً لكل عملية؛ خطط لحد MySQL الأقصى على أساس عدد عمليات التطبيق مضروباً في `MYSQL_POOL_SIZE + MYSQL_MAX_OVERFLOW`. خيار `DB_ENGINE=sqlite` متاح للتطوير المحلي فقط.

في الإنتاج، اضبط `DJANGO_DEBUG=false` ووفّر `DJANGO_SECRET_KEY` عشوائياً عبر مدير أسرار البيئة. لا تستخدم مفتاح التطوير المحلي في بيئة منشورة؛ يستخدم توقيع روابط الفواتير هذا المفتاح.

## ترحيل المخطط والبيانات

تُنشئ Django migrations جميع جداول المشروع، بما فيها `store_product`, `store_productimage`, `store_order`, `store_orderitem`, `store_review` وجداول Django الأساسية، مع المفاتيح والعلاقات والقيود المطابقة لـ `store/models.py`. لا تُنشئ جداول التطبيق يدوياً؛ `migrate` هو مصدر الحقيقة للمخطط:

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

لنقل البيانات الحالية من SQLite، خذ نسخة احتياطية أولاً ثم صدّر البيانات، وشغّل migrations على MySQL، واستورد الملف. احفظ ملف التصدير بأمان واحذفه بعد التحقق:

```powershell
Copy-Item .\db.sqlite3 .\db.sqlite3.bak
$env:DB_ENGINE = "sqlite"
python manage.py dumpdata --natural-foreign --exclude=contenttypes --exclude=auth.permission --indent 2 --output=store-data.json
$env:DB_ENGINE = "mysql"
python manage.py migrate
python manage.py loaddata store-data.json
```

انسخ ملفات `media/` إلى البيئة الجديدة أيضاً، ثم تحقق من أعداد المنتجات والطلبات والتقييمات قبل تحويل حركة المرور.

```powershell
python manage.py check
```

المتجر: http://127.0.0.1:8000

لوحة الإدارة: http://127.0.0.1:8000/admin/

المنتجات والطلبات والتقييمات تدار من `store/models.py` و`store/admin.py`. يمكن رفع صور المنتجات من Admin وتفعيل حالة `sold_out` مباشرة.

كود الخصم التجريبي: `DORRA10`.

الصور المرفوعة تحفظ داخل `media/products/`.

## ميزات الكتالوج والدفع والفواتير

- بعد رفع التحديثات، شغّل `python manage.py migrate` لإضافة حقول الاسم والوصف الإنجليزية وصور المعرض وخيارات الإهداء للطلبات. أضف صور المعرض من صفحة تعديل المنتج في Django Admin؛ الصورة الرئيسية تظل أول صورة في عرض المنتج.
- يُختار تغليف الهدية والرسالة الاختيارية حصراً عند إتمام الطلب. يضيف كل اختيار 5.00 د.إ مرة واحدة لكل طلب، ويحسب الخادم السعر من أسعار قاعدة البيانات وخيارات النموذج، لا من إجمالي يرسله المتصفح.
- يُفرّغ سلة الجلسة بعد إنشاء الطلب، كما تُحذف سلة المتصفح في صفحة النجاح.
- رابط الفاتورة في نجاح الطلب موقّع ومحدود الصلاحية بـ 90 يوماً. من صفحة الطلب في الإدارة استخدم «عرض / طباعة». صفحة الفاتورة مناسبة للطباعة؛ اختر «Save as PDF» في نافذة الطباعة بالمتصفح.
- اختر English أو عربي من رأس المتجر؛ تُستخدم حقول المنتج الإنجليزية عند توفرها، مع الرجوع للنص العربي عند تركها فارغة. تحفظ اللغة والثيم في تخزين المتصفح.
