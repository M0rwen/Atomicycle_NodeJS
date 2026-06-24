$(document).ready(function () {
    const url = 'http://localhost:4000';

    function getUserId() {
        const raw = sessionStorage.getItem('user');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return raw || null;
        }
    }

    function getCartKey() {
        const uid = getUserId();
        return uid ? `cart_${uid}` : 'cart_guest';
    }

    function getCart() {
        const key = getCartKey();
        const cart = localStorage.getItem(key);
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        const key = getCartKey();
        localStorage.setItem(key, JSON.stringify(cart));
    }

    function getToken() {
        const token = sessionStorage.getItem('token');
        if (!token) return null;
        return token.startsWith('"') ? JSON.parse(token) : token;
    }

    function updateCheckoutButton(isLoading) {
        const $button = $('#checkoutBtn');
        if (isLoading) {
            $button.prop('disabled', true).text('Processing order...');
        } else {
            $button.prop('disabled', false).text('Proceed to Checkout');
        }
    }

    function renderCart() {
        const cart = getCart();
        let html = '';
        let subtotal = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            html = '<div class="p-4 text-center text-muted">Your cart is empty.</div>';
            $('#cartSummary').html('');
        } else {
            html = `<table class="table table-bordered mb-3">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Description</th>
                        <th class="text-right">Price</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Subtotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>`;

            cart.forEach((item, idx) => {
                const itemSubtotal = Number(item.price || 0) * Number(item.quantity || 0);
                subtotal += itemSubtotal;
                totalItems += Number(item.quantity || 0);
                html += `<tr>
                    <td><img src="${item.image}" width="60" alt="${item.description}"></td>
                    <td>${item.description}</td>
                    <td class="text-right">₱ ${Number(item.price || 0).toFixed(2)}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₱ ${itemSubtotal.toFixed(2)}</td>
                    <td class="text-center"><button class="btn btn-sm btn-danger remove-item" data-idx="${idx}">&times;</button></td>
                </tr>`;
            });

            html += `</tbody></table>`;
            $('#cartSummary').html(`
                <div class="alert alert-light">
                    <strong>Cart summary:</strong> ${totalItems} item(s) • Subtotal ₱ ${subtotal.toFixed(2)}
                </div>
            `);
        }

        $('#cartTable').html(html);
    }

    function ensureLoggedIn() {
        const token = getToken();
        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'Please login before checking out.',
                showConfirmButton: true,
            }).then(() => {
                window.location.href = 'login.html';
            });
            return false;
        }
        return true;
    }

    $('#cartTable').on('click', '.remove-item', function () {
        const idx = $(this).data('idx');
        const cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
    });

    $('#header').load('header.html');

    $('#checkoutBtn').on('click', function () {
        const cart = getCart();
        const deliveryName = $('#deliveryName').val().trim();
        const deliveryPhone = $('#deliveryPhone').val().trim();
        const deliveryAddress = $('#deliveryAddress').val().trim();
        const paymentMethod = $('#paymentMethod').val();
        const shippingFee = parseFloat($('#shippingFee').val()) || 0;
        const orderNotes = $('#orderNotes').val().trim();

        if (!ensureLoggedIn()) {
            return;
        }

        if (!cart.length) {
            Swal.fire({
                icon: 'warning',
                text: 'Your cart is empty.',
            });
            return;
        }

        const cleanCart = cart.map((item) => ({
            item_id: Number(item.item_id),
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            description: item.description,
            image: item.image,
        }));

        if (cleanCart.some((item) => !item.item_id || item.quantity <= 0)) {
            Swal.fire({
                icon: 'warning',
                text: 'Your cart contains invalid items. Please review your cart.',
            });
            return;
        }

        if (!deliveryName || !deliveryPhone || !deliveryAddress) {
            Swal.fire({
                icon: 'warning',
                text: 'Please fill in delivery name, phone, and address.',
            });
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const payload = {
            cart: cleanCart,
            deliveryName,
            deliveryPhone,
            deliveryAddress,
            paymentMethod,
            shipping: shippingFee,
            orderNotes,
            totalItems,
            subtotal,
            total: subtotal + shippingFee,
        };

        const token = getToken();
        updateCheckoutButton(true);

        $.ajax({
            type: 'POST',
            url: `${url}/api/v1/create-order`,
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            headers: {
                Authorization: 'Bearer ' + token,
            },
            success: function (data) {
                // clear only the current user's cart
                const key = getCartKey();
                localStorage.removeItem(key);
                renderCart();
                Swal.fire({
                    icon: 'success',
                    title: 'Order confirmed',
                    text: data.message || 'Your order has been placed successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true,
                }).then(() => {
                    window.location.href = 'home.html';
                });
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Checkout failed',
                    text: error.responseJSON?.error || 'Unable to place order. Please try again.',
                });
            },
            complete: function () {
                updateCheckoutButton(false);
            },
        });
    });

    renderCart();
});