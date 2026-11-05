from decimal import Decimal

from django import template
from django.db.models import Count, Q, Sum

from store.models import Order, Product

register = template.Library()


@register.simple_tag
def dashboard_metrics(user):
    can_view_products = user.has_perm("store.view_product") or user.has_perm(
        "store.change_product"
    )
    can_view_orders = user.has_perm("store.view_order") or user.has_perm(
        "store.change_order"
    )
    metrics = {
        "can_view_products": can_view_products,
        "can_view_orders": can_view_orders,
    }

    if can_view_products:
        metrics["products"] = Product.objects.aggregate(
            total=Count("pk"),
            active=Count("pk", filter=Q(is_active=True)),
        )

    if can_view_orders:
        metrics["orders"] = Order.objects.aggregate(
            pending=Count("pk", filter=Q(status="pending")),
            completed_sales=Sum("total", filter=Q(status="delivered")),
        )
        metrics["orders"]["completed_sales"] = (
            metrics["orders"]["completed_sales"] or Decimal("0.00")
        )
        metrics["recent_orders"] = Order.objects.only(
            "id", "customer_name", "total", "status", "created_at"
        )[:8]

    return metrics
