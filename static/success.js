(() => {
    const translations = {
        ar: {
            successTitle: 'شكرًا لطلبك',
            orderPlaced: 'تم تسجيل الطلب رقم',
            forAmount: 'بقيمة',
            contactSoon: 'سنتواصل معك لتأكيد تفاصيل التوصيل.',
            invoiceLink: 'عرض الفاتورة / حفظ PDF',
            returnToShop: 'العودة إلى المتجر',
        },
        en: {
            successTitle: 'Thank you for your order',
            orderPlaced: 'Order',
            forAmount: 'was placed for',
            contactSoon: 'We will contact you to confirm delivery details.',
            invoiceLink: 'View invoice / Save as PDF',
            returnToShop: 'Return to shop',
        },
    };
    const languageSelect = document.querySelector('#successLanguage');
    const total = document.querySelector('#successTotal');

    function setLanguage(language) {
        const activeLanguage = language === 'en' ? 'en' : 'ar';
        document.documentElement.lang = activeLanguage;
        document.documentElement.dir = activeLanguage === 'ar' ? 'rtl' : 'ltr';
        languageSelect.value = activeLanguage;
        document.querySelectorAll('[data-success-i18n]').forEach((element) => {
            element.textContent = translations[activeLanguage][element.dataset.successI18n];
        });
        total.textContent = activeLanguage === 'en'
            ? `AED ${Number(total.dataset.total).toFixed(2)}`
            : `${Number(total.dataset.total).toFixed(2)} د.إ`;
    }

    try {
        localStorage.removeItem('dorra-cart');
        setLanguage(localStorage.getItem('dorra-language'));
    } catch (error) {
        console.error('Could not clear cart or load preferences after checkout.', error);
        setLanguage('ar');
    }

    languageSelect.addEventListener('change', () => {
        try {
            localStorage.setItem('dorra-language', languageSelect.value);
        } catch (error) {
            console.error('Could not save language preference.', error);
        }
        setLanguage(languageSelect.value);
    });
})();
