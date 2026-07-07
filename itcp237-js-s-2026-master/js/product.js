$(document).ready(function () {
  const url = 'http://localhost:4000';
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  let currentItem = null;
  let currentImages = [];
  let currentImageIndex = 0;

  const getUserId = () => {
    const raw = sessionStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return raw || null;
    }
  };

  const getCartKey = () => {
    const uid = getUserId();
    return uid ? `cart_${uid}` : 'cart_guest';
  };

  const getCart = () => {
    const cart = localStorage.getItem(getCartKey());
    return cart ? JSON.parse(cart) : [];
  };

  const saveCart = (cart) => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  };

  const getToken = () => {
    const token = sessionStorage.getItem('token');
    return token ? (token.startsWith('"') ? JSON.parse(token) : token) : null;
  };

  const normalizeImageList = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (error) {
        return [value].filter(Boolean);
      }

      return [value].filter(Boolean);
    }

    return [];
  };

  const buildImageUrl = (imagePath) => {
    if (!imagePath) {
      return '';
    }

    const normalizedPath = String(imagePath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalizedPath) {
      return '';
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    return `${url}/${normalizedPath}`;
  };

  const renderImageGallery = () => {
    if (!currentImages.length) {
      $('#productImagePanel').html('<div class="alert alert-light">No images available.</div>');
      $('#productThumbnails').html('');
      return;
    }

    const mainImage = buildImageUrl(currentImages[currentImageIndex]);
    $('#productImagePanel').html(`<img src="${mainImage}" class="product-main-image" alt="Product image" />`);

    $('#productThumbnails').html(currentImages.map((image, index) => {
      const imageUrl = buildImageUrl(image);
      return `<img src="${imageUrl}" class="product-thumbnail ${index === currentImageIndex ? 'active' : ''}" data-index="${index}" alt="Product thumbnail" />`;
    }).join(''));
  };

  const renderProduct = (item) => {
    currentItem = item;
    currentImages = normalizeImageList(item.img_path);
    currentImageIndex = 0;

    $('#productTitle').text(item.description || 'Product');
    $('#productDescription').text(item.description || '');
    $('#productPrice').text(`₱ ${Number(item.sell_price || 0).toFixed(2)}`);
    $('#productStock').text(`Stock available: ${item.quantity ?? 0}`);
    $('#productQty').val(1);
    renderImageGallery();
  };

  const renderReviews = (reviews) => {
    if (!reviews.length) {
      $('#reviewList').html('<div class="alert alert-light">No reviews yet for this item.</div>');
      return;
    }

    const html = reviews.map((review) => {
      const stars = '★'.repeat(Number(review.rating || 0)) + '☆'.repeat(5 - Number(review.rating || 0));
      const date = review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently added';

      return `
        <div class="card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <strong>${review.reviewer_name || 'Anonymous'}</strong>
            <span class="review-stars">${stars}</span>
          </div>
          <p class="mb-2 mt-2">${review.comment || ''}</p>
          <small class="text-muted">${date}</small>
        </div>
      `;
    }).join('');

    $('#reviewList').html(html);
  };

  const showReviewForm = (canReview) => {
    if (canReview) {
      $('#reviewNotice').addClass('d-none').text('');
      $('#reviewForm').removeClass('d-none');
    } else {
      $('#reviewNotice').removeClass('d-none').text('You can write a review after ordering and receiving this item.');
      $('#reviewForm').addClass('d-none');
    }
  };

  const checkReviewEligibility = () => {
    const token = getToken();
    if (!token || !itemId) {
      showReviewForm(false);
      return;
    }

    $.ajax({
      method: 'GET',
      url: `${url}/api/v1/transactions`,
      dataType: 'json',
      headers: {
        Authorization: 'Bearer ' + token,
      },
      success: function (data) {
        const transactions = data.rows || [];
        const hasDeliveredItem = transactions.some((transaction) => {
          const lines = transaction.lines || [];
          return lines.some((line) => Number(line.item_id) === Number(itemId) && String(transaction.delivery_status || '').toLowerCase() === 'delivered');
        });

        showReviewForm(hasDeliveredItem);
      },
      error: function () {
        showReviewForm(false);
      },
    });
  };

  const loadReviews = () => {
    if (!itemId) {
      return;
    }

    $.ajax({
      method: 'GET',
      url: `${url}/api/v1/items/${itemId}/reviews`,
      dataType: 'json',
      success: function (data) {
        renderReviews(data.rows || []);
      },
      error: function () {
        $('#reviewList').html('<div class="alert alert-light">No reviews yet for this item.</div>');
      },
    });
  };

  const submitReview = (event) => {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      Swal.fire({ icon: 'warning', text: 'Please log in to submit a review.' });
      return;
    }

    const payload = {
      item_id: Number(itemId),
      reviewer_name: $('#reviewerName').val().trim(),
      rating: Number($('#reviewRating').val()),
      comment: $('#reviewComment').val().trim(),
    };

    if (!payload.reviewer_name || !payload.comment) {
      Swal.fire({ icon: 'warning', text: 'Please complete your review before submitting.' });
      return;
    }

    $.ajax({
      method: 'POST',
      url: `${url}/api/v1/items/${itemId}/reviews`,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      headers: {
        Authorization: 'Bearer ' + token,
      },
      data: JSON.stringify(payload),
      success: function () {
        $('#reviewForm')[0].reset();
        loadReviews();
        Swal.fire({ icon: 'success', text: 'Your review was submitted.' });
      },
      error: function (error) {
        Swal.fire({ icon: 'error', text: error.responseJSON?.error || 'Unable to submit review.' });
      },
    });
  };

  const addToCart = () => {
    if (!currentItem) {
      return;
    }

    const quantity = Math.max(1, parseInt($('#productQty').val() || '1', 10));
    const cart = getCart();
    const existing = cart.find((item) => item.item_id === currentItem.item_id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        item_id: currentItem.item_id,
        description: currentItem.description,
        price: Number(currentItem.sell_price || 0),
        image: buildImageUrl(currentImages[0]),
        stock: Number(currentItem.quantity || 0),
        quantity,
      });
    }

    saveCart(cart);
    Swal.fire({ icon: 'success', text: 'Added to cart.' });
  };

  const buyNow = () => {
    addToCart();
    window.location.href = 'cart.html';
  };

  $('#home').load('header.html', function () {
    $('#addToCartBtn').on('click', addToCart);
    $('#buyNowBtn').on('click', buyNow);
    $('#reviewForm').on('submit', submitReview);
    $('#productThumbnails').on('click', '.product-thumbnail', function () {
      currentImageIndex = Number($(this).data('index'));
      renderImageGallery();
    });
  });

  if (!itemId) {
    $('#productTitle').text('No product selected');
    return;
  }

  $.ajax({
    method: 'GET',
    url: `${url}/api/v1/items/${itemId}`,
    dataType: 'json',
    success: function (data) {
      const item = (data.result || [])[0];
      if (!item) {
        $('#productTitle').text('Product not found');
        return;
      }

      renderProduct(item);
      checkReviewEligibility();
      loadReviews();
    },
    error: function () {
      $('#productTitle').text('Unable to load product');
    },
  });
});
