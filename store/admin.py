from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.urls import path, reverse
from django.utils.html import format_html

from .invoice_service import render_order_invoice
from .models import Order, OrderItem, Product, ProductImage, Review

admin.site.index_template = "admin/index.html"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product",
        "quantity",
        "formatted_unit_price",
        "gift_packaging",
        "gift_message",
    )
    fields = (
        "product",
        "quantity",
        "formatted_unit_price",
        "gift_packaging",
        "gift_message",
    )
    can_delete = False

    @admin.display(description="سعر الوحدة")
    def formatted_unit_price(self, obj):
        return f"{obj.unit_price:,.2f} د.إ"


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "sort_order")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "material", "formatted_price", "sold_out", "is_active")
    list_filter = ("category", "material", "sold_out", "is_active")
    search_fields = ("name", "name_en", "description", "description_en")
    list_editable = ("sold_out", "is_active")
    list_per_page = 25
    inlines = [ProductImageInline]

    @admin.display(description="السعر", ordering="price")
    def formatted_price(self, obj):
        return f"{obj.price:,.2f} د.إ"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "formatted_total",
        "payment_method",
        "status_badge",
        "invoice_link",
        "created_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("customer_name", "phone")
    list_per_page = 25
    show_full_result_count = False
    inlines = [OrderItemInline]

    def get_urls(self):
        custom_urls = [
            path(
                "<int:object_id>/invoice/",
                self.admin_site.admin_view(self.invoice_view),
                name="store_order_invoice",
            )
        ]
        return custom_urls + super().get_urls()

    def invoice_view(self, request, object_id):
        if not (
            request.user.has_perm("store.view_order")
            or request.user.has_perm("store.change_order")
        ):
            raise PermissionDenied
        order = self.get_object(request, object_id)
        if order is None:
            raise Http404("Order not found.")
        return render_order_invoice(request, order)

    @admin.display(description="الفاتورة")
    def invoice_link(self, obj):
        return format_html(
            '<a href="{}">عرض / طباعة</a>',
            reverse("admin:store_order_invoice", args=[obj.pk]),
        )

    @admin.display(description="الإجمالي", ordering="total")
    def formatted_total(self, obj):
        return f"{obj.total:,.2f} د.إ"

    @admin.display(description="الحالة", ordering="status")
    def status_badge(self, obj):
        badge_map = {
            "pending": ("badge-warning", "قيد الانتظار"),
            "confirmed": ("badge-info", "مؤكد"),
            "shipped": ("badge-primary", "تم الشحن"),
            "delivered": ("badge-success", "تم التوصيل"),
            "cancelled": ("badge-danger", "ملغي"),
        }
        css_class, label = badge_map.get(str(obj.status).lower(), ("badge-secondary", obj.status))
        return format_html(
            '<span class="badge {}" style="font-size: 0.85rem; padding: 5px 10px;">{}</span>',
            css_class,
            label,
        )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity", "formatted_unit_price", "gift_packaging")
    list_select_related = ("order", "product")
    list_per_page = 25

    @admin.display(description="سعر الوحدة", ordering="unit_price")
    def formatted_unit_price(self, obj):
        return f"{obj.unit_price:,.2f} د.إ"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "customer_name", "stars_rating", "created_at")
    list_filter = ("rating",)
    list_select_related = ("product",)
    list_per_page = 25

    @admin.display(description="التقييم", ordering="rating")
    def stars_rating(self, obj):
        stars = "★" * int(obj.rating) + "☆" * (5 - int(obj.rating))
        return format_html('<span style="color: #f39c12; font-size: 1.1rem;">{}</span>', stars)