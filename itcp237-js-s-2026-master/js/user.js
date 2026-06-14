$(document).ready(function () {
    const url = 'http://localhost:4000/'
    function getUserId() {
        let userId = sessionStorage.getItem('user');

        return userId ?? '';
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
            submitHandler: function (form) {
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

    $('#avatar').on('change', function () {
        const file = this.files[0];
        console.log(this.files[0])
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

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
                        sessionStorage.setItem('token', JSON.stringify(data.token));
                        sessionStorage.setItem('user', JSON.stringify(data.user.id));
                        sessionStorage.setItem('role', JSON.stringify(data.user.role || 'user'));
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

    $("#updateBtn").on('click', function (event) {
        event.preventDefault();
        // userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')
        userId = getUserId()
        console.log(userId)
        var data = $('#profileForm')[0];

        let formData = new FormData(data);
        formData.append('userId', userId)

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "Profile updated successfully",
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1500,
                    timerProgressBar: true
                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('user')
                sessionStorage.removeItem('token')
                sessionStorage.removeItem('role')
                window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('user')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                Swal.fire({
                    text: 'logout',
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    });

    $("#logout").on('click', function (e) {
        e.preventDefault();
        Swal.fire({
            text: 'logout',
            showConfirmButton: false,
            position: 'bottom-right',
            timer: 1000,
            timerProgressBar: true

        });
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('role')
        window.location.href = 'login.html'

    });
})
