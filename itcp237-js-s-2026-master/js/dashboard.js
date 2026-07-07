$(document).ready(function () {
    
    const url = 'http://localhost:4000/';
    const palette = [
        '#2a9d8f',
        '#34a853',
        '#43aa8b',
        '#4caf50',
        '#66bb6a',
        '#8bc34a',
        '#a5d6a7',
        '#26a69a',
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
        return token.startsWith('"') ? JSON.parse(token) : token;
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
            const rows = data.rows || [];
            createChart('addressChart', {
                type: 'pie',
                data: {
                    labels: rows.map(item => item.addressline || 'Unknown'),
                    datasets: [{
                        label: 'Orders by Location',
                        data: rows.map(item => Number(item.total || 0)),
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
                            position: 'bottom',
                        },
                    },
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
            const rows = data.rows || [];
            createChart('salesChart', {
                type: 'line',
                data: {
                    labels: rows.map(item => item.month || 'Unknown'),
                    datasets: [{
                        label: 'Total Sales (PHP)',
                        data: rows.map(item => Number(item.total || 0)),
                        borderColor: '#2a9d8f',
                        backgroundColor: 'rgba(42, 157, 143, 0.18)',
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
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return '₱' + Number(value).toFixed(0);
                                },
                            },
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
            const rows = data.rows || [];
            createChart('itemsChart', {
                type: 'bar',
                data: {
                    labels: rows.map(item => item.items || 'Unknown'),
                    datasets: [{
                        label: 'Quantity Sold',
                        data: rows.map(item => Number(item.total || 0)),
                        backgroundColor: buildColors(rows.length),
                        borderColor: '#2a9d8f',
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0,
                            },
                        },
                        x: {
                            ticks: {
                                autoSkip: false,
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                }
            });

        },
        error: function (error) {
            console.log(error);
        }
    });
    $("#home").load("header.html")
})
