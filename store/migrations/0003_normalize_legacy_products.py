from django.db import migrations


def normalize_products(apps, schema_editor):
    Product = apps.get_model("store", "Product")
    category_map = {"أساور": "bracelet_ring", "سلاسل": "necklaces", "ساعات": "ساعات"}
    material_map = {"سوار": "silver", "سلسال": "gold", "سلسلة": "gold", "ساعة": "gold"}
    for product in Product.objects.all():
        product.category = category_map.get(product.category, product.category)
        first_word = product.name.split()[0]
        product.material = material_map.get(first_word, product.material)
        product.save(update_fields=["category", "material"])


def reverse_normalize(apps, schema_editor):
    Product = apps.get_model("store", "Product")
    category_map = {"bracelet_ring": "أساور", "necklaces": "سلاسل"}
    for product in Product.objects.all():
        product.category = category_map.get(product.category, product.category)
        product.save(update_fields=["category"])


class Migration(migrations.Migration):
    dependencies = [("store", "0002_order_product_image_product_material_and_more")]
    operations = [migrations.RunPython(normalize_products, reverse_normalize)]
