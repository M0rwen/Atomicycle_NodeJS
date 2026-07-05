$(document).ready(function () {
    $('#home').load('header.html');

    const url = 'http://localhost:4000';

    const getToken = () => {
        const token = sessionStorage.getItem('token');

        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true,
            }).then(() => {
                window.location.href = 'login.html';
            });
            return null;
        }

        return token.startsWith('"') ? JSON.parse(token) : token;
    };

    const formatDate = (value) => {
        if (!value) {
            return 'Pending';
        }

        return new Date(value).toLocaleString();
    };

    const formatDateTimeLocal = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const formatLineItems = (lines) => {
        if (!Array.isArray(lines) || lines.length === 0) {
            return '<span class="transaction-items-content">No items</span>';
        }

        return lines.map((line) => `<span class="transaction-items-content">${line.Item?.description || `Item ${line.item_id}`} x ${line.quantity}</span>`).join('');
    };

    const table = $('#transactionsTable').DataTable({
        ajax: {
            url: `${url}/api/v1/transactions`,
            dataSrc: function (json) {
                if (Array.isArray(json)) {
                    return json;
                }

                if (Array.isArray(json.rows)) {
                    return json.rows;
                }

                if (Array.isArray(json.result)) {
                    return json.result;
                }

                return [];
            },
            beforeSend: function (jqXHR, settings) {
                const token = getToken();
                if (!token) {
                    return false;
                }
                jqXHR.setRequestHeader('Authorization', `Bearer ${token}`);
            },
            error: function (xhr, status, error) {
                console.error('Transaction load failed:', status, error, xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Unable to load transactions',
                    text: xhr.responseJSON?.message || xhr.responseJSON?.error || xhr.responseText || 'Please refresh and try again.',
                });
            }
        },
        scrollX: true,
        autoWidth: false,
        order: [[0, 'desc']],
        columnDefs: [
            { targets: [0], width: '70px' },
            { targets: [1, 2, 3, 4, 10], width: '140px' },
            { targets: [5, 6, 7, 8, 9], width: '100px' },
            { targets: [11], width: '300px', className: 'items-column' },
            { targets: [12], width: '150px', orderable: false },
        ],
        columns: [
            { data: 'orderinfo_id' },
            { data: 'customer_name' },
            { data: 'customer_email' },
            {
                data: 'date_placed',
                render: function (data) {
                    return formatDate(data);
                },
            },
            {
                data: 'date_shipped',
                render: function (data) {
                    return formatDate(data);
                },
            },
            {
                data: 'shipping',
                render: function (data) {
                    return `PHP ${Number(data || 0).toFixed(2)}`;
                },
            },
            {
                data: 'subtotal',
                render: function (data) {
                    return `PHP ${Number(data || 0).toFixed(2)}`;
                },
            },
            {
                data: 'total',
                render: function (data) {
                    return `PHP ${Number(data || 0).toFixed(2)}`;
                },
            },
            { data: 'totalItems' },
            { data: 'delivery_status' },
            { data: 'payment_method' },
            {
                data: 'lines',
                render: function (data) {
                    return formatLineItems(data);
                },
            },
            {
                data: null,
                render: function (data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-transaction" data-id="${data.orderinfo_id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-transaction" data-id="${data.orderinfo_id}">Delete</button>
                    `;
                },
            },
        ],
    });

    $('#transactionsTable tbody').on('click', '.edit-transaction', function () {
        const rowData = table.row($(this).closest('tr')).data();

        $('#transactionId').val(rowData.orderinfo_id);
        $('#shipping').val(Number(rowData.shipping || 0));
        $('#dateShipped').val(formatDateTimeLocal(rowData.date_shipped));
        $('#deliveryStatus').val(rowData.delivery_status || 'pending');
        $('#transactionModal').modal('show');
    });

    $('#transactionUpdate').on('click', function () {
        const id = $('#transactionId').val();
        const payload = {
            shipping: Number($('#shipping').val()) || 0,
            date_shipped: $('#dateShipped').val() || null,
            delivery_status: $('#deliveryStatus').val(),
        };

        $.ajax({
            type: 'PATCH',
            url: `${url}/api/v1/transactions/${id}`,
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            success: function (data) {
                $('#transactionModal').modal('hide');
                Swal.fire({
                    icon: 'success',
                    text: data.message || 'Transaction updated successfully',
                    showConfirmButton: false,
                    timer: 1500,
                });
                table.ajax.reload(null, false);
            },
            error: function (error) {
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.error || 'Unable to update transaction',
                });
            },
        });
    });

    $('#transactionsTable tbody').on('click', '.delete-transaction', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Delete transaction?',
            text: 'This will remove the transaction and its line items.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            $.ajax({
                method: 'DELETE',
                url: `${url}/api/v1/transactions/${id}`,
                dataType: 'json',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
                success: function (data) {
                    Swal.fire({
                        icon: 'success',
                        text: data.message || 'Transaction deleted successfully',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    table.ajax.reload(null, false);
                },
                error: function (error) {
                    Swal.fire({
                        icon: 'error',
                        text: error.responseJSON?.error || 'Unable to delete transaction',
                    });
                },
            });
        });
    });
});