(() => {
    const form = document.querySelector('#checkoutForm');
    if (!form) return;

    const translations = {
        ar: {
            backToShop: '← العودة للمتجر', checkoutTitle: 'إتمام الطلب',
            address: 'العنوان', addons: 'الإضافات', confirmation: 'التأكيد',
            deliveryDetails: 'بيانات العنوان والتوصيل', name: 'الاسم',
            phone: 'رقم الهاتف', country: 'الدولة', city: 'المدينة',
            district: 'المنطقة', street: 'اسم ورقم الشارع',
            notes: 'ملاحظات إضافية', sendAsGift: 'إرسال كهدية',
            giftAddons: 'إضافات الهدية', addonNote: 'تطبق رسوم كل إضافة مرة واحدة على الطلب.',
            giftPackaging: 'تغليف هدية', customMessage: 'رسالة مخصصة',
            messageText: 'نص الرسالة', paymentSection: 'التوصيل والخصم والدفع',
            shippingNote: 'التوصيل من 1 إلى 3 أيام · رسوم التوصيل 30 د.إ',
            promoCode: 'كود الخصم', payByCard: 'بطاقة ائتمانية / دفع بنكي',
            cashOnDelivery: 'الدفع عند الاستلام',
            confirmByWhatsapp: 'تأكيد الطلب عبر واتساب',
            orderSummary: 'ملخص الطلب', subtotal: 'المجموع الجزئي',
            shipping: 'التوصيل', serviceFee: 'رسوم الخدمة',
            discount: 'الخصم', grandTotal: 'الإجمالي النهائي',
            agreeToTerms: 'أوافق على', termsButton: 'الشروط والأحكام وسياسة الإرجاع',
            placeOrder: 'تأكيد الطلب', policyTitle: 'سياسة الإرجاع والشحن والإلغاء',
            returnTerms: '<b>سياسة الإرجاع والاستبدال:</b><br>لا يوجد لدينا إرجاع إلا في حالة عيب مصنعي يتم الاستبدال.<br>يجب تقديم طلب الإرجاع خلال 3 أيام من استلام المنتج.<br>يجب أن تكون المنتجات المُعادة غير مستخدمة وفي عبوتها الأصلية.<br>في حالة طلب استبدال من دون أي عيوب يتم دفع رسوم التوصيل.',
            shippingTerms: '<b>سياسة الشحن:</b><br>يجب على العملاء تقديم تفاصيل شحن دقيقة.<br>يتحمل العميل مسؤولية تتبع الشحنات والرد على مكالمات التسليم.<br>للطلبات الدولية، يتحمل العميل الرسوم الجمركية وضريبة القيمة المضافة.',
            cancellationTerms: '<b>سياسة الإلغاء:</b><br>لا يمكن إلغاء الطلبات بعد تأكيدها.',
            messagePlaceholder: 'اكتبي رسالتك هنا...',
            emptyCart: 'السلة فارغة. أضيفي منتجات قبل إتمام الطلب.',
            submitting: 'جارٍ تسجيل الطلب…',
            checkoutError: 'يرجى إكمال البيانات واختيار منتجات متاحة.',
        },
        en: {
            backToShop: '← Back to shop', checkoutTitle: 'Checkout',
            address: 'Address', addons: 'Add-ons', confirmation: 'Confirmation',
            deliveryDetails: 'Delivery details', name: 'Full name',
            phone: 'Phone number', country: 'Country', city: 'City',
            district: 'District', street: 'Street address',
            notes: 'Additional notes', sendAsGift: 'Send as a gift',
            giftAddons: 'Gift add-ons', addonNote: 'Each selected add-on is charged once per order.',
            giftPackaging: 'Gift packaging', customMessage: 'Custom message',
            messageText: 'Message text', paymentSection: 'Delivery, discount & payment',
            shippingNote: 'Delivery takes 1–3 days · Shipping fee AED 30',
            promoCode: 'Discount code', payByCard: 'Credit card / bank payment',
            cashOnDelivery: 'Cash on delivery',
            confirmByWhatsapp: 'Confirm order via WhatsApp',
            orderSummary: 'Order summary', subtotal: 'Subtotal',
            shipping: 'Shipping', serviceFee: 'Service fee',
            discount: 'Discount', grandTotal: 'Grand total',
            agreeToTerms: 'I agree to', termsButton: 'terms and return policy',
            placeOrder: 'Place order', policyTitle: 'Returns, shipping & cancellation policy',
            returnTerms: '<b>Returns and exchanges:</b><br>Returns are accepted only for manufacturing defects; eligible items will be exchanged.<br>Submit a request within 3 days of delivery.<br>Returned products must be unused and in their original packaging.<br>Exchange requests without defects incur a delivery fee.',
            shippingTerms: '<b>Shipping:</b><br>Provide accurate shipping details.<br>Customers are responsible for tracking shipments and responding to delivery calls.<br>For international orders, customs and VAT are the customer’s responsibility.',
            cancellationTerms: '<b>Cancellation:</b><br>Orders cannot be cancelled after confirmation.',
            messagePlaceholder: 'Write your message here...',
            emptyCart: 'Your cart is empty. Add products before checkout.',
            submitting: 'Submitting order…',
            checkoutError: 'Please complete all required fields and choose available products.',
        },
    };
    let language = 'ar';
    try {
        language = localStorage.getItem('dorra-language') === 'en' ? 'en' : 'ar';
    } catch (error) {
        console.error('Could not read language preference.', error);
    }
    const money = (value) => language === 'en'
        ? `AED ${Number(value || 0).toFixed(2)}`
        : `${Number(value || 0).toFixed(2)} د.إ`;
    const readCart = () => {
        try {
            const value = JSON.parse(localStorage.getItem('dorra-cart') || '[]');
            if (!Array.isArray(value)) return [];
            return value
                .filter((item) => item && Number.isInteger(Number(item.id)))
                .map((item) => ({
                    id: Number(item.id),
                    quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
                    price: Math.max(0, Number(item.price) || 0),
                    name: String(item.name || '').slice(0, 160),
                }));
        } catch {
            return [];
        }
    };

    let trustedProducts = [];
    try {
        const payload = JSON.parse(
            document.querySelector('#checkout-products-data')?.textContent || '[]',
        );
        if (Array.isArray(payload)) trustedProducts = payload;
    } catch (error) {
        console.error('Could not read checkout product data.', error);
    }
    const productsById = new Map(
        trustedProducts.map((product) => [Number(product.id), product]),
    );
    const cart = readCart().flatMap((item) => {
        const product = productsById.get(item.id);
        if (!product) return [];
        return [{
            id: item.id,
            quantity: item.quantity,
            price: Number(product.price),
            name: language === 'en' && product.name_en
                ? product.name_en
                : product.name,
        }];
    });
    const cartField = document.querySelector('#checkoutCart');
    const itemsElement = document.querySelector('#checkoutItems');
    const submitButton = document.querySelector('#submitOrder');
    const packagingInput = document.querySelector('#giftPackaging');
    const messageEnabled = document.querySelector('#customMessageEnabled');
    const messageInput = document.querySelector('#customGiftMessage');
    const promoInput = document.querySelector('#promoCode');
    const error = document.querySelector('.form-error');
    const ADDON_PRICE = 5;
    const SHIPPING = 30;
    const SERVICE = 7;

    function renderCheckoutItems() {
        itemsElement.replaceChildren();
        for (const item of cart) {
            const product = productsById.get(item.id);
            const productName = language === 'en' && product.name_en
                ? product.name_en
                : product.name;
            const row = document.createElement('div');
            row.className = 'checkout-item';
            const title = document.createElement('span');
            title.textContent = `${productName} × ${item.quantity}`;
            const price = document.createElement('b');
            price.textContent = money(item.price * item.quantity);
            row.append(title, price);
            itemsElement.append(row);
        }

        if (!cart.length) {
            const empty = document.createElement('p');
            empty.className = 'checkout-empty';
            empty.setAttribute('role', 'alert');
            empty.textContent = translations[language].emptyCart;
            itemsElement.append(empty);
        }
        submitButton.disabled = !cart.length;
    }

    function applyLanguage() {
        const dictionary = translations[language];
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.title = language === 'en' ? 'Checkout | DorraJewelery' : 'الدفع | DorraJewelery';
        document.querySelectorAll('[data-checkout-i18n]').forEach((element) => {
            const translation = dictionary[element.dataset.checkoutI18n];
            if (translation) {
                if (['returnTerms', 'shippingTerms', 'cancellationTerms'].includes(element.dataset.checkoutI18n)) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        document.querySelector('#checkoutLanguage').value = language;
        messageInput.placeholder = language === 'en'
            ? dictionary.messagePlaceholder
            : dictionary.messagePlaceholder;
        document.querySelectorAll('[data-country]').forEach((option) => {
            const labels = language === 'en'
                ? { uae: 'United Arab Emirates', sa: 'Saudi Arabia', kw: 'Kuwait', qa: 'Qatar', bh: 'Bahrain', om: 'Oman', jo: 'Jordan', eg: 'Egypt', us: 'United States', uk: 'United Kingdom', other: 'Other' }
                : { uae: 'الإمارات العربية المتحدة', sa: 'السعودية', kw: 'الكويت', qa: 'قطر', bh: 'البحرين', om: 'عمان', jo: 'الأردن', eg: 'مصر', us: 'الولايات المتحدة', uk: 'المملكة المتحدة', other: 'أخرى' };
            option.textContent = labels[option.dataset.country];
        });
        const errorElement = document.querySelector('[data-checkout-error]');
        if (errorElement) errorElement.textContent = dictionary.checkoutError;
        renderCheckoutItems();
        document.querySelector('#termsButton').setAttribute(
            'aria-label',
            language === 'en' ? 'Open terms and conditions' : 'عرض الشروط والأحكام',
        );
    }

    document.querySelector('#checkoutLanguage').addEventListener('change', (event) => {
        language = event.target.value === 'en' ? 'en' : 'ar';
        try {
            localStorage.setItem('dorra-language', language);
        } catch (error) {
            console.error('Could not save language preference.', error);
        }
        applyLanguage();
        updateTotal();
    });

    applyLanguage();
    cartField.value = JSON.stringify(
        cart.map(({ id, quantity }) => ({ id, quantity })),
    );

    function updateTotal() {
        const subtotal = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );
        const packaging = packagingInput.checked ? ADDON_PRICE : 0;
        const customMessage = messageEnabled.checked ? ADDON_PRICE : 0;
        const discount = promoInput.value.trim().toUpperCase() === 'DORRA10'
            ? Math.round(subtotal * 10) / 100
            : 0;

        document.querySelector('#checkoutSubtotal').textContent = money(subtotal);
        document.querySelector('#checkoutPackagingFee').textContent = money(packaging);
        document.querySelector('#checkoutMessageFee').textContent = money(customMessage);
        document.querySelector('#checkoutDiscount').textContent = `-${money(discount)}`;
        document.querySelector('#checkoutTotal').textContent = money(
            subtotal + packaging + customMessage + SHIPPING + SERVICE - discount,
        );
    }

    function updateMessageState() {
        messageInput.disabled = !messageEnabled.checked;
        messageInput.required = messageEnabled.checked;
        if (!messageEnabled.checked) messageInput.value = '';
        updateTotal();
    }

    packagingInput.addEventListener('change', updateTotal);
    messageEnabled.addEventListener('change', updateMessageState);
    promoInput.addEventListener('input', updateTotal);
    updateMessageState();

    const paymentOptions = form.querySelectorAll('[name="payment_method"]');
    paymentOptions.forEach((input) => {
        input.addEventListener('change', () => {
            const cardFields = document.querySelector('#cardFields');
            if (cardFields) cardFields.hidden = input.value !== 'card';
        });
    });

    const termsModal = document.querySelector('#termsModal');
    const termsBackdrop = document.querySelector('#termsBackdrop');
    const openTerms = () => {
        termsModal.classList.add('open');
        termsBackdrop.classList.add('open');
        termsModal.querySelector('button').focus();
    };
    const closeTerms = () => {
        termsModal.classList.remove('open');
        termsBackdrop.classList.remove('open');
        document.querySelector('#termsButton').focus();
    };
    document.querySelector('#termsButton').addEventListener('click', openTerms);
    document.querySelector('#closeTerms').addEventListener('click', closeTerms);
    termsBackdrop.addEventListener('click', closeTerms);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && termsModal.classList.contains('open')) {
            closeTerms();
        }
    });

    form.addEventListener('submit', (event) => {
        if (!cart.length || !form.reportValidity()) {
            event.preventDefault();
            return;
        }
        if (messageEnabled.checked && !messageInput.value.trim()) {
            event.preventDefault();
            messageInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = translations[language].submitting;
        if (error) error.hidden = true;
    });
})();
