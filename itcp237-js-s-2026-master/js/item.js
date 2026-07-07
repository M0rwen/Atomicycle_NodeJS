$(document).ready(function () {
    $("#home").load("header.html")
    
    const url = 'http://localhost:4000'
    const _rawToken = sessionStorage.getItem('token');
    const token = _rawToken ? (_rawToken.startsWith('"') ? JSON.parse(_rawToken) : _rawToken) : null
    const role = sessionStorage.getItem('role') ? JSON.parse(sessionStorage.getItem('role')) : 'user'
    const isAdmin = role === 'admin'
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
    }

    const buildItemImageUrl = (value, row = {}) => {
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

        return `${url}/${normalizedPath}`;
    }

    const resolveImageUrl = (value) => {
        const imagePath = resolveImagePath(value);

        if (!imagePath) {
            return '';
        }

        const normalizedPath = String(imagePath).trim().replace(/\\/g, '/');

        if (/^https?:\/\//i.test(normalizedPath)) {
            return normalizedPath;
        }

        if (normalizedPath.startsWith('/images/')) {
            return `${url}${normalizedPath}`;
        }

        const cleanPath = normalizedPath.replace(/^\/+/, '');
        return `${url}/${cleanPath}`;
    }
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
            return;
        }
        return token.startsWith('"') ? JSON.parse(token) : token;
    }

    const initItemFormValidation = () => {
        if (!$.fn.validate) {
            return;
        }

        const $form = $('#iform');
        if ($form.data('validator')) {
            $form.validate().destroy();
        }

        $form.validate({
            errorClass: 'text-danger',
            errorElement: 'div',
            errorPlacement: function (error, element) {
                error.insertAfter(element);
            },
            highlight: function (element) {
                $(element).addClass('is-invalid');
            },
            unhighlight: function (element) {
                $(element).removeClass('is-invalid');
            },
            rules: {
                description: {
                    required: true,
                    minlength: 3,
                },
                sell_price: {
                    required: true,
                    number: true,
                    min: 1,
                },
                cost_price: {
                    required: true,
                    number: true,
                    min: 1,
                },
                quantity: {
                    required: true,
                    digits: true,
                    min: 0,
                },
                images: {
                    required: function () {
                        return !$('#itemId').length;
                    },
                },
            },
            messages: {
                description: {
                    required: 'Description is required',
                    minlength: 'Description must be at least 3 characters',
                },
                sell_price: {
                    required: 'Sell price is required',
                    number: 'Sell price must be a number',
                    min: 'Sell price must be at least 1',
                },
                cost_price: {
                    required: 'Cost price is required',
                    number: 'Cost price must be a number',
                    min: 'Cost price must be at least 1',
                },
                quantity: {
                    required: 'Quantity is required',
                    digits: 'Quantity must be a whole number',
                    min: 'Quantity must be at least 0',
                },
                images: {
                    required: 'Please select an image for the new item',
                },
            },
        });
    };

    const resetItemFormValidation = () => {
        const $form = $('#iform');
        if ($form.data('validator')) {
            $form.validate().resetForm();
        }
        $form.find('.is-invalid').removeClass('is-invalid');
        $form.find('.text-danger').remove();
    };

    initItemFormValidation();

    $('#itable').DataTable({
        ajax: {
            url: `${url}/api/v1/items`,
            dataSrc: 'rows',
        },
        dom: 'Bfrtip',
        buttons: isAdmin ? [
            'pdf',
            'excel',
            {
                text: 'Add item',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    $("#iform").trigger("reset");
                    resetItemFormValidation();
                    $('#itemModal').modal('show');
                    $('#itemUpdate').hide();
                    $('#itemImage').remove()
                }
            }
        ] : ['pdf', 'excel'],
        columns: [
            { data: 'item_id' },
            {
                data: 'img_path',
                render: function (data, type, row) {
                    const imageUrl = buildItemImageUrl(data, row);
                    if (!imageUrl) {
                        return '';
                    }

                    const cacheBuster = type === 'display' ? `?t=${Date.now()}&item=${row.item_id || 0}` : '';
                    return `<img src="${imageUrl}${cacheBuster}" class="item-image-preview" alt="${row.description || 'Item image'}" width="50" height="60">`;
                }
            },

            { data: 'description' },
            { data: 'cost_price' },
            { data: 'sell_price' },
            { data: 'quantity' },
            {
                data: null,
                render: function (data, type, row) {
                    if (!isAdmin) {
                        return '';
                    }

                    return "<a href='#' class = 'editBtn' id='editbtn' data-id=" + data.item_id + "><i class='fas fa-edit' aria-hidden='true' style='font-size:24px' ></i></a><a href='#'  class='deletebtn' data-id=" + data.item_id + "><i  class='fas fa-trash-alt' style='font-size:24px; color:red' ></a></i>";
                }
            }
        ],
    });

    $("#itemSubmit").on('click', function (e) {
        if (!isAdmin) {
            return;
        }
        e.preventDefault();
        if (!$('#iform').valid()) {
            return;
        }
        var data = $('#iform')[0];
        console.log(data);
        // if (getToken()) {
        let formData = new FormData(data);
        console.log(formData);
        for (var pair of formData.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }
        // const token = getToken()

        $.ajax({
            method: "POST",
            url: `${url}/api/v1/items`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function (data) {
                console.log(data);
                $("#itemModal").modal("hide");
                $("#iform").trigger("reset");
                Swal.fire({
                    icon: "success",
                    text: "Item saved successfully",
                    showConfirmButton: false,
                    timer: 1200,
                    position: 'bottom-right'
                });
                var $itable = $('#itable').DataTable();
                $itable.ajax.reload(function () {
                    $itable.columns.adjust().draw(false);
                }, false);
            },
            error: function (error) {
                Swal.fire({
                    icon: "error",
                    text: error.responseText,
                    showConfirmButton: false,
                    // position: 'bottom-right',
                    timer: 3000,
                    timerProgressBar: true

                });
                console.log(error);
            }
        });

        // }

    });

    $('#itable tbody').on('click', 'a.editBtn', function (e) {
        if (!isAdmin) {
            return;
        }
        e.preventDefault();
        $('#itemImage').remove()
        $('#itemId').remove()
        $("#iform").trigger("reset");
        resetItemFormValidation();
        var id = $(this).data('id');
        console.log(id);
        $('#itemModal').modal('show');
        $('<input>').attr({ type: 'hidden', id: 'itemId', name: 'item_id', value: id }).appendTo('#iform');

        $('#itemSubmit').hide()
        $('#itemUpdate').show()

        $.ajax({
            method: "GET",
            url: `${url}/api/v1/items/${id}`,
            dataType: "json",
            headers: {
                "Authorization": "Bearer " + getToken()
            },
            success: function (data) {
                const { description,
                    item_id,
                    cost_price,
                    sell_price,
                    quantity,
                    img_path } = data.result[0]

                console.log(data);
                $('#desc').val(description)
                $('#sell').val(sell_price)
                $('#cost').val(cost_price)
                $('#qty').val(quantity)

                const imagePaths = resolveImagePaths(img_path);
                $('#itemImage').remove();
                if (imagePaths.length) {
                    const previewMarkup = imagePaths.map((path) => {
                        const previewUrl = buildItemImageUrl(path);
                        return `<img src="${previewUrl}" width='200px' height='200px' id="itemImage" class="item-image-preview-large mr-2 mb-2" />`;
                    }).join('');
                    $("#iform").append(previewMarkup);
                }

            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#itemUpdate").on('click', function (e) {
        if (!isAdmin) {
            return;
        }
        e.preventDefault();
        if (!$('#iform').valid()) {
            return;
        }
        var id = $('#itemId').val();
        console.log(id);
        var table = $('#itable').DataTable();

        var data = $('#iform')[0];
        let formData = new FormData(data);
        // formData.append("_method", "PUT")
        $.ajax({
            method: "PUT",
            url: `${url}/api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,

            dataType: "json",
            headers: {
                "Authorization": "Bearer " + getToken()
            },
            success: function (data) {
                console.log(data);
                $('#itemModal').modal("hide");
                $('#iform').trigger('reset');
                resetItemFormValidation();
                Swal.fire({
                    icon: "success",
                    text: "Item updated successfully",
                    showConfirmButton: false,
                    timer: 1200,
                    position: 'bottom-right'
                });
                table.ajax.reload(function () {
                    table.columns.adjust().draw(false);
                }, false);

            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        if (!isAdmin) {
            return;
        }
        e.preventDefault();
        var table = $('#itable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        console.log(id);
        if (getToken()) {
            bootbox.confirm({
                message: "do you want to delete this item",
                buttons: {
                    confirm: {
                        label: 'yes',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'no',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    console.log(result);
                    if (result) {
                        $.ajax({
                            method: "DELETE",
                            url: `${url}/api/v1/items/${id}`,
                            dataType: "json",
                            headers: {
                                "Authorization": "Bearer " + getToken()
                            },
                            success: function (data) {
                                console.log(data);
                                $row.fadeOut(4000, function () {
                                    table.row($row).remove().draw();
                                });

                                bootbox.alert(data.success);
                                Swal.fire({
                                    icon: "success",
                                    text: "Item deleted successfully",
                                    showConfirmButton: false,
                                    timer: 1200,
                                    position: 'bottom-right'
                                });
                            },
                            error: function (error) {
                                bootbox.alert(data.error);
                            }
                        });

                    }

                }
            });

        }

    })

})
