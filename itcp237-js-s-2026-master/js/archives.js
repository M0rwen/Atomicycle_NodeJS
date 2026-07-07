$(document).ready(function () {
  const baseUrl = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost:4000';

  $('#home').load('header.html');

  const normalizeToken = (value) => {
    if (!value) {
      return null;
    }
    return value.startsWith('"') ? JSON.parse(value) : value;
  };

  const getToken = () => {
    const token = normalizeToken(sessionStorage.getItem('token'));
    const role = sessionStorage.getItem('role') ? JSON.parse(sessionStorage.getItem('role')) : 'user';

    if (!token || role !== 'admin') {
      Swal.fire({
        icon: 'warning',
        text: 'Admin access required.',
        showConfirmButton: true,
      }).then(() => {
        window.location.href = 'home.html';
      });
      return null;
    }

    return token;
  };

  const resolveImagePaths = (value) => {
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
        if (typeof parsed === 'string' && parsed) {
          return [parsed];
        }
      } catch (error) {
        return [value];
      }
    }

    return [];
  };

  const buildItemImageUrl = (value) => {
    const imagePaths = resolveImagePaths(value);
    const imagePath = imagePaths[0] || '';

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

    return `${baseUrl}/${normalizedPath}`;
  };

  const itemsTable = $('#itemsArchiveTable').DataTable({
    paging: true,
    pageLength: 10,
    order: [[0, 'desc']],
    columns: [
      { data: 'id' },
      { data: 'image', orderable: false },
      { data: 'description' },
      { data: 'sell_price' },
      { data: 'quantity' },
      { data: 'deleted_at' },
      { data: 'actions', orderable: false },
    ],
  });

  const usersTable = $('#usersArchiveTable').DataTable({
    paging: true,
    pageLength: 10,
    order: [[0, 'desc']],
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'email' },
      { data: 'role' },
      { data: 'deleted_at' },
      { data: 'actions', orderable: false },
    ],
  });

  const reloadTables = () => {
    const token = getToken();
    if (!token) {
      return;
    }

    $.ajax({
      method: 'GET',
      url: `${baseUrl}/api/v1/items/archived`,
      dataType: 'json',
      headers: { Authorization: `Bearer ${token}` },
      success: function (response) {
        const rows = (response.rows || []).map((item) => ({
          id: item.item_id,
          image: buildItemImageUrl(item.img_path)
            ? `<img src="${buildItemImageUrl(item.img_path)}" alt="${item.description || 'Archived item'}" />`
            : '—',
          description: item.description || '—',
          sell_price: item.sell_price ?? '0',
          quantity: item.quantity ?? 0,
          deleted_at: item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '—',
          actions: `<button class="btn btn-sm btn-success restore-item" data-id="${item.item_id}">Restore</button>`,
        }));
        itemsTable.clear().rows.add(rows).draw();
      },
    });

    $.ajax({
      method: 'GET',
      url: `${baseUrl}/api/v1/users/archived`,
      dataType: 'json',
      headers: { Authorization: `Bearer ${token}` },
      success: function (response) {
        const rows = (response.rows || []).map((user) => ({
          id: user.id,
          name: user.name || '—',
          email: user.email || '—',
          role: user.role || 'user',
          deleted_at: user.deleted_at ? new Date(user.deleted_at).toLocaleString() : '—',
          actions: `<button class="btn btn-sm btn-success restore-user" data-id="${user.id}">Restore</button>`,
        }));
        usersTable.clear().rows.add(rows).draw();
      },
    });
  };

  $('#itemsArchiveTable').on('click', '.restore-item', function () {
    const token = getToken();
    if (!token) {
      return;
    }

    const id = $(this).data('id');
    Swal.fire({
      title: 'Restore item?',
      text: 'This will make the item visible again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      $.ajax({
        method: 'PATCH',
        url: `${baseUrl}/api/v1/items/${id}/restore`,
        dataType: 'json',
        headers: { Authorization: `Bearer ${token}` },
        success: function () {
          Swal.fire({ icon: 'success', text: 'Item restored', timer: 1200, showConfirmButton: false });
          reloadTables();
        },
        error: function () {
          Swal.fire({ icon: 'error', text: 'Unable to restore item.' });
        },
      });
    });
  });

  $('#usersArchiveTable').on('click', '.restore-user', function () {
    const token = getToken();
    if (!token) {
      return;
    }

    const id = $(this).data('id');
    Swal.fire({
      title: 'Restore user?',
      text: 'This will reactivate the user account.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      $.ajax({
        method: 'PATCH',
        url: `${baseUrl}/api/v1/users/${id}/restore`,
        dataType: 'json',
        headers: { Authorization: `Bearer ${token}` },
        success: function () {
          Swal.fire({ icon: 'success', text: 'User restored', timer: 1200, showConfirmButton: false });
          reloadTables();
        },
        error: function () {
          Swal.fire({ icon: 'error', text: 'Unable to restore user.' });
        },
      });
    });
  });

  reloadTables();
});
