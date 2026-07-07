$(document).ready(function () {
  
  const url = 'http://localhost:4000/';
  const pageSize = 4;
  let allItems = [];
  let filteredItems = [];
  let displayedItems = [];
  let offset = 0;
  let loadingMore = false;
  let hasMore = true;
  let activeCategory = 'all';

  const normalizeImagePath = (value) => {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return normalizeImagePath(value[0]);
    }

    if (typeof value === 'object') {
      return normalizeImagePath(value.path || value.src || value.url || '');
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return normalizeImagePath(parsed[0]);
        }
      } catch (error) {
        // fall through and use the raw string
      }
      return value;
    }

    return '';
  };

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
  };

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
    const term = $('#browseSearch').val().trim().toLowerCase();
    return allItems.filter((item) => {
      const description = (item.description || '').toLowerCase();
      const matchesSearch = !term || description.includes(term);
      const matchesActiveCategory = matchesCategory(item, activeCategory);
      return matchesSearch && matchesActiveCategory;
    });
  };

  const buildItemCard = (item) => {
    const imageUrl = resolveImageUrl(item.img_path) || 'https://via.placeholder.com/300x220?text=No+Image';

    return `
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="card browse-card h-100">
          <img src="${imageUrl}" class="card-img-top" alt="${item.description}" />
          <div class="card-body">
            <h5 class="card-title">${item.description}</h5>
            <p class="card-text">₱ ${Number(item.sell_price || 0).toFixed(2)}</p>
            <p class="card-text"><small class="text-muted">Stock: ${item.quantity ?? 0}</small></p>
            <a href="product.html?id=${item.item_id}" class="btn btn-primary" role="button">View Product</a>
          </div>
        </div>
      </div>`;
  };

  const updateFilterButtons = () => {
    $('.filter-chip').removeClass('active');
    $(`.filter-chip[data-category="${activeCategory}"]`).addClass('active');
  };

  const renderNextItems = (reset = false) => {
    if (loadingMore) {
      return;
    }

    if (reset) {
      offset = 0;
      displayedItems = [];
      hasMore = true;
      $('#browseItemsGrid').empty();
      $('#browseItemsStatus').addClass('d-none').text('');
    }

    if (!hasMore) {
      return;
    }

    loadingMore = true;
    $('#browseItemsLoader').removeClass('d-none');

    const nextItems = filteredItems.slice(offset, offset + pageSize);
    offset += nextItems.length;

    if (!nextItems.length) {
      hasMore = false;
      $('#browseItemsLoader').addClass('d-none');
      $('#browseItemsStatus').removeClass('d-none').text('No more items');
      loadingMore = false;
      return;
    }

    displayedItems = displayedItems.concat(nextItems);
    $('#browseItemsGrid').append(nextItems.map(buildItemCard).join(''));

    if (offset >= filteredItems.length) {
      hasMore = false;
      $('#browseItemsStatus').removeClass('d-none').text('No more items');
    } else {
      $('#browseItemsStatus').addClass('d-none').text('');
    }

    $('#browseItemsLoader').addClass('d-none');
    loadingMore = false;
  };

  const applyFilter = () => {
    filteredItems = getFilteredItems();
    offset = 0;
    displayedItems = [];
    hasMore = true;
    $('#browseItemsGrid').empty();
    $('#browseItemsStatus').addClass('d-none').text('');
    renderNextItems();
  };

  const loadItems = () => {
    $.ajax({
      method: 'GET',
      url: `${url}api/v1/items`,
      dataType: 'json',
      success: function (data) {
        allItems = data.rows || [];
        applyFilter();
      },
      error: function (error) {
        console.log(error);
      }
    });
  };

  $('#browseSearch').on('input', function () {
    applyFilter();
  });

  $('.filter-chip').on('click', function () {
    activeCategory = $(this).data('category');
    updateFilterButtons();
    applyFilter();
  });

  $(window).on('scroll', function () {
    const section = $('#browseSection');
    if (!section.length) {
      return;
    }

    const scrollTop = $(window).scrollTop();
    const windowHeight = $(window).height();
    const sectionTop = section.offset().top;
    const sectionHeight = section.height();

    if (scrollTop + windowHeight >= sectionTop + sectionHeight - 100) {
      renderNextItems();
    }
  });

  updateFilterButtons();
  loadItems();
  $('#home').load('header.html');
});
