document.addEventListener('DOMContentLoaded', () => {
    // Application data and shared helpers.
    const productsElement = document.getElementById('products-data');
    let products = [];

    try {
        products = productsElement
            ? JSON.parse(productsElement.textContent || '[]')
            : [];

        if (!Array.isArray(products)) {
            products = [];
        }
    } catch (error) {
        console.error('تعذر قراءة بيانات المنتجات:', error);
    }

    window.PRODUCTS = products;

    const translations = {
        ar: {
            navShop: 'المتجر', navAbout: 'عن درّة', navSupport: 'المساعدة',
            cart: 'السلة', heroTitle: 'كل قطعة<br><em>لها حكاية.</em>',
            heroText: 'مجوهرات مختارة بعناية لترافق لحظاتك الخاصة. تفاصيل ناعمة، حضور لا يُنسى، وأناقة تشبهك.',
            shopNow: 'تسوقي المجموعة ←', discover: 'اكتشفي درّة',
            marqueeBrand: 'مجوهرات درّة', marqueeMoment: 'مصممة للحظاتك',
            collection: 'اختاري قطعتك', collectionText: 'قطع بسيطة، فاخرة، وتدوم معك.',
            searchPlaceholder: 'ابحثي عن قطعة...', searchAria: 'البحث',
            sortAria: 'ترتيب المنتجات', sortNewest: 'الأجدد', sortOldest: 'الأقدم',
            sortPriceAsc: 'السعر: من الأقل للأعلى', sortPriceDesc: 'السعر: من الأعلى للأقل',
            materialAll: 'الكل', materialSilver: 'فضي', materialGold: 'ذهبي',
            aboutTitle: 'لمعة صغيرة،<br><em>أثر كبير.</em>',
            aboutText: 'في درّة نؤمن أن المجوهرات ليست مجرد قطعة. هي ذكرى، هدية، أو لحظة تختارين الاحتفاظ بها إلى الأبد.',
            contact: 'تواصلي معنا ←',
            assistantTitle: 'تحتاجين مساعدة؟<br><em>اسأليني.</em>',
            assistantText: 'اسألي عن المقاسات، الأسعار أو التوصيل.',
            online: 'متصل الآن', chatWelcome: 'أهلًا بكِ في مجوهرات درّة، كيف أساعدك؟',
            chatPlaceholder: 'اكتبي سؤالك هنا...', chatAria: 'رسالتك',
            returnPolicy: 'لا يوجد لدينا إرجاع', total: 'الإجمالي',
            checkout: 'متابعة إلى الدفع', emptyCart: 'السلة فارغة حاليًا.',
            all: 'جميع المنتجات', sets: 'أطقم', large_sets: 'أطقم كبيرة',
            small_sets: 'أطقم صغيرة', 'ساعات': 'ساعات',
            heritage_sets: 'أطقم تراثية', bracelet_ring: 'أسوارة وخاتم',
            necklaces: 'سلسلة', unavailable: 'غير متوفر', addToCart: 'أضف للسلة',
            noProducts: 'لا توجد منتجات مطابقة.', quantity: 'الكمية',
            reviews: 'آراء العملاء', firstReview: 'كوني أول من يشارك رأيه.',
            productDetails: 'تفاصيل المنتج', chatError: 'تعذر إرسال الرسالة. حاولي مرة أخرى.',
        },
        en: {
            navShop: 'Shop', navAbout: 'Our story', navSupport: 'Support',
            cart: 'Cart', heroTitle: 'Every piece<br><em>has a story.</em>',
            heroText: 'Carefully selected jewelry for your special moments. Delicate details, unforgettable presence, and elegance that feels like you.',
            shopNow: 'Shop the collection →', discover: 'Discover Dorra',
            marqueeBrand: 'Dorra Jewelry', marqueeMoment: 'Made for your moments',
            collection: 'Find your piece', collectionText: 'Simple, luxurious pieces made to last.',
            searchPlaceholder: 'Search jewelry...', searchAria: 'Search products',
            sortAria: 'Sort products', sortNewest: 'Newest', sortOldest: 'Oldest',
            sortPriceAsc: 'Price: low to high', sortPriceDesc: 'Price: high to low',
            materialAll: 'All', materialSilver: 'Silver', materialGold: 'Gold',
            aboutTitle: 'A little sparkle,<br><em>a lasting memory.</em>',
            aboutText: 'At Dorra, jewelry is more than an accessory. It is a memory, a gift, or a moment to treasure forever.',
            contact: 'Contact us →',
            assistantTitle: 'Need a little help?<br><em>Ask me.</em>',
            assistantText: 'Ask about sizing, prices, or delivery.',
            online: 'Online now', chatWelcome: 'Welcome to Dorra Jewelry. How can I help?',
            chatPlaceholder: 'Type your question...', chatAria: 'Your message',
            returnPolicy: 'No returns accepted', total: 'Total',
            checkout: 'Proceed to checkout', emptyCart: 'Your cart is empty.',
            all: 'All products', sets: 'Sets', large_sets: 'Large sets',
            small_sets: 'Small sets', 'ساعات': 'Watches',
            heritage_sets: 'Heritage sets', bracelet_ring: 'Bracelet & ring',
            necklaces: 'Necklaces', unavailable: 'Sold out', addToCart: 'Add to cart',
            noProducts: 'No matching products found.', quantity: 'Quantity',
            reviews: 'Customer reviews', firstReview: 'Be the first to leave a review.',
            productDetails: 'Product details', chatError: 'Message failed. Please try again.',
        },
    };

    const categoryKeys = [
        ['all', 'all'], ['sets', 'sets'], ['large_sets', 'large_sets'],
        ['small_sets', 'small_sets'], ['ساعات', 'ساعات'],
        ['heritage_sets', 'heritage_sets'], ['bracelet_ring', 'bracelet_ring'],
        ['necklaces', 'necklaces'],
    ];
    const categoryLabels = Object.fromEntries(
        categoryKeys.map(([key]) => [key, translations.ar[key]]),
    );

    const storedLanguage = (() => {
        try {
            return localStorage.getItem('dorra-language');
        } catch {
            return null;
        }
    })();

    const state = {
        category: 'all',
        material: 'all',
        search: '',
        sort: 'newest',
        modalProduct: null,
        language: storedLanguage === 'en' ? 'en' : 'ar',
        galleryIndex: 0,
        galleryTimer: null,
        galleryPressTimer: null,
        galleryTransitionTimer: null,
        parallaxFrame: null,
        cart: readCart(),
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const money = (value) => state.language === 'en'
        ? `AED ${Number(value || 0).toFixed(2)}`
        : `${Number(value || 0).toFixed(2)} د.إ`;
    const csrfToken = () => $('[name="csrfmiddlewaretoken"]')?.value || '';
    const getProduct = (id) => products.find((product) => product.id === Number(id));
    const text = (key) => translations[state.language][key] || translations.ar[key] || key;
    const localizedName = (product) =>
        state.language === 'en' && product.name_en ? product.name_en : product.name;
    const localizedDescription = (product) =>
        state.language === 'en' && product.description_en
            ? product.description_en
            : product.description;
    const categoryLabel = (key) =>
        translations[state.language][key] || translations.ar[key] || key;
    const escapeHtml = (value) =>
        String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        })[character]);

    // Cart persistence and formatting helpers.
    function readCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('dorra-cart') || '[]');
            if (!Array.isArray(cart)) return [];
            return cart
                .filter((item) => item && Number.isInteger(Number(item.id)))
                .map((item) => ({
                    id: Number(item.id),
                    quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
                    name: String(item.name || ''),
                    price: Number(item.price) || 0,
                }));
        } catch {
            return [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(
                'dorra-cart',
                JSON.stringify(state.cart.map(({ id, quantity, name, price }) => ({
                    id, quantity, name, price,
                }))),
            );
        } catch (error) {
            console.error('Could not persist the shopping cart.', error);
        }
    }

    // Product filtering and catalog rendering.
    function renderCategories() {
        const container = $('#categoryFilters');
        if (!container) return;

        container.innerHTML = Object.entries(categoryLabels)
            .map(
                ([key]) => `
                    <button class="filter ${key === state.category ? 'active' : ''}"
                                    data-category="${key}" type="button">
                        ${escapeHtml(categoryLabel(key))}
                    </button>
                `,
            )
            .join('');
    }

    function visibleProducts() {
        return products
            .filter((product) => {
                const categoryMatches =
                    state.category === 'all' || product.category === state.category;
                const materialMatches =
                    state.material === 'all' || product.material === state.material;
                const searchMatches = `${localizedName(product)} ${product.name} ${product.name_en || ''}`
                    .toLowerCase()
                    .includes(state.search.toLocaleLowerCase(state.language));

                return categoryMatches && materialMatches && searchMatches;
            })
            .sort((first, second) => {
                if (state.sort === 'price_asc') return first.price - second.price;
                if (state.sort === 'price_desc') return second.price - first.price;
                if (state.sort === 'oldest') return first.id - second.id;
                return second.id - first.id;
            });
    }

    function renderProducts() {
        const grid = $('#productGrid');
        if (!grid) return;

        const list = visibleProducts();

        grid.innerHTML = list.length
            ? list
                    .map(
                        (product) => `
                            <article class="product-card ${product.sold_out ? 'sold-out' : ''}"
                                              data-product-id="${product.id}"
                                              data-category="${product.category}">
                                <div class="product-visual ${['gold', 'silver'].includes(product.color) ? product.color : ''}">
                                    ${product.image ? `<img class="product-card-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(localizedName(product))}" loading="lazy">` : ''}
                                    <span class="product-badge">
                                        ${escapeHtml(product.sold_out ? text('unavailable') : product.badge)}
                                    </span>
                                    <span class="product-number">0${product.id}</span>
                                </div>
                                <div class="product-info">
                                    <div>
                                        <p>${escapeHtml(categoryLabel(product.category))}</p>
                                        <h3>${escapeHtml(localizedName(product))}</h3>
                                    </div>
                                    <strong>${money(product.price)}</strong>
                                </div>
                                <p class="product-description">${escapeHtml(localizedDescription(product))}</p>
                                <button class="add-button"
                                                data-add-id="${product.id}"
                                                type="button"
                                                ${product.sold_out ? 'disabled' : ''}>
                                    ${escapeHtml(product.sold_out ? text('unavailable') : text('addToCart'))} <span>+</span>
                                </button>
                            </article>
                        `,
                    )
                    .join('')
            : `<p class="empty-state">${escapeHtml(text('noProducts'))}</p>`;
    }

    // Cart drawer rendering and quantity management.
    function renderCart() {
        const count = $('#cartCount');
        const items = $('#cartItems');
        const total = $('#cartTotal');

        if (!count || !items || !total) return;

        count.textContent = state.cart.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0,
        );

        items.innerHTML = state.cart.length
            ? state.cart
                    .map(
                        (item, index) => `
                            <div class="cart-item">
                                <div>
                                    <strong>${escapeHtml(localizedName(getProduct(item.id) || item))}</strong>
                                    <small>${item.quantity} × ${money(getProduct(item.id)?.price ?? item.price)}</small>
                                </div>
                                <div class="cart-qty">
                                    <button type="button" data-decrease="${index}">−</button>
                                    <b>${item.quantity}</b>
                                    <button type="button" data-increase="${index}">+</button>
                                </div>
                                <button class="remove-item" type="button" data-remove="${index}">×</button>
                            </div>
                        `,
                    )
                    .join('')
            : `<p class="empty-cart">${escapeHtml(text('emptyCart'))}</p>`;

        total.textContent = money(
            state.cart.reduce(
                (sum, item) => sum + Number(getProduct(item.id)?.price ?? item.price) * Number(item.quantity),
                0,
            ),
        );
    }

    function toggleCart(open) {
        const drawer = $('#cartDrawer');
        const backdrop = $('#drawerBackdrop');

        if (!drawer || !backdrop) return;

        drawer.classList.toggle('open', Boolean(open));
        backdrop.classList.toggle('open', Boolean(open));
        drawer.setAttribute('aria-hidden', String(!open));
    }

    function changeQuantity(index, amount) {
        if (!state.cart[index]) return;

        state.cart[index].quantity = Math.min(
            99,
            state.cart[index].quantity + amount,
        );

        if (state.cart[index].quantity < 1) {
            state.cart.splice(index, 1);
        }

        saveCart();
        renderCart();
    }

    function addToCart(id, quantity = 1) {
        const product = getProduct(id);
        if (!product || product.sold_out) return;

        const existing = state.cart.find((item) => item.id === product.id);

        if (existing) {
            existing.quantity = Math.min(99, existing.quantity + quantity);
        } else {
            state.cart.push({
                id: product.id,
                name: localizedName(product),
                price: product.price,
                quantity: Math.min(99, quantity),
            });
        }

        saveCart();
        renderCart();
        toggleCart(true);
    }

    // Product quick-view modal.
    function closeModal() {
        const modal = $('#productModal');
        const backdrop = $('#productBackdrop');

        if (!modal || !backdrop) return;

        stopGallery();
        state.modalProduct = null;
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function stopGallery() {
        if (state.galleryTimer) window.clearInterval(state.galleryTimer);
        if (state.galleryPressTimer) window.clearTimeout(state.galleryPressTimer);
        if (state.galleryTransitionTimer) window.clearTimeout(state.galleryTransitionTimer);
        state.galleryTimer = null;
        state.galleryPressTimer = null;
        state.galleryTransitionTimer = null;
        $('.modal-product-image')?.classList.remove('is-changing');
    }

    function advanceGallery(direction = 1) {
        const images = state.modalProduct?.images || [];
        if (images.length < 2) return;
        state.galleryIndex = (state.galleryIndex + direction + images.length) % images.length;
        const image = $('.modal-product-image');
        const counter = $('.gallery-counter');
        if (!image) return;
        image.classList.add('is-changing');
        image.src = images[state.galleryIndex];
        if (counter) counter.textContent = `${state.galleryIndex + 1} / ${images.length}`;
        if (state.galleryTransitionTimer) {
            window.clearTimeout(state.galleryTransitionTimer);
        }
        state.galleryTransitionTimer = window.setTimeout(() => {
            image.classList.remove('is-changing');
            state.galleryTransitionTimer = null;
        }, 280);
    }

    function startGallery() {
        if (!state.galleryTimer && (state.modalProduct?.images || []).length > 1) {
            state.galleryTimer = window.setInterval(() => advanceGallery(), 1400);
        }
    }

    function openModal(id) {
        const product = getProduct(id);
        const modal = $('#productModal');
        const backdrop = $('#productBackdrop');
        const content = $('#modalContent');

        if (!product || !modal || !backdrop || !content) return;

        stopGallery();
        state.modalProduct = product;
        state.galleryIndex = 0;
        const images = Array.isArray(product.images) && product.images.length
            ? product.images
            : product.image
                ? [product.image]
                : [];
        const safeColor = ['gold', 'silver'].includes(product.color) ? product.color : '';
        const galleryControls = images.length > 1
            ? `<div class="gallery-controls">
                   <button type="button" data-gallery-step="-1" aria-label="${state.language === 'en' ? 'Previous image' : 'الصورة السابقة'}">‹</button>
                   <span class="gallery-counter">1 / ${images.length}</span>
                   <button type="button" data-gallery-step="1" aria-label="${state.language === 'en' ? 'Next image' : 'الصورة التالية'}">›</button>
               </div>`
            : '';
        content.innerHTML = `
            <div class="modal-product-layout">
                <div class="modal-visual ${safeColor}" data-gallery-stage>
                    ${
                        images.length
                            ? `<img class="modal-product-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(localizedName(product))}">`
                            : ''
                    }
                    ${galleryControls}
                </div>
                <div>
                    <p class="eyebrow">${escapeHtml(categoryLabel(product.category))}</p>
                    <h2>${escapeHtml(localizedName(product))}</h2>
                    <div class="rating">⭐ ${escapeHtml(product.rating || 4.8)} / 5</div>
                    <p class="modal-description">${escapeHtml(localizedDescription(product))}</p>
                    <strong class="modal-price">${money(product.price)}</strong>
                    <div class="quantity-control">
                        <span>${escapeHtml(text('quantity'))}</span>
                        <button type="button" data-modal-qty="-1">−</button>
                        <b id="modalQty">1</b>
                        <button type="button" data-modal-qty="1">+</button>
                    </div>
                    <button class="primary-button modal-add" data-modal-add type="button" ${product.sold_out ? 'disabled' : ''}>
                        ${escapeHtml(product.sold_out ? text('unavailable') : text('addToCart'))}
                    </button>
                    <div class="reviews">
                        <h3>${escapeHtml(text('reviews'))}</h3>
                        ${
                            (product.reviews || [])
                                .map(
                                    (review) =>
                                        `<p>⭐ ${escapeHtml(review.rating)} · <b>${escapeHtml(review.name)}</b><br>${escapeHtml(review.comment)}</p>`,
                                )
                                .join('') || `<p>${escapeHtml(text('firstReview'))}</p>`
                        }
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('open');
        backdrop.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        $('#closeModal')?.focus();

        const gallery = $('[data-gallery-stage]', content);
        if (gallery) {
            gallery.addEventListener('pointerenter', (event) => {
                if (event.pointerType === 'mouse') startGallery();
            });
            gallery.addEventListener('pointerleave', stopGallery);
            gallery.addEventListener('pointerdown', (event) => {
                if (event.pointerType !== 'mouse') {
                    state.galleryPressTimer = window.setTimeout(startGallery, 450);
                }
            });
            for (const eventName of ['pointerup', 'pointercancel']) {
                gallery.addEventListener(eventName, stopGallery);
            }
            gallery.addEventListener('contextmenu', (event) => event.preventDefault());
        }
    }

    // Assistant chat output helper.
    function addChatMessage(text, type) {
        const messages = $('#messages');
        if (!messages) return;

        const node = document.createElement('div');
        node.className = `message ${type}`;
        node.textContent = text;
        messages.appendChild(node);
        messages.scrollTop = messages.scrollHeight;
    }

    function applyLanguage() {
        const language = translations[state.language];
        document.documentElement.lang = state.language;
        document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
        document.title = state.language === 'en'
            ? 'DorraJewelery | Fine Jewelry'
            : 'DorraJewelery | مجوهرات درّة';

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.dataset.i18n;
            if (language[key]) element.textContent = language[key];
        });
        document.querySelectorAll('[data-i18n-html]').forEach((element) => {
            const key = element.dataset.i18nHtml;
            if (language[key]) element.innerHTML = language[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.dataset.i18nPlaceholder;
            if (language[key]) element.placeholder = language[key];
        });
        document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
            const key = element.dataset.i18nAria;
            if (language[key]) element.setAttribute('aria-label', language[key]);
        });

        const languageSelect = $('#languageSelect');
        if (languageSelect) languageSelect.value = state.language;
        const closeCart = $('#closeCart');
        if (closeCart) closeCart.setAttribute(
            'aria-label',
            state.language === 'en' ? 'Close cart' : 'إغلاق السلة',
        );
        const closeModalButton = $('#closeModal');
        if (closeModalButton) closeModalButton.setAttribute(
            'aria-label',
            state.language === 'en' ? 'Close product details' : 'إغلاق تفاصيل المنتج',
        );
        document.querySelectorAll('.material-filter').forEach((button) => {
            const key = button.dataset.material === 'all'
                ? 'materialAll'
                : button.dataset.material === 'silver'
                    ? 'materialSilver'
                    : 'materialGold';
            button.textContent = text(key);
        });
        const termsError = $('.form-error');
        if (termsError && state.language === 'en') {
            termsError.textContent = 'Please complete the required fields and select available products.';
        }

        renderCategories();
        renderProducts();
        renderCart();
        if (state.modalProduct) openModal(state.modalProduct.id);
    }

    function setLanguage(language) {
        state.language = language === 'en' ? 'en' : 'ar';
        try {
            localStorage.setItem('dorra-language', state.language);
        } catch (error) {
            console.error('Could not save language preference.', error);
        }
        applyLanguage();
    }

    function initHeroParallax() {
        const heroArt = $('#heroArt');
        if (!heroArt || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const updateParallax = () => {
            if (state.parallaxFrame) return;
            state.parallaxFrame = window.requestAnimationFrame(() => {
                const distance = Math.min(window.scrollY * 0.055, 55);
                heroArt.style.transform = `translate3d(${-distance}px, 0, 0)`;
                state.parallaxFrame = null;
            });
        };

        window.addEventListener('scroll', updateParallax, { passive: true });
        window.addEventListener('pagehide', () => {
            window.removeEventListener('scroll', updateParallax);
            if (state.parallaxFrame) window.cancelAnimationFrame(state.parallaxFrame);
        }, { once: true });
        updateParallax();
    }

    // Delegated handlers for static and dynamically rendered controls.
    document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;

        const filter = event.target.closest('.filter');
        if (filter) {
            state.category = filter.dataset.category || 'all';
            renderCategories();
            renderProducts();
            return;
        }

        const material = event.target.closest('.material-filter');
        if (material) {
            document
                .querySelectorAll('.material-filter')
                .forEach((button) => button.classList.remove('active'));
            material.classList.add('active');
            state.material = material.dataset.material || 'all';
            renderProducts();
            return;
        }

        const addButton = event.target.closest('[data-add-id]');
        if (addButton) {
            event.preventDefault();
            if (!addButton.disabled) addToCart(addButton.dataset.addId);
            return;
        }

        const removeButton = event.target.closest('[data-remove]');
        if (removeButton) {
            changeQuantity(Number(removeButton.dataset.remove), -999);
            return;
        }

        const increaseButton = event.target.closest('[data-increase]');
        if (increaseButton) {
            changeQuantity(Number(increaseButton.dataset.increase), 1);
            return;
        }

        const decreaseButton = event.target.closest('[data-decrease]');
        if (decreaseButton) {
            changeQuantity(Number(decreaseButton.dataset.decrease), -1);
            return;
        }

        const card = event.target.closest('[data-product-id]');
        if (card && !event.target.closest('button')) {
            openModal(card.dataset.productId);
            return;
        }

        const modalQuantity = event.target.closest('[data-modal-qty]');
        if (modalQuantity) {
            const counter = $('#modalQty');
            if (counter) {
                counter.textContent = Math.max(
                    1,
                    Number(counter.textContent) + Number(modalQuantity.dataset.modalQty),
                );
            }
            return;
        }

        const galleryStep = event.target.closest('[data-gallery-step]');
        if (galleryStep) {
            advanceGallery(Number(galleryStep.dataset.galleryStep));
            return;
        }

        const modalAdd = event.target.closest('[data-modal-add]');
        if (modalAdd) {
            if (state.modalProduct && !state.modalProduct.sold_out) {
                addToCart(
                    state.modalProduct.id,
                    Number($('#modalQty')?.textContent || 1),
                );
            }
            closeModal();
        }
    });

    // Static controls and form handlers.
    $('#cartButton')?.addEventListener('click', () => toggleCart(true));
    $('#closeCart')?.addEventListener('click', () => toggleCart(false));
    $('#drawerBackdrop')?.addEventListener('click', () => toggleCart(false));
    $('#closeModal')?.addEventListener('click', closeModal);
    $('#productBackdrop')?.addEventListener('click', closeModal);

    $('#searchInput')?.addEventListener('input', (event) => {
        state.search = event.target.value;
        renderProducts();
    });

    $('#sortSelect')?.addEventListener('change', (event) => {
        state.sort = event.target.value;
        renderProducts();
    });

    $('#themeToggle')?.addEventListener('click', () => {
        document.documentElement.dataset.theme =
            document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem('dorra-theme', document.documentElement.dataset.theme);
        } catch (error) {
            console.error('Could not save theme preference.', error);
        }
    });

    $('#languageSelect')?.addEventListener('change', (event) => {
        setLanguage(event.target.value);
    });

    $('#chatForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = $('#chatInput');
        const message = input?.value.trim();
        if (!message) return;

        addChatMessage(message, 'user');
        input.value = '';

        const submitButton = event.currentTarget.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken(),
                },
                body: JSON.stringify({ message, language: state.language }),
            });
            if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
            const payload = await response.json();
            if (typeof payload.reply !== 'string') throw new Error('Invalid chat response.');
            addChatMessage(payload.reply, 'bot');
        } catch (error) {
            console.error('Chat request failed.', error);
            addChatMessage(text('chatError'), 'bot');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    // Entry splash animation.
    function initDorraEntrySplash() {
        const splash = document.createElement('div');
        const mark = document.createElement('div');

        splash.className = 'dorra-entry-splash';
        splash.setAttribute('aria-hidden', 'true');
        mark.className = 'dorra-entry-mark';
        mark.textContent = 'D';
        splash.appendChild(mark);
        document.body.prepend(splash);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            splash.remove();
            return;
        }

        window.setTimeout(() => {
            splash.classList.add('is-exiting');
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
        }, 900);

        splash.addEventListener('transitionend', () => splash.remove(), {
            once: true,
        });

        window.setTimeout(() => splash.remove(), 1700);
    }

    // Initial page setup.
    renderCategories();
    renderProducts();
    renderCart();
    try {
        const theme = localStorage.getItem('dorra-theme');
        if (theme === 'light' || theme === 'dark') {
            document.documentElement.dataset.theme = theme;
        }
    } catch (error) {
        console.error('Could not read theme preference.', error);
    }
    applyLanguage();
    initHeroParallax();
    initDorraEntrySplash();
});
