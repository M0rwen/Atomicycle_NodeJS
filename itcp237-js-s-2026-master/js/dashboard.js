$(document).ready(function () {
    const url = 'http://localhost:4000/'
    const palette = [
        '#4e79a7',
        '#f28e2b',
        '#e15759',
        '#76b7b2',
        '#59a14f',
        '#edc948',
        '#b07aa1',
        '#ff9da7',
        '#9c755f',
        '#bab0ab',
    ];

    const buildColors = (count) => Array.from({ length: count }, (_, index) => palette[index % palette.length]);

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

    const createChart = (canvasId, config) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            return;
        }

        return new Chart(canvas, config);
    }

    $.ajax({
        method: "GET",
        url: `${url}api/v1/address-chart`,
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        success: function (data) {
            const { rows } = data
            createChart('addressChart', {
                type: 'bar',
                data: {
                    labels: rows.map(item => item.addressline),
                    datasets: [{
                        label: 'Number of Customers per town',
                        data: rows.map(item => item.total),
                        backgroundColor: buildColors(rows.length),
                        borderColor: '#ffffff',
                        borderWidth: 1,

                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    indexAxis: 'y',
                },
            });
        },
        error: function (error) {
            console.log(error);
        }
    });

    $.ajax({
        type: "GET",
        url: `${url}api/v1/sales-chart`,
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        success: function (data) {
            const { rows } = data
            createChart('salesChart', {
                type: 'line',
                data: {
                    labels: rows.map(item => item.month),
                    datasets: [{
                        label: 'Monthly sales',
                        data: rows.map(item => item.total),
                        borderColor: '#4e79a7',
                        backgroundColor: 'rgba(78, 121, 167, 0.18)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                },
            });

        },
        error: function (error) {
            console.log(error);
        }
    });

    $.ajax({
        type: "GET",
        url: `${url}api/v1/items-chart`,
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        success: function (data) {
            const { rows } = data
            createChart('itemsChart', {
                type: 'pie',
                data: {
                    labels: rows.map(item => item.items),
                    datasets: [{
                        label: 'number of items sold',
                        data: rows.map(item => item.total),
                        backgroundColor: buildColors(rows.length),
                        borderColor: '#ffffff',
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                    }
                }


            });

        },
        error: function (error) {
            console.log(error);
        }
    });
    $("#home").load("header.html")
})