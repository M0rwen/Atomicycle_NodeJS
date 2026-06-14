$(document).ready(function () {
    $("#home").load("header.html")
    const url = 'http://localhost:4000'
    const token = sessionStorage.getItem('token') ? JSON.parse(sessionStorage.getItem('token')) : null
    const role = sessionStorage.getItem('role') ? JSON.parse(sessionStorage.getItem('role')) : 'user'
    const isAdmin = role === 'admin'
    const resolveImagePath = (value) => {
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
        return JSON.parse(token)
    }

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
                    $('#itemModal').modal('show');
                    $('#itemUpdate').hide();
                    $('#itemImage').remove()
                }
            }
        ] : ['pdf', 'excel'],
        columns: [
            { data: 'item_id' },
            {
                data: null,
                render: function (data, type, row) {
                    const imagePath = resolveImagePath(data.img_path);
                    return imagePath ? `<img src="${url}/${imagePath}" width="50" height="60">` : '';
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
                $itable.ajax.reload()
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
                $("#iform").append(`<img src="${url}/${img_path}" width='200px', height='200px' id="itemImage"   />`)

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
                Swal.fire({
                    icon: "success",
                    text: "Item updated successfully",
                    showConfirmButton: false,
                    timer: 1200,
                    position: 'bottom-right'
                });
                table.ajax.reload()

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