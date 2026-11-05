import json
from decimal import Decimal
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from django.urls import reverse

from store.models import Order, Product, ProductImage
from store.templatetags.admin_dashboard import dashboard_metrics


class AdminDashboardTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.admin_user = user_model.objects.create_superuser(
            username="dashboard-admin",
            email="admin@example.com",
            password="test-password",
        )
        Product.objects.create(
            name="Silver Set",
            price=Decimal("120.00"),
            description="Test product",
            is_active=True,
        )
        Order.objects.create(
            customer_name="Pending Buyer",
            phone="0500000000",
            country="UAE",
            city="Dubai",
            district="Central",
            street="Test Street",
            payment_method="cash",
            status="pending",
            total=Decimal("50.00"),
        )
        Order.objects.create(
            customer_name="Delivered Buyer",
            phone="0500000001",
            country="UAE",
            city="Dubai",
            district="Central",
            street="Test Street",
            payment_method="card",
            status="delivered",
            total=Decimal("85.50"),
        )

    def test_dashboard_shows_permission_scoped_store_metrics(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(reverse("admin:index"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "إجمالي المنتجات")
        self.assertContains(response, "طلبات قيد الانتظار")
        self.assertContains(response, "85.50")
        self.assertContains(response, "Pending Buyer")
        self.assertEqual(
            dashboard_metrics(self.admin_user)["orders"]["completed_sales"],
            Decimal("85.50"),
        )

    def test_dashboard_hides_order_data_without_order_permission(self):
        user = get_user_model().objects.create_user(
            username="product-manager",
            password="test-password",
            is_staff=True,
        )
        user.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="store",
                codename="view_product",
            )
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin:index"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "إجمالي المنتجات")
        self.assertNotContains(response, "أحدث الطلبات")
        self.assertNotContains(response, "Pending Buyer")

    def test_legacy_dashboard_redirects_anonymous_users(self):
        response = self.client.get(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login/", response["Location"])

    def test_staff_without_model_permissions_cannot_view_dashboard(self):
        user = get_user_model().objects.create_user(
            username="unprivileged-staff",
            password="test-password",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 403)
        self.assertNotContains(response, "Pending Buyer", status_code=403)

    def test_product_only_user_does_not_receive_order_data(self):
        user = get_user_model().objects.create_user(
            username="product-only-staff",
            password="test-password",
            is_staff=True,
        )
        user.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="store",
                codename="view_product",
            )
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "المنتجات")
        self.assertNotContains(response, "أحدث الطلبات")
        self.assertNotContains(response, "Pending Buyer")
        self.assertNotIn("orders_count", response.context)
        self.assertNotIn("recent_orders", response.context)

    def test_order_only_user_does_not_receive_product_data(self):
        user = get_user_model().objects.create_user(
            username="order-only-staff",
            password="test-password",
            is_staff=True,
        )
        user.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="store",
                codename="view_order",
            )
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "أحدث الطلبات")
        self.assertNotContains(response, "إدارة المنتجات")
        self.assertNotIn("products_count", response.context)

    def test_change_permission_also_grants_admin_equivalent_view_access(self):
        user = get_user_model().objects.create_user(
            username="order-editor",
            password="test-password",
            is_staff=True,
        )
        user.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="store",
                codename="change_order",
            )
        )
        self.client.force_login(user)

        response = self.client.get(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "أحدث الطلبات")
        self.assertContains(response, "Pending Buyer")

    def test_dashboard_rejects_non_get_requests(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(reverse("admin_dashboard"))

        self.assertEqual(response.status_code, 405)


class CheckoutInvoiceTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="طقم فضي",
            name_en="Silver Set",
            price=Decimal("100.00"),
            description="وصف",
            description_en="Description",
        )

    def checkout_payload(self):
        return {
            "cart": json.dumps([{"id": self.product.pk, "quantity": 2}]),
            "terms": "on",
            "customer_name": "Test Customer",
            "phone": "+971500000000",
            "country": "UAE",
            "city": "Dubai",
            "district": "Central",
            "street": "Test Street 1",
            "payment_method": "cash",
        }

    def test_checkout_charges_and_saves_both_addons_and_clears_session_cart(self):
        session = self.client.session
        session["cart"] = [{"id": self.product.pk, "quantity": 2}]
        session["dorra-cart"] = [{"id": self.product.pk, "quantity": 2}]
        session.save()
        payload = self.checkout_payload()
        payload.update(
            {
                "gift_packaging": "on",
                "custom_message_enabled": "on",
                "custom_gift_message": "مبارك عليكِ",
            }
        )

        response = self.client.post(reverse("checkout"), payload)

        self.assertEqual(response.status_code, 200)
        order = Order.objects.get()
        self.assertEqual(order.subtotal, Decimal("200.00"))
        self.assertEqual(order.total, Decimal("247.00"))
        self.assertTrue(order.gift_packaging)
        self.assertTrue(order.custom_message_enabled)
        self.assertEqual(order.custom_gift_message, "مبارك عليكِ")
        self.assertEqual(order.items.get().quantity, 2)
        current_session = self.client.session
        self.assertNotIn("cart", current_session)
        self.assertNotIn("dorra-cart", current_session)
        self.assertContains(response, "عرض الفاتورة")

    def test_checkout_only_charges_selected_addons_and_rejects_empty_message(self):
        payload = self.checkout_payload()
        payload["gift_packaging"] = "on"
        response = self.client.post(reverse("checkout"), payload)

        self.assertEqual(response.status_code, 200)
        order = Order.objects.get()
        self.assertEqual(order.total, Decimal("242.00"))
        self.assertTrue(order.gift_packaging)
        self.assertFalse(order.custom_message_enabled)

        invalid_payload = self.checkout_payload()
        invalid_payload["custom_message_enabled"] = "on"
        response = self.client.post(reverse("checkout"), invalid_payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_uses_database_prices_and_ignores_legacy_cart_addons(self):
        payload = self.checkout_payload()
        payload["cart"] = json.dumps(
            [
                {
                    "id": self.product.pk,
                    "quantity": 1,
                    "price": "0.01",
                    "gift_packaging": True,
                    "gift_message": "untrusted client data",
                }
            ]
        )

        response = self.client.post(reverse("checkout"), payload)

        self.assertEqual(response.status_code, 200)
        order = Order.objects.get()
        self.assertEqual(order.total, Decimal("137.00"))
        self.assertFalse(order.gift_packaging)
        self.assertFalse(order.custom_message_enabled)
        self.assertEqual(order.items.get().unit_price, self.product.price)

    def test_checkout_caps_aggregated_quantity_per_product(self):
        payload = self.checkout_payload()
        payload["cart"] = json.dumps(
            [
                {"id": self.product.pk, "quantity": 50},
                {"id": self.product.pk, "quantity": 50},
            ]
        )

        response = self.client.post(reverse("checkout"), payload)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_catalog_api_exposes_english_fields_and_gallery_list(self):
        ProductImage.objects.create(
            product=self.product,
            image="products/gallery/sample.jpg",
            alt_text="Sample gallery image",
        )
        response = self.client.get(
            reverse("products_api"),
            {"search": "Silver Set"},
        )

        self.assertEqual(response.status_code, 200)
        product = json.loads(response.content)[0]
        self.assertEqual(product["name_en"], "Silver Set")
        self.assertEqual(product["description_en"], "Description")
        self.assertEqual(
            product["images"],
            ["/media/products/gallery/sample.jpg"],
        )

    def test_signed_customer_invoice_is_valid_and_tampering_is_denied(self):
        payload = self.checkout_payload()
        payload.update(
            {
                "gift_packaging": "on",
                "custom_message_enabled": "on",
                "custom_gift_message": "Invoice message",
            }
        )
        response = self.client.post(reverse("checkout"), payload)
        order = Order.objects.get()
        invoice_url = response.context["invoice_url"]
        token = parse_qs(urlparse(invoice_url).query)["token"][0]

        invoice_response = self.client.get(
            reverse("customer_invoice", args=[order.pk]),
            {"token": token},
        )
        self.assertEqual(invoice_response.status_code, 200)
        self.assertContains(invoice_response, "Purchase Invoice")
        self.assertContains(invoice_response, "Test Customer")
        self.assertContains(invoice_response, "Gift packaging")
        self.assertContains(invoice_response, "Invoice message")
        self.assertContains(invoice_response, "247.00 AED")
        self.assertIn("no-store", invoice_response["Cache-Control"])

        invalid_response = self.client.get(
            reverse("customer_invoice", args=[order.pk]),
            {"token": "tampered"},
        )
        self.assertEqual(invalid_response.status_code, 404)

    def test_admin_invoice_requires_order_view_permission(self):
        order = Order.objects.create(
            customer_name="Admin Invoice",
            phone="0500000000",
            country="UAE",
            city="Dubai",
            district="Central",
            street="Test Street",
            payment_method="cash",
        )
        user = get_user_model().objects.create_user(
            username="invoice-viewer",
            password="test-password",
            is_staff=True,
        )
        user.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="store",
                codename="view_order",
            )
        )
        self.client.force_login(user)

        response = self.client.get(
            reverse("admin:store_order_invoice", args=[order.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Purchase Invoice")

    def test_admin_invoice_denies_staff_without_order_permission(self):
        order = Order.objects.create(
            customer_name="Restricted Invoice",
            phone="0500000000",
            country="UAE",
            city="Dubai",
            district="Central",
            street="Test Street",
            payment_method="cash",
        )
        user = get_user_model().objects.create_user(
            username="no-invoice-permission",
            password="test-password",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get(
            reverse("admin:store_order_invoice", args=[order.pk])
        )

        self.assertEqual(response.status_code, 403)
