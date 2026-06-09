$(document).ready(function () {
    const url = 'http://localhost:4000/'

    const getToken = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return null;
        }
        return JSON.parse(token)
    }

    const token = getToken();
    const storedRole = sessionStorage.getItem('role') ? JSON.parse(sessionStorage.getItem('role')) : 'user';

    if (!token || storedRole !== 'admin') {
        Swal.fire({
            icon: 'error',
            text: 'Admin access required.',
            showConfirmButton: true
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }

    $('#home').load('header.html', function () {
        const $loginLink = $('a.nav-link[href="login.html"]');
        $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    });

    const table = $('#usersTable').DataTable({
        ajax: {
            url: `${url}api/v1/users`,
            dataSrc: 'rows',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            {
                data: 'role',
                render: function (data, type, row) {
                    return `<select class="form-control form-control-sm role-select" data-id="${row.id}">
                        <option value="user" ${data === 'user' ? 'selected' : ''}>user</option>
                        <option value="admin" ${data === 'admin' ? 'selected' : ''}>admin</option>
                    </select>`;
                }
            },
            {
                data: 'token',
                render: function (data) {
                    if (!data) {
                        return '<span class="text-muted">none</span>';
                    }
                    return data.length > 18 ? `${data.substring(0, 18)}...` : data;
                }
            },
            {
                data: null,
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-sm btn-primary save-role" data-id="${row.id}">Save Role</button>
                        <button class="btn btn-sm btn-danger deactivate-user" data-id="${row.id}">Deactivate</button>
                    `;
                }
            }
        ]
    });

    $('#usersTable').on('click', '.save-role', function () {
        const id = $(this).data('id');
        const role = $(`.role-select[data-id="${id}"]`).val();

        $.ajax({
            method: 'PATCH',
            url: `${url}api/v1/users/${id}/role`,
            data: JSON.stringify({ role }),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function () {
                Swal.fire({
                    icon: 'success',
                    text: 'Role updated successfully',
                    timer: 1200,
                    showConfirmButton: false
                });
                table.ajax.reload(null, false);
            },
            error: function (error) {
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.message || 'Failed to update role'
                });
            }
        });
    });

    $('#usersTable').on('click', '.deactivate-user', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Deactivate user?',
            text: 'This will disable the account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, deactivate'
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            $.ajax({
                method: 'DELETE',
                url: `${url}api/v1/users/${id}`,
                dataType: 'json',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        text: 'User deactivated successfully',
                        timer: 1200,
                        showConfirmButton: false
                    });
                    table.ajax.reload(null, false);
                },
                error: function (error) {
                    Swal.fire({
                        icon: 'error',
                        text: error.responseJSON?.message || 'Failed to deactivate user'
                    });
                }
            });
        });
    });
})