$(document).ready(function () {
  const url = 'http://localhost:4000/'
  const pageSize = 8;
  let itemCount = 0;
  let priceTotal = 0;
  let quantity = 0;
  let searchTimer = null;
  let allItems = [];
  let filteredItems = [];
  let infinitePage = 1;
  let loadingMore = false;
  let activeCategory = 'all';
  let featuredItems = [];
  let featuredOffset = 0;
  let featuredLoading = false;
  let featuredHasMore = true;

  const getUserId = () => {
    const raw = sessionStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return raw || null;
    }
  }

  const getCartKey = () => {
    const uid = getUserId();
    return uid ? `cart_${uid}` : 'cart_guest';
  }

  const getCart = () => {
    const key = getCartKey();
    const cart = localStorage.getItem(key);
    return cart ? JSON.parse(cart) : [];
  }

  const updateCartCount = () => {
    const cart = getCart();
    itemCount = cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    if (itemCount > 0) {
      $('#itemCount').text(itemCount).css('display', 'inline-block');
    } else {
      $('#itemCount').css('display', 'none');
    }
  }

  // Initialize cart count on page load
  updateCartCount();

  const saveCart = cart => {
    const key = getCartKey();
    localStorage.setItem(key, JSON.stringify(cart));
  }

  const normalizeImagePath = (value) => {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value[0] || '';
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed[0] || '';
        }
      } catch (error) {
        return value;
      }
    }

    return '';
  }

  const resolveImageUrl = (value) => {
    const imagePath = normalizeImagePath(value);

    if (!imagePath) {
      return '';
    }

    const normalizedPath = String(imagePath).trim().replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const cleanPath = normalizedPath.replace(/^\/+/, '');
    return `${url.replace(/\/$/, '')}/${cleanPath}`;
  }

  const matchesCategory = (item, category) => {
    const description = (item.description || '').toLowerCase();

    if (category === 'fullface') {
      return description.includes('full face');
    }

    if (category === 'halfface') {
      return description.includes('half face');
    }

    if (category === 'ridinggear') {
      return !description.includes('full face') && !description.includes('half face') && !description.includes('helmet');
    }

    return true;
  };

  const getFilteredItems = () => {
    const term = $('#homeSearch').val().trim().toLowerCase();
    return allItems.filter((item) => {
      const description = (item.description || '').toLowerCase();
      const matchesSearch = !term || description.includes(term);
      const matchesActiveCategory = matchesCategory(item, activeCategory);
      return matchesSearch && matchesActiveCategory;
    });
  }

  const buildItemCard = (value) => {
    const imageUrl = resolveImageUrl(value.img_path);
    return `<div class="col-md-3 mb-4">
                <div class="card h-100"><img src="${imageUrl || 'https://via.placeholder.com/300x220?text=No+Image'}" class="card-img-top" alt="${value.description}" ><div class="card-body"><h5 class="card-title">${value.description}</h5><p class="card-text">₱ ${value.sell_price}</p><p class="card-text"><small class="text-muted">Stock: ${value.quantity ?? 0}</small></p><a href="#!" class="btn btn-primary show-details" role="button" data-id="${value.item_id}"
                                    data-description="${value.description}"
                                    data-price="${value.sell_price}"
                                    data-image="${imageUrl}"
                                    data-stock="${value.quantity ?? 0}">Details</a></div></div></div>`;
  }

  const buildFeaturedItemCard = (value) => {
    const imageUrl = resolveImageUrl(value.img_path);
    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card featured-item-card h-100">
          <img src="${imageUrl || 'https://via.placeholder.com/300x220?text=No+Image'}" class="card-img-top" alt="${value.description}" />
          <div class="card-body">
            <h5 class="card-title">${value.description}</h5>
            <p class="card-text">₱ ${Number(value.sell_price || 0).toFixed(2)}</p>
            <a href="#!" class="btn btn-primary show-details" role="button"
              data-id="${value.item_id}"
              data-description="${value.description}"
              data-price="${value.sell_price}"
              data-image="${imageUrl}"
              data-stock="${value.quantity ?? 0}">Details</a>
          </div>
        </div>
      </div>`;
  }

  const loadMoreFeaturedItems = (reset = false) => {
    if (featuredLoading) {
      return;
    }

    if (reset) {
      featuredOffset = 0;
      featuredHasMore = true;
      $('#featuredItemsGrid').empty();
      $('#featuredItemsStatus').addClass('d-none').text('');
    }

    if (!featuredHasMore) {
      return;
    }

    featuredLoading = true;
    $('#featuredItemsLoader').removeClass('d-none');

    setTimeout(() => {
      const nextItems = featuredItems.slice(featuredOffset, featuredOffset + 4);
      featuredOffset += nextItems.length;

      if (!nextItems.length) {
        featuredHasMore = false;
        $('#featuredItemsLoader').addClass('d-none');
        $('#featuredItemsStatus').removeClass('d-none').text('No more items');
        featuredLoading = false;
        return;
      }

      $('#featuredItemsGrid').append(nextItems.map(buildFeaturedItemCard).join(''));

      if (featuredOffset >= featuredItems.length) {
        featuredHasMore = false;
        $('#featuredItemsStatus').removeClass('d-none').text('No more items');
      } else {
        $('#featuredItemsStatus').addClass('d-none').text('');
      }

      $('#featuredItemsLoader').addClass('d-none');
      featuredLoading = false;
    }, 400);
  }

  const renderFeaturedItems = (items) => {
    featuredItems = Array.isArray(items) ? items.slice() : [];
    featuredOffset = 0;
    featuredLoading = false;
    featuredHasMore = true;

    const featuredGrid = $('#featuredItemsGrid');
    featuredGrid.empty();
    $('#featuredItemsStatus').addClass('d-none').text('');

    if (!featuredItems.length) {
      featuredGrid.html('<div class="col-12"><p class="text-muted">No featured items available right now.</p></div>');
      featuredHasMore = false;
      return;
    }

    loadMoreFeaturedItems(true);
  }

  const updateActiveFilterButtons = () => {
    $('.filter-chip').removeClass('active');
    $(`.filter-chip[data-category="${activeCategory}"]`).addClass('active');
  }

  const scrollToFeaturedItems = () => {
    const featuredSection = document.getElementById('items-section');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const applyCategoryFilter = (category) => {
    activeCategory = category;
    updateActiveFilterButtons();
    applyView();
    scrollToFeaturedItems();
  }

  const renderCards = (items, append = false) => {
    const itemsList = $('#itemsList');

    if (!append) {
      itemsList.empty();
    }

    if (!items.length && !append) {
      itemsList.append('<p class="no-items text-muted">No products found.</p>');
      return;
    }

    let row;
    items.forEach((value, index) => {
      if (index % 4 === 0) {
        row = $('<div class="row"></div>');
        itemsList.append(row);
      }

      row.append(buildItemCard(value));
    });
  }

  const renderInfiniteReset = () => {
    const itemsList = $('#itemsList');
    itemsList.empty();
    infinitePage = 1;
    loadingMore = false;
    $('#scrollSentinel').removeClass('d-none');
    appendInfinitePage();
  }

  const appendInfinitePage = () => {
    if (loadingMore) {
      return;
    }

    loadingMore = true;
    const start = (infinitePage - 1) * pageSize;
    const pageItems = filteredItems.slice(start, start + pageSize);

    if (pageItems.length === 0) {
      if (infinitePage === 1) {
        renderCards([], false);
      }
      $('#scrollSentinel').text('No more products to load.');
      loadingMore = false;
      return;
    }

    renderCards(pageItems, infinitePage > 1);
    infinitePage += 1;

    if ((infinitePage - 1) * pageSize >= filteredItems.length) {
      $('#scrollSentinel').text('You reached the end.');
    } else {
      $('#scrollSentinel').text('Loading more products...');
    }

    loadingMore = false;
  }

  const applyView = () => {
    filteredItems = getFilteredItems();
    renderFeaturedItems(filteredItems);
    renderInfiniteReset();
  }

  const renderItems = (items) => {
    allItems = items.slice();
    applyView();
  }

  const loadItems = (search = '') => {
    $.ajax({
      method: 'GET',
      url: `${url}api/v1/items${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      dataType: 'json',
      success: function (data) {
        const rows = data.rows || [];
        renderFeaturedItems(rows);
        renderItems(rows);
      },
      error: function (error) {
        console.log(error);
      }
    });
  }

  loadItems();

  if ($('#homeSearch').length) {
    $('#homeSearch').autocomplete({
      minLength: 1,
      source: function (request, response) {
        $.ajax({
          method: 'GET',
          url: `${url}api/v1/items?search=${encodeURIComponent(request.term)}`,
          dataType: 'json',
          success: function (data) {
            response((data.rows || []).map((item) => ({
              label: item.description,
              value: item.description,
            })));
          },
          error: function () {
            response([]);
          }
        });
      },
      select: function (event, ui) {
        $('#homeSearch').val(ui.item.value);
        applyView();
        return false;
      }
    });

    $('#homeSearch').on('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        applyView();
      }, 250);
    });
  }

  $('.filter-chip').on('click', function () {
    const category = $(this).data('category');
    applyCategoryFilter(category);
  });

  $('.category-filter-link').on('click', function (event) {
    event.preventDefault();
    const category = $(this).data('category');
    applyCategoryFilter(category);
    const targetId = $(this).attr('href');
    const target = $(targetId);
    if (target.length) {
      $('html, body').animate({ scrollTop: target.offset().top - 20 }, 400);
    }
  });

  $(window).on('scroll', function () {
    if ($('#items-section').length) {
      const scrollTop = $(window).scrollTop();
      const windowHeight = $(window).height();
      const featuredSectionTop = $('#items-section').offset().top;
      const featuredSectionHeight = $('#items-section').height();

      if (scrollTop + windowHeight >= featuredSectionTop + featuredSectionHeight - 100) {
        loadMoreFeaturedItems();
      }
    }

    if (loadingMore) {
      return;
    }

    const scrollTop = $(window).scrollTop();
    const windowHeight = $(window).height();
    const documentHeight = $(document).height();

    if (scrollTop + windowHeight >= documentHeight - 150) {
      appendInfinitePage();
    }
  });

  updateActiveFilterButtons();

  if ($('#productDetailsModal').length === 0) {
    $('body').append(`
                    <div class="modal fade" id="productDetailsModal" tabindex="-1" role="dialog" aria-labelledby="productDetailsModalLabel" aria-hidden="true">
                      <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="productDetailsModalLabel"></h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div class="modal-body text-center" id="productDetailsModalBody">
                            <!-- Product details will be injected here -->
                          </div>
                        </div>
                      </div>
                    </div>
                    `);
  }

  $(document).on('click', '.show-details', function () {

    const id = $(this).data('id');
    const description = $(this).data('description');
    const price = $(this).data('price');
    const image = $(this).data('image');
    const stock = $(this).data('stock');


    $('#productDetailsModalLabel').text(description);
    $('#productDetailsModalBody').html(`
                        <img src="${image || 'https://via.placeholder.com/300x220?text=No+Image'}" class="img-fluid mb-3" style="max-height:200px;">
                        <p id="price">Price: ₱<strong>${price}</strong></p>
                        <p>Stock: ${stock}</p>
                        <input type="number" class="form-control mb-3" id="detailsQty" min="1" max="${stock}" value="1">
                        <input type="hidden" id="detailsItemId" value="${id}">
                        <button type="button" class="btn btn-primary" id="detailsAddToCart">Add to Cart</button>
                    `);

    // Show modal
    $('#productDetailsModal').modal('show');
  })

  $(document).on('click', '#detailsAddToCart', function () {

    const qty = parseInt($("#detailsQty").val());
    const id = Number($("#detailsItemId").val());
    const description = $("#productDetailsModalLabel").text();
    const price = $("#productDetailsModalBody strong").text().replace(/[^\d.]/g, '');
    const image = $("#productDetailsModalBody img").attr('src');
    const stock = parseInt($("#productDetailsModalBody p:contains('Stock')").text().replace(/[^\d]/g, ''));
    let cart = getCart();

    let existing = cart.find(item => item.item_id === id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        item_id: id,
        description: description,
        price: parseFloat(price),
        image: image,
        stock: stock,
        quantity: qty
      });
    }
    saveCart(cart);
    updateCartCount();
    $('#productDetailsModal').modal('hide');
    console.log(cart);

  });

  $("#home").load("header.html")

})