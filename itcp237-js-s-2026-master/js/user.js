$(document).ready(function () {
    const url = 'http://localhost:4000/';

    function getUserId() {
        const storedUser = sessionStorage.getItem('user');

        if (!storedUser) {
            return null;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            return parsedUser?.id ?? parsedUser ?? null;
        } catch (error) {
            return storedUser;
        }
    }

    function getUserEmail() {
        return sessionStorage.getItem('email') || '';
    }

    function getUserName() {
        return sessionStorage.getItem('userName') || '';
    }

    function getUserRole() {
        const storedUser = sessionStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const role = user?.role;

        return role || 'user';
    }

    function showSummaryMode() {
        $('#profileSummary').removeClass('d-none');
        $('#profileForm').addClass('d-none');
        $('#cancelEditBtn').addClass('d-none');
        $('#editProfileBtn').removeClass('d-none');
    }

    function showEditMode() {
        $('#profileSummary').addClass('d-none');
        $('#profileForm').removeClass('d-none');
        $('#cancelEditBtn').removeClass('d-none');
        $('#editProfileBtn').addClass('d-none');
    }

    function getAvatarUrl(imagePath) {
        if (!imagePath) {
            return 'https://via.placeholder.com/130?text=Avatar';
        }

        const normalizedPath = String(imagePath).replace(/^\/+/, '');
        return `${url}${normalizedPath}`;
    }

    function updateProfileSummary() {
        const title = $('#title').val().trim();
        const fname = $('#firstName').val().trim();
        const lname = $('#lastName').val().trim();
        const address = $('#address').val().trim();
        const town = $('#town').val().trim();
        const zipcode = $('#zipcode').val().trim();
        const phone = $('#phone').val().trim();
        const displayName = [title, fname, lname].filter(Boolean).join(' ') || getUserName() || 'Guest Rider';
        const email = getUserEmail() || 'No email set';
        const addressText = address || town ? [address, town].filter(Boolean).join(', ') : 'No address added yet';
        const previewSrc = $('#avatarPreview').attr('src') && $('#avatarPreview').attr('src') !== '#' ? $('#avatarPreview').attr('src') : 'https://via.placeholder.com/130?text=Avatar';

        $('#summaryName').text(displayName);
        $('#summaryEmail').text(email);
        $('#summaryAddress').text(addressText);
        $('#summaryPhone').text(phone || 'Not provided');
        $('#summaryZip').text(zipcode || 'N/A');
        $('#avatarPreview, #avatarPreviewForm').attr('src', previewSrc);
    }

    function populateProfileForm(profile) {
        const safeProfile = profile || {};

        $('#title').val(safeProfile.title || '');
        $('#firstName').val(safeProfile.fname || '');
        $('#lastName').val(safeProfile.lname || '');
        $('#phone').val(safeProfile.phone || '');
        $('#address').val(safeProfile.addressline || '');
        $('#town').val(safeProfile.town || '');
        $('#zipcode').val(safeProfile.zipcode || '');

        if (safeProfile.name) {
            sessionStorage.setItem('userName', safeProfile.name);
        }

        if (safeProfile.email) {
            sessionStorage.setItem('email', safeProfile.email);
        }

        const avatarUrl = getAvatarUrl(safeProfile.image_path || safeProfile.image || safeProfile.avatar);
        $('#avatarPreview').attr('src', avatarUrl);
        $('#avatarPreviewForm').attr('src', avatarUrl);

        updateProfileSummary();
    }

    function loadProfile() {
        const token = sessionStorage.getItem('token');

        if (!token || !$('#profileForm').length) {
            updateProfileSummary();
            return;
        }

        $.ajax({
            method: 'GET',
            url: `${url}api/v1/profile`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            dataType: 'json',
            success: function (response) {
                if (response?.success && response.result) {
                    populateProfileForm(response.result);
                    return;
                }

                updateProfileSummary();
            },
            error: function () {
                updateProfileSummary();
            },
        });
    }

    const role = getUserRole();
    const token = sessionStorage.getItem('token');
    const isLoggedIn = Boolean(token);

    if ($('#itemsMenu').length) {
        $('#itemsMenu').toggleClass('d-none', !(role === 'admin' && isLoggedIn));
    }

    if ($('#usersMenu').length) {
        $('#usersMenu').toggleClass('d-none', !(role === 'admin' && isLoggedIn));
    }

    if ($('#transactionsMenu').length) {
        $('#transactionsMenu').toggleClass('d-none', !(role === 'admin' && isLoggedIn));
    }

    if ($('#browseMenu').length) {
        $('#browseMenu').toggleClass('d-none', !(role === 'user' && isLoggedIn));
    }

    if ($('#cartIconMenu').length) {
        $('#cartIconMenu').toggleClass('d-none', !(role === 'user' && isLoggedIn));
    }

    if ($('#registerForm').length && $.fn.validate) {
        $('#registerForm').validate({
            rules: {
                name: {
                    required: true,
                    minlength: 2,
                },
                email: {
                    required: true,
                    email: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                },
            },
            messages: {
                name: {
                    required: 'Name is required',
                    minlength: 'Name must be at least 2 characters',
                },
                email: {
                    required: 'Email is required',
                    email: 'Enter a valid email address',
                },
                password: {
                    required: 'Password is required',
                    minlength: 'Password must be at least 6 characters',
                },
            },
            submitHandler: function () {
                const user = {
                    name: $('#name').val(),
                    email: $('#email').val(),
                    password: $('#password').val(),
                };

                $.ajax({
                    method: 'POST',
                    url: `${url}api/v1/register`,
                    data: JSON.stringify(user),
                    processData: false,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'Registration successful. Please login.',
                            position: 'bottom-right',
                        }).then(() => {
                            window.location.href = 'login.html';
                        });
                    },
                    error: function (error) {
                        Swal.fire({
                            icon: 'error',
                            text: error.responseJSON?.error || 'Unable to register',
                            position: 'bottom-right',
                        });
                    },
                });

                return false;
            },
        });
    }

    if ($('#loginForm').length && $.fn.validate) {
        $('#loginForm').validate({
            rules: {
                email: {
                    required: true,
                    email: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                },
            },
            messages: {
                email: {
                    required: 'Email is required',
                    email: 'Enter a valid email address',
                },
                password: {
                    required: 'Password is required',
                    minlength: 'Password must be at least 6 characters',
                },
            },
            submitHandler: function () {
                const user = {
                    email: $('#email').val(),
                    password: $('#password').val(),
                };

                $.ajax({
                    method: 'POST',
                    url: `${url}api/v1/login`,
                    data: JSON.stringify(user),
                    processData: false,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: function (data) {
                        Swal.fire({
                            text: data.success,
                            showConfirmButton: false,
                            position: 'bottom-right',
                            timer: 1000,
                            timerProgressBar: true,
                        });
                        sessionStorage.setItem('token', data.token);
                        sessionStorage.setItem('user', JSON.stringify({
                            id: data.user.id,
                            role: data.user.role || 'user',
                            name: data.user.name || '',
                            email: data.user.email || '',
                        }));
                        sessionStorage.setItem('role', JSON.stringify(data.user.role || 'user'));
                        sessionStorage.setItem('userName', data.user.name || '');
                        sessionStorage.setItem('email', data.user.email || '');
                        if ((data.user.role || 'user') === 'admin') {
                            window.location.href = 'users.html';
                            return;
                        }
                        window.location.href = 'profile.html';
                    },
                    error: function (error) {
                        Swal.fire({
                            icon: 'error',
                            text: error.responseJSON?.message || 'Login failed',
                            showConfirmButton: false,
                            position: 'bottom-right',
                            timer: 1000,
                            timerProgressBar: true,
                        });
                    },
                });

                return false;
            },
        });
    }

    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result);
                $('#avatarPreviewForm').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $('#editProfileBtn').on('click', function () {
        showEditMode();
    });

    $('#cancelEditBtn').on('click', function () {
        showSummaryMode();
    });

    $('#profileForm').on('submit', function (event) {
        event.preventDefault();

        const userId = getUserId();
        if (!userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to update your profile.',
            });
            return;
        }

        const form = $('#profileForm')[0];
        const formData = new FormData(form);
        formData.append('userId', userId);

        const addressline = $('#address').val().trim();
        const town = $('#town').val().trim();
        if (addressline || town) {
            formData.set('addressline', addressline);
            formData.set('town', town);
        }

        const token = sessionStorage.getItem('token');
        $('#updateBtn').prop('disabled', true).text('Saving...');

        $.ajax({
            method: 'POST',
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            headers: {
                Authorization: `Bearer ${token || ''}`,
            },
            success: function (response) {
                Swal.fire({
                    icon: 'success',
                    text: 'Profile updated successfully',
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1500,
                    timerProgressBar: true,
                });

                const profilePayload = response?.result || {
                    fname: $('#firstName').val().trim(),
                    lname: $('#lastName').val().trim(),
                    phone: $('#phone').val().trim(),
                    addressline: $('#address').val().trim(),
                    town: $('#town').val().trim(),
                    zipcode: $('#zipcode').val().trim(),
                    name: getUserName(),
                    email: getUserEmail(),
                };

                populateProfileForm(profilePayload);
                showSummaryMode();
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    text: error.responseJSON?.message || 'Unable to update profile.',
                    position: 'bottom-right',
                });
            },
            complete: function () {
                $('#updateBtn').prop('disabled', false).text('Save Changes');
            },
        });
    });

    $('#deactivateBtn').on('click', function (e) {
        e.preventDefault();
        const email = $('#email').val();
        const user = { email };

        $.ajax({
            method: 'DELETE',
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true,
                });
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('role');
                sessionStorage.removeItem('userName');
                sessionStorage.removeItem('email');
                window.location.href = 'home.html';
            },
            error: function (error) {
                console.error(error);
            },
        });
    });

    $('#profile').load('header.html', function () {
        if (sessionStorage.getItem('token')) {
            const $logoutLink = $('#accountLogoutLink');
            if ($logoutLink.length) {
                $logoutLink.removeClass('d-none');
            }
        }
    });

    $(document).on('click', '#logout', function (e) {
        e.preventDefault();
        Swal.fire({
            text: 'Logged out',
            showConfirmButton: false,
            position: 'bottom-right',
            timer: 1000,
            timerProgressBar: true,
        });
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('email');
        window.location.href = 'home.html';
    });

    if ($('#profileSummary').length) {
        loadProfile();
        showSummaryMode();
    }
});
