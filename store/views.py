import json
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.core import signing
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Q, Sum
from django.http import Http404, JsonResponse
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.urls import reverse
from django.utils.http import urlencode
from django.views.decorators.cache import never_cache

from .invoice_service import GIFT_ADDON_PRICE, render_order_invoice
from .models import Order, OrderItem, Product, Review


# Catalog categories and initial products.
CATEGORIES = [
    ("all", "جميع المنتجات"),
    ("sets", "أطقم"),
    ("large_sets", "أطقم كبيرة"),
    ("small_sets", "أطقم صغيرة"),
    ("watches", "ساعات"),
    ("heritage_sets", "أطقم تراثية"),
    ("bracelet_ring", "أسوارة وخاتم"),
    ("necklaces", "سلسلة"),
]

CATEGORY_MAP = {"watches": "ساعات"}

SEED_PRODUCTS = [
    (
        "طقم درّة الملكي",
        "large_sets",
        "gold",
        899,
        1100,
        "طقم فاخر بتفاصيل ذهبية يليق بالمناسبات.",
        "الأكثر مبيعًا",
    ),
    (
        "طقم اللؤلؤ الناعم",
        "small_sets",
        "silver",
        425,
        None,
        "تنسيق يومي ناعم من اللمعة واللؤلؤ.",
        "جديد",
    ),
    (
        "ساعة Dorra Signature",
        "watches",
        "gold",
        399,
        480,
        "ساعة فاخرة بقرص لامع وحزام يليق بكل مناسبة.",
        "خصم 20%",
    ),
    (
        "أسوارة وخاتم درّة",
        "bracelet_ring",
        "silver",
        285,
        None,
        "قطعتان متناسقتان بهدوء وأناقة.",
        "اختيارنا",
    ),
    (
        "سلسلة القلب الصغيرة",
        "necklaces",
        "gold",
        195,
        None,
        "سلسلة رقيقة مع تعليقة قلب بتفاصيل لامعة.",
        "محدود",
    ),
    (
        "الطقم التراثي الإماراتي",
        "heritage_sets",
        "gold",
        650,
        760,
        "مستوحى من تفاصيل التراث الإماراتي الأصيل.",
        "حصري",
    ),
]


# Add sample products only when the database is empty.
def ensure_seed_data():
    if Product.objects.exists():
        return

    Product.objects.bulk_create(
        [
            Product(
                name=name,
                category=CATEGORY_MAP.get(category, category),
                material=material,
                price=price,
                old_price=old_price,
                description=description,
                color=material,
                badge=badge,
            )
            for name, category, material, price, old_price, description, badge in SEED_PRODUCTS
        ]
    )


# Convert a Product model into the JSON shape used by the frontend.
def product_payload(product):
    gallery = [
        image.image.url
        for image in product.gallery_images.all()
        if image.image
    ]
    main_image = product.image.url if product.image else ""
    return {
        "id": product.id,
        "name": product.name,
        "name_en": product.name_en or "",
        "category": product.category,
        "material": product.material,
        "price": float(product.price),
        "old_price": float(product.old_price) if product.old_price is not None else None,
        "description": product.description,
        "description_en": product.description_en or "",
        "color": product.color,
        "badge": product.badge,
        "sold_out": product.sold_out,
        "rating": product.rating,
        "image": main_image,
        "images": list(dict.fromkeys(([main_image] if main_image else []) + gallery)),
        "reviews": [
            {
                "name": review.customer_name,
                "comment": review.comment,
                "rating": review.rating,
            }
            for review in product.reviews.all()[:5]
        ],
    }


# Generate local assistant replies from the current catalog.
def answer_for(message, language="ar"):
    text = message.lower().strip()
    english = language == "en"
    products = list(Product.objects.filter(is_active=True, sold_out=False))

    if not text:
        return (
            "Ask me anything and I will help you find the right piece."
            if english
            else "اكتبي سؤالك وسأساعدك باختيار القطعة المناسبة."
        )

    if any(word in text for word in ("مرحبا", "اهلا", "أهلا", "hello", "hi")):
        return (
            "Welcome to Dorra Jewelry! Ask about prices, our collection, or delivery."
            if english
            else "أهلًا في DorraJewelery! اسأليني عن الأسعار أو أفضل قطعة أو التوصيل."
        )

    if any(word in text for word in ("توصيل", "شحن", "delivery")):
        return (
            "Delivery takes 1–3 days. Shipping is AED 30."
            if english
            else "مدة التوصيل من 1 إلى 3 أيام، ورسوم التوصيل ثابتة 30 د.إ."
        )

    if any(word in text for word in ("خصم", "تخفيض", "عرض", "sale")):
        names = ", ".join(
            (item.name_en or item.name) if english else item.name
            for item in products
            if item.old_price
        )
        if english:
            return f"Current offers: {names or 'selected pieces'}. Discounts are shown on each product."
        return f"عندنا عروض على: {names or 'القطع المختارة'}. الخصم ظاهر على البطاقات."

    if any(word in text for word in ("ساعة", "ساعات", "watch", "watches")):
        watches = [item for item in products if item.category == "ساعات"]
        watch_names = ", ".join(
            f"{(item.name_en or item.name) if english else item.name} "
            f"({'AED' if english else 'د.إ'} {item.price})"
            for item in watches
        )
        if english:
            return f"Our watches: {watch_names or 'Please browse the collection.'}"
        return f"لدينا: {watch_names}."

    if any(word in text for word in ("سعر", "السعر", "الأسعار", "بكم", "price")):
        return (
            "Prices start at AED 195. Select a piece to see its details and add it to your cart."
            if english
            else "الأسعار تبدأ من 195 د.إ. اختاري أي قطعة لرؤية التفاصيل وإضافتها للسلة."
        )

    return (
        "I can help with prices, offers, delivery, or finding a piece you will love."
        if english
        else "أقدر أساعدك بالأسعار، العروض، التوصيل، أو اختيار قطعة حسب ذوقك."
    )


# Render the storefront with active products and categories.
def home(request):
    ensure_seed_data()
    products = Product.objects.filter(is_active=True).prefetch_related(
        "reviews", "gallery_images"
    )
    context = {
        "products": [product_payload(product) for product in products],
        "categories": CATEGORIES,
    }
    return render(request, "index.html", context)


# Return filtered, searched, and sorted products for API consumers.
@require_GET
def products_api(request):
    ensure_seed_data()
    queryset = Product.objects.filter(is_active=True).prefetch_related(
        "reviews", "gallery_images"
    )
    category = request.GET.get("category", "all")
    material = request.GET.get("material", "all")
    search = request.GET.get("search", "").strip()
    sort = request.GET.get("sort", "newest")

    if category not in ("all", "watches"):
        queryset = queryset.filter(category=category)
    elif category == "watches":
        queryset = queryset.filter(category="ساعات")

    if material in ("silver", "gold"):
        queryset = queryset.filter(material=material)

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(name_en__icontains=search)
        )

    sort_field = {
        "price_asc": "price",
        "price_desc": "-price",
        "oldest": "created_at",
    }.get(sort, "-created_at")
    queryset = queryset.order_by(sort_field)

    return JsonResponse([product_payload(product) for product in queryset], safe=False)


# Return one product and its reviews.
@require_GET
def product_api(request, product_id):
    ensure_seed_data()

    try:
        product = Product.objects.prefetch_related(
            "reviews", "gallery_images"
        ).get(pk=product_id, is_active=True)
    except Product.DoesNotExist:
        return JsonResponse({"error": "المنتج غير موجود"}, status=404)

    return JsonResponse(product_payload(product))


# Create a customer review for a product.
@require_POST
def review_api(request, product_id):
    try:
        payload = json.loads(request.body or "{}")
        rating = int(payload.get("rating", 0))
        comment = str(payload.get("comment", "")).strip()

        if not 1 <= rating <= 5 or not comment:
            raise ValueError

        review = Review.objects.create(
            product_id=product_id,
            customer_name=str(payload.get("name", "زائر"))[:100],
            comment=comment,
            rating=rating,
        )
        return JsonResponse(
            {
                "ok": True,
                "review": {
                    "name": review.customer_name,
                    "comment": review.comment,
                    "rating": review.rating,
                },
            }
        )
    except (ValueError, Product.DoesNotExist):
        return JsonResponse({"error": "يرجى إدخال تقييم وتعليق صحيحين."}, status=400)


# Handle the local assistant endpoint.
@require_POST
def chat_api(request):
    payload = json.loads(request.body or "{}")
    message = re.sub(r"\s+", " ", str(payload.get("message", "")))
    language = "en" if payload.get("language") == "en" else "ar"
    return JsonResponse({"reply": answer_for(message, language)})


# Render checkout and create an order from the submitted cart.
@require_http_methods(["GET", "POST"])
def checkout(request):
    ensure_seed_data()

    checkout_products = list(
        Product.objects.filter(is_active=True, sold_out=False).values(
            "id", "name", "name_en", "price"
        )
    )
    if request.method == "GET":
        return render(
            request,
            "checkout.html",
            {"checkout_products": checkout_products},
        )

    try:
        payload = json.loads(request.POST.get("cart", "[]"))
        if (
            not isinstance(payload, list)
            or not payload
            or len(payload) > 100
            or not request.POST.get("terms")
        ):
            raise ValueError

        customer_name = request.POST.get("customer_name", "").strip()
        phone = request.POST.get("phone", "").strip()
        country = request.POST.get("country", "").strip()
        city = request.POST.get("city", "").strip()
        district = request.POST.get("district", "").strip()
        street = request.POST.get("street", "").strip()
        payment_method = request.POST.get("payment_method", "").strip()
        if (
            not all((customer_name, phone, country, city, district, street))
            or payment_method not in dict(Order.PAYMENT_CHOICES)
            or len(customer_name) > 120
            or len(phone) > 40
            or len(country) > 80
            or len(city) > 80
            or len(district) > 120
            or len(street) > 160
        ):
            raise ValueError

        gift_packaging = request.POST.get("gift_packaging") == "on"
        custom_message_enabled = request.POST.get("custom_message_enabled") == "on"
        custom_gift_message = request.POST.get("custom_gift_message", "").strip()
        if custom_message_enabled and not custom_gift_message:
            raise ValueError
        if len(custom_gift_message) > 300:
            raise ValueError
        if not custom_message_enabled:
            custom_gift_message = ""

        cart_quantities = {}
        for raw in payload:
            if not isinstance(raw, dict):
                raise ValueError
            product_id = int(raw["id"])
            quantity = int(raw.get("quantity", 1))
            if product_id < 1 or not 1 <= quantity <= 99:
                raise ValueError
            cart_quantities[product_id] = cart_quantities.get(product_id, 0) + quantity
            if cart_quantities[product_id] > 99:
                raise ValueError

        available_products = Product.objects.filter(
            pk__in=cart_quantities,
            is_active=True,
            sold_out=False,
        ).in_bulk()
        if len(available_products) != len(cart_quantities):
            raise Product.DoesNotExist

        items = []
        subtotal = Decimal("0")
        for product_id, quantity in cart_quantities.items():
            product = available_products[product_id]
            subtotal += product.price * quantity
            items.append((product, quantity))

        promo = request.POST.get("promo_code", "").strip().upper()
        discount = (
            (subtotal * Decimal("0.10")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            if promo == "DORRA10"
            else Decimal("0.00")
        )
        shipping = Decimal("30")
        service = Decimal("7")
        addons_total = (
            (GIFT_ADDON_PRICE if gift_packaging else Decimal("0.00"))
            + (
                GIFT_ADDON_PRICE
                if custom_message_enabled
                else Decimal("0.00")
            )
        )
        total = subtotal + addons_total + shipping + service - discount
        if total > Decimal("99999999.99"):
            raise ValueError

        with transaction.atomic():
            order = Order.objects.create(
                customer_name=customer_name,
                phone=phone,
                country=country,
                city=city,
                district=district,
                street=street,
                notes=request.POST.get("notes", ""),
                is_gift=bool(request.POST.get("is_gift")),
                gift_packaging=gift_packaging,
                custom_message_enabled=custom_message_enabled,
                custom_gift_message=custom_gift_message,
                payment_method=payment_method,
                promo_code=promo,
                discount=discount,
                subtotal=subtotal,
                total=total,
            )
            OrderItem.objects.bulk_create(
                [
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.price,
                    )
                    for product, quantity in items
                ]
            )

        request.session.pop("cart", None)
        request.session.pop("dorra-cart", None)
        request.session.modified = True
        invoice_token = signing.dumps(
            order.pk, salt="store.order.invoice", compress=True
        )
        invoice_url = reverse("customer_invoice", args=[order.pk])
        invoice_url += "?" + urlencode({"token": invoice_token})
        return render(
            request,
            "checkout_success.html",
            {"order": order, "invoice_url": invoice_url},
        )
    except (
        KeyError,
        ValueError,
        InvalidOperation,
        Product.DoesNotExist,
        json.JSONDecodeError,
        TypeError,
    ):
        return render(
            request,
            "checkout.html",
            {
                "error": "يرجى إكمال البيانات واختيار منتجات متاحة.",
                "checkout_products": checkout_products,
            },
            status=400,
        )


@never_cache
@require_GET
def customer_invoice(request, order_id):
    token = request.GET.get("token", "")
    try:
        signed_order_id = signing.loads(
            token,
            salt="store.order.invoice",
            max_age=60 * 60 * 24 * 90,
        )
        if int(signed_order_id) != order_id:
            raise signing.BadSignature("Invoice token does not match order.")
        order = Order.objects.get(pk=order_id)
    except (signing.BadSignature, TypeError, ValueError, Order.DoesNotExist):
        raise Http404("Invoice not found.")
    return render_order_invoice(request, order)


# ---------------------------------------------------------
# لوحة تحكم المتجر (Dashboard)
# ---------------------------------------------------------
@staff_member_required
@require_GET
def admin_dashboard(request):
    can_view_orders = request.user.has_perm("store.view_order") or request.user.has_perm(
        "store.change_order"
    )
    can_view_products = request.user.has_perm("store.view_product") or request.user.has_perm(
        "store.change_product"
    )

    if not (can_view_orders or can_view_products):
        raise PermissionDenied

    # Build each dataset only when the staff user may view that model.
    context = {
        "can_view_orders": can_view_orders,
        "can_view_products": can_view_products,
    }

    if can_view_orders:
        context.update(
            {
                "orders_count": Order.objects.count(),
                "sales": Order.objects.filter(status="delivered").aggregate(
                    total=Sum("total")
                )["total"]
                or Decimal("0.00"),
                "recent_orders": Order.objects.only(
                    "id", "customer_name", "total", "status", "created_at"
                ).order_by("-created_at")[:5],
            }
        )

    if can_view_products:
        context["products_count"] = Product.objects.count()

    return render(request, "swipe_dashboard.html", context)