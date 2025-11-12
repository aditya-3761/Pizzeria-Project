document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const paymentsTableBody = document.querySelector('#payments-table tbody');
    const ordersLink = document.querySelector('a[href="#orders"]');
    const inventoryLink = document.querySelector('a[href="#inventory"]');
    const paymentsLink = document.querySelector('a[href="#payments"]');
    
    // Admin Page Navigation
    function showSection(sectionId) {
        document.querySelectorAll('.admin-content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
    }
    
    if (ordersLink) {
        ordersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('orders');
            ordersLink.classList.add('active');
            if (inventoryLink) inventoryLink.classList.remove('active');
            if (paymentsLink) paymentsLink.classList.remove('active');
            loadOrders();
        });
    }

    if (inventoryLink) {
        inventoryLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('inventory');
            if (inventoryLink) inventoryLink.classList.add('active');
            if (ordersLink) ordersLink.classList.remove('active');
            if (paymentsLink) paymentsLink.classList.remove('active');
            loadInventory();
        });
    }

    if (paymentsLink) {
        paymentsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('payments');
            if (paymentsLink) paymentsLink.classList.add('active');
            if (ordersLink) ordersLink.classList.remove('active');
            if (inventoryLink) inventoryLink.classList.remove('active');
            loadPayments();
        });
    }

    // Handle order status updates
    document.body.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            updateOrderStatus(orderId, newStatus);
        }
    });

    // Initial load: show orders by default
    showSection('orders');
    if (ordersLink) ordersLink.classList.add('active');
    loadOrders();
    
    // Fetch and display orders
    async function loadOrders() {
        try {
            const response = await fetch('http://localhost:5000/api/orders');
            const orders = await response.json();
            if (ordersList) ordersList.innerHTML = '';
            if (orders.length === 0) {
                if (ordersList) ordersList.innerHTML = '<p class="empty-message">No orders received yet.</p>';
                return;
            }

            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-card';
                orderDiv.innerHTML = `
                    <h3>Order #${order.orderId}</h3>
                    <p>Total: $${order.total.toFixed(2)}</p>
                    <p>Date: ${order.date}</p>
                    <p>Method: ${order.paymentMethod}</p>
                    <p>Status: 
                        <select class="status-select" data-order-id="${order.orderId}">
                            <option value="Order Received" ${order.status === 'Order Received' ? 'selected' : ''}>Order Received</option>
                            <option value="In the Kitchen" ${order.status === 'In the Kitchen' ? 'selected' : ''}>In the Kitchen</option>
                            <option value="Sent for Delivery" ${order.status === 'Sent for Delivery' ? 'selected' : ''}>Sent for Delivery</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </p>
                `;
                if (ordersList) ordersList.appendChild(orderDiv);
            });
        } catch (error) {
            console.error('Failed to load orders:', error);
            if (ordersList) ordersList.innerHTML = '<p>Could not load orders. Please check the server connection.</p>';
        }
    }

    // Fetch and display inventory
    async function loadInventory() {
        try {
            const response = await fetch('http://localhost:5000/api/inventory');
            const inventory = await response.json();
            if (inventoryTableBody) inventoryTableBody.innerHTML = '';
            if (inventory.length === 0) {
                if (inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="2">Inventory is empty. Please run the seeding script.</td></tr>`;
                return;
            }
            inventory.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.pizzaName}</td>
                    <td>${item.quantity}</td>
                `;
                if (inventoryTableBody) inventoryTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            if (inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="2">Failed to load inventory. Please ensure the server is running.</td></tr>`;
        }
    }

    // NEW: Fetch and display payments
    async function loadPayments() {
        try {
            const response = await fetch('http://localhost:5000/api/payments');
            const payments = await response.json();
            if (paymentsTableBody) paymentsTableBody.innerHTML = '';
            if (payments.length === 0) {
                if (paymentsTableBody) paymentsTableBody.innerHTML = `<tr><td colspan="3">No payments received yet.</td></tr>`;
                return;
            }
            payments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.orderId}</td>
                    <td>$${payment.total.toFixed(2)}</td>
                    <td>${payment.paymentMethod}</td>
                    <td>${new Date(payment.date).toLocaleString()}</td>
                `;
                if (paymentsTableBody) paymentsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            if (paymentsTableBody) paymentsTableBody.innerHTML = `<tr><td colspan="3">Failed to load payments. Please ensure the server is running.</td></tr>`;
        }
    }

    // Function to update order status on the backend
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert(`Order ${orderId} status updated to ${newStatus}`);
                loadOrders(); // Refresh the orders list to show the change
            } else {
                const errorData = await response.json();
                alert(`Error updating order status: ${errorData.msg}`);
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Could not update order status. Please check server.');
        }
    }
});