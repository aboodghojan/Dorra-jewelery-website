from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("all_sets", "جميع المنتجات"),
        ("large_sets", "أطقم كبيرة"),
        ("small_sets", "أطقم صغيرة"),
        ("ساعات", "ساعات"),
        ("heritage_sets", "أطقم تراثية"),
        ("bracelet_ring", "أسوارة وخاتم"),
        ("necklaces", "سلسلة"),
        ("sets", "أطقم"),
    ]
    MATERIAL_CHOICES = [("silver", "فضي"), ("gold", "ذهبي")]

    name = models.CharField(max_length=160)
    name_en = models.CharField(max_length=160, blank=True, null=True)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="all_sets")
    material = models.CharField(max_length=20, choices=MATERIAL_CHOICES, default="silver")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    description = models.TextField()
    description_en = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=30, default="violet")
    badge = models.CharField(max_length=60, blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sold_out = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.name

    @property
    def rating(self):
        return round(self.reviews.aggregate(value=models.Avg("rating"))["value"] or 4.8, 1)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="gallery_images"
    )
    image = models.ImageField(upload_to="products/gallery/")
    alt_text = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "pk"]

    def __str__(self) -> str:
        return self.alt_text or f"{self.product} image {self.pk or ''}".strip()


class Order(models.Model):
    STATUS_CHOICES = [(value, label) for value, label in [
        ("pending", "قيد الانتظار"), ("confirmed", "مؤكد"), ("shipped", "تم الشحن"),
        ("delivered", "تم التسليم"), ("cancelled", "ملغى"),
    ]]
    PAYMENT_CHOICES = [("card", "بطاقة"), ("cash", "الدفع عند الاستلام"), ("whatsapp", "واتساب")]

    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40)
    country = models.CharField(max_length=80)
    city = models.CharField(max_length=80)
    district = models.CharField(max_length=120)
    street = models.CharField(max_length=160)
    notes = models.TextField(blank=True)
    is_gift = models.BooleanField(default=False)
    gift_packaging = models.BooleanField(default=False)
    custom_message_enabled = models.BooleanField(default=False)
    custom_gift_message = models.CharField(max_length=300, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    promo_code = models.CharField(max_length=40, blank=True)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=30)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=7)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"#{self.pk} - {self.customer_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    gift_message = models.CharField(max_length=300, blank=True)
    gift_packaging = models.BooleanField(default=False)

    @property
    def line_total(self):
        return self.unit_price * self.quantity


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    customer_name = models.CharField(max_length=100, default="زائر")
    comment = models.TextField()
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
