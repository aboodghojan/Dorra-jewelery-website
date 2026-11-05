from decimal import Decimal

from django.shortcuts import render


GIFT_ADDON_PRICE = Decimal("5.00")


def render_order_invoice(request, order):
    items = list(order.items.select_related("product").all())
    packaging_fee = GIFT_ADDON_PRICE if order.gift_packaging else Decimal("0.00")
    message_fee = (
        GIFT_ADDON_PRICE if order.custom_message_enabled else Decimal("0.00")
    )
    return render(
        request,
        "store/invoice.html",
        {
            "order": order,
            "items": items,
            "packaging_fee": packaging_fee,
            "message_fee": message_fee,
            "addon_total": packaging_fee + message_fee,
            "address": ", ".join(
                part
                for part in (
                    order.street,
                    order.district,
                    order.city,
                    order.country,
                )
                if part
            ),
        },
    )
