from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("checkout/", views.checkout, name="checkout"),
    path("api/products/", views.products_api, name="products_api"),
    path("api/products/<int:product_id>/", views.product_api, name="product_api"),
    path("api/products/<int:product_id>/reviews/", views.review_api, name="review_api"),
    path("api/chat/", views.chat_api, name="chat_api"),
    path(
        "orders/<int:order_id>/invoice/",
        views.customer_invoice,
        name="customer_invoice",
    ),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
]
