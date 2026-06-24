$(document).ready(function () {
  const url = 'http://localhost:4000/'
  const pageSize = 8;
  let itemCount = 0;
  let priceTotal = 0;
  let quantity = 0;
  let searchTimer = null;
  let allItems = [];
  let filteredItems = [];
  let currentPage = 1;
  let infinitePage = 1;
  let mode = 'pagination';
  let loadingMore = false;

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

  const getFilteredItems = () => {
    const term = $('#homeSearch').val().trim().toLowerCase();
    if (!term) {
      return allItems.slice();
    }

    return allItems.filter((item) => {
      const description = (item.description || '').toLowerCase();
      return description.includes(term);
    });
  }

  const buildItemCard = (value) => {
    const imagePath = normalizeImagePath(value.img_path);
    return `<div class="col-md-3 mb-4">
                <div class="card h-100"><img src="${url}/${imagePath}" class="card-img-top" alt="${value.description}" ><div class="card-body"><h5 class="card-title">${value.description}</h5><p class="card-text">₱ ${value.sell_price}</p><p class="card-text"><small class="text-muted">Stock: ${value.quantity ?? 0}</small></p><a href="#!" class="btn btn-primary show-details" role="button" data-id="${value.item_id}"
                                    data-description="${value.description}"
                                    data-price="${value.sell_price}"
                                    data-image="${imagePath}"
                                    data-stock="${value.quantity ?? 0}">Details</a></div></div></div>`;
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

  const renderPaginationControls = () => {
    const controls = $('#paginationControls');
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

    if (mode !== 'pagination') {
      controls.empty();
      $('#paginationInfo').text('');
      return;
    }

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    pages.push(`<button class="btn btn-outline-secondary btn-sm mr-2 page-action" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`);

    for (let page = startPage; page <= endPage; page++) {
      pages.push(`<button class="btn btn-sm mr-2 page-action ${page === currentPage ? 'btn-primary' : 'btn-outline-primary'}" data-page="${page}">${page}</button>`);
    }

    pages.push(`<button class="btn btn-outline-secondary btn-sm page-action" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`);

    controls.html(pages.join(''));
    $('#paginationInfo').text(`Page ${currentPage} of ${totalPages} • ${filteredItems.length} products`);
  }

  const renderPagination = () => {
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredItems.slice(start, start + pageSize);
    renderCards(pageItems, false);
    renderPaginationControls();
    $('#scrollSentinel').addClass('d-none');
  }

  const renderInfiniteReset = () => {
    const itemsList = $('#itemsList');
    itemsList.empty();
    infinitePage = 1;
    loadingMore = false;
    $('#paginationControls').empty();
    $('#paginationInfo').text(`Loaded 0 of ${filteredItems.length} products`);
    $('#scrollSentinel').removeClass('d-none');
    appendInfinitePage();
  }

  const appendInfinitePage = () => {
    if (mode !== 'infinite' || loadingMore) {
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
    $('#paginationInfo').text(`Loaded ${Math.min((infinitePage - 1) * pageSize, filteredItems.length)} of ${filteredItems.length} products`);

    if ((infinitePage - 1) * pageSize >= filteredItems.length) {
      $('#scrollSentinel').text('You reached the end.');
    } else {
      $('#scrollSentinel').text('Loading more products...');
    }

    loadingMore = false;
  }

  const applyView = () => {
    filteredItems = getFilteredItems();

    if (mode === 'pagination') {
      currentPage = 1;
      renderPagination();
      return;
    }

    renderInfiniteReset();
  }

  const renderItems = (items) => {
    allItems = items.slice();
    filteredItems = items.slice();
    applyView();
  }

  const loadItems = (search = '') => {
    $.ajax({
      method: 'GET',
      url: `${url}api/v1/items${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      dataType: 'json',
      success: function (data) {
        renderItems(data.rows || []);
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

  $('#paginationModeBtn').on('click', function () {
    mode = 'pagination';
    $('#scrollSentinel').addClass('d-none');
    applyView();
  });

  $('#infiniteModeBtn').on('click', function () {
    mode = 'infinite';
    applyView();
  });

  $('#paginationControls').on('click', '.page-action', function () {
    if (mode !== 'pagination') {
      return;
    }

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const target = $(this).data('page');

    if (target === 'prev' && currentPage > 1) {
      currentPage -= 1;
    } else if (target === 'next' && currentPage < totalPages) {
      currentPage += 1;
    } else if (Number(target)) {
      currentPage = Number(target);
    }

    renderPagination();
    $('html, body').animate({ scrollTop: $('#items').offset().top - 20 }, 200);
  });

  $(window).on('scroll', function () {
    if (mode !== 'infinite' || loadingMore) {
      return;
    }

    const scrollTop = $(window).scrollTop();
    const windowHeight = $(window).height();
    const documentHeight = $(document).height();

    if (scrollTop + windowHeight >= documentHeight - 150) {
      appendInfinitePage();
    }
  });

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
                        <img src="${url}${image}" class="img-fluid mb-3" style="max-height:200px;">
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