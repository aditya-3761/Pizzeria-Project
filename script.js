document.addEventListener('DOMContentLoaded', () => {
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartItemsList = document.querySelector('#cart-items');
    const cartTotalElement = document.querySelector('#cart-total');
    const cartPageButtonsContainer = document.querySelector('#cart-page-buttons');
    const paymentTotalElement = document.querySelector('#payment-total');
    const razorpayBtn = document.getElementById('razorpay-btn');
    const codBtn = document.getElementById('cod-btn');
    const orderHistoryList = document.querySelector('#order-history-list');
    const removeHistoryBtn = document.querySelector('#remove-history-btn');

    // Customization Modal elements
    const customizationModalOverlay = document.getElementById('customization-modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const customizationPizzaName = document.getElementById('customization-pizza-name');
    const customBasePriceInput = document.getElementById('custom-base-price');
    const customBaseImageInput = document.getElementById('custom-base-image');
    const customOriginalPizzaNameInput = document.getElementById('custom-original-pizza-name');
    const customPizzaCurrentPriceSpan = document.getElementById('custom-pizza-current-price');
    const addCustomizedPizzaToCartBtn = document.getElementById('add-customized-pizza-to-cart');
    const customizePizzaButtons = document.querySelectorAll('.customize-pizza-btn');

    const customizationOptions = document.querySelectorAll('.customization-form input[type="checkbox"], .customization-form input[type="radio"]');

    const CUSTOMIZATION_PRICES = {
        "size": {
            "Small": 0.00,
            "Medium": 3.00,
            "Large": 6.00
        },
        "veggies": {
            "Onions": 0.50,
            "Bell Peppers": 0.75,
            "Olives": 1.00,
            "Mushrooms": 1.00,
            "Tomatoes": 0.50
        },
        "spices": {
            "Chili Flakes": 0.25,
            "Oregano": 0.25
        },
        "cheese": {
            "Extra Cheese": 1.50
        },
        "ketchup": {
            "Extra Ketchup": 0.50
        },
        "leaves": {
            "Basil Leaves": 0.75
        }
    };


    // Initial Loads
    loadCart();
    loadPaymentPage();
    loadOrderHistory();

    // Add event listeners to "Add to Cart" buttons
    if (addButtons.length > 0) {
        addButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const pizzaCard = e.target.closest('.pizza-card');
                const pizzaName = pizzaCard.dataset.pizzaName;
                const pizzaPrice = parseFloat(pizzaCard.dataset.pizzaPrice);
                const quantity = parseInt(pizzaCard.querySelector('.quantity-input').value);
                const imageUrl = pizzaCard.dataset.pizzaImage;

                addToCart(pizzaName, pizzaPrice, quantity, imageUrl);
            });
        });
    }

    // Event Listeners for Dashboard (Customize Pizza buttons)
    if (customizePizzaButtons.length > 0) {
        customizePizzaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const pizzaCard = e.target.closest('.pizza-card');
                const originalPizzaName = pizzaCard.dataset.pizzaName;
                const basePrice = parseFloat(pizzaCard.dataset.pizzaPrice);
                const baseImage = pizzaCard.dataset.pizzaImage;
                
                openCustomizationModal(originalPizzaName, basePrice, baseImage);
            });
        });
    }

    // Event Listeners for Customization Modal
    if (customizationModalOverlay) {
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeCustomizationModal);
        customizationModalOverlay.addEventListener('click', (e) => {
            if (e.target === customizationModalOverlay) {
                closeCustomizationModal();
            }
        });
        customizationOptions.forEach(option => {
            option.addEventListener('change', updateCustomizationPrice);
        });
        if (addCustomizedPizzaToCartBtn) addCustomizedPizzaToCartBtn.addEventListener('click', addCustomizedPizzaToCart);
    }
    
    // Handle quantity changes on the dashboard page
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('plus')) {
            const input = e.target.previousElementSibling;
            input.value = parseInt(input.value) + 1;
        }
        if (e.target.classList.contains('minus')) {
            const input = e.target.nextElementSibling;
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
            }
        }
        const deleteButton = e.target.closest('.delete-item-btn');
        if (deleteButton) {
            const pizzaName = deleteButton.dataset.pizzaName;
            deleteFromCart(pizzaName);
        }
        
        // Handle quantity change from cart page
        if (e.target.classList.contains('cart-minus-btn')) {
            const pizzaName = e.target.dataset.pizzaName;
            updateCartQuantity(pizzaName, -1);
        }
        if (e.target.classList.contains('cart-plus-btn')) {
            const pizzaName = e.target.dataset.pizzaName;
            updateCartQuantity(pizzaName, 1);
        }
    });
    
    // Handle payment option clicks (Payment page specific)
    if (razorpayBtn) {
        razorpayBtn.addEventListener('click', () => {
            placeOrder('Razorpay');
        });
    }
    if (codBtn) {
        codBtn.addEventListener('click', () => {
            placeOrder('Cash on Delivery');
        });
    }

    // Handle form submissions for placing the order
    document.body.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const submitButton = form.querySelector('.form-submit-btn');
        const paymentMethod = submitButton.dataset.paymentMethod;

        placeOrder(paymentMethod);
    });
    
    // Admin Login Logic
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminModalOverlay = document.getElementById('admin-modal-overlay');
    const adminLoginForm = document.getElementById('admin-login-form');

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            adminModalOverlay.style.display = 'flex';
        });
    }

    if (adminModalOverlay) {
        adminModalOverlay.addEventListener('click', (e) => {
            if (e.target === adminModalOverlay || e.target.closest('.close-modal-btn')) {
                adminModalOverlay.style.display = 'none';
            }
        });
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            const ADMIN_PASSWORD = '6870';
            
            if (password === ADMIN_PASSWORD) {
                alert('Admin login successful!');
                window.location.href = 'admin.html';
            } else {
                alert('Invalid Password!');
            }
        });
    }

    // Handle "Remove History" button on orders.html
    if (removeHistoryBtn) {
        removeHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove all order history? This cannot be undone.')) {
                removeOrderHistory();
            }
        });
    }
    
    // Admin page navigation logic
    const adminNavLinks = document.querySelectorAll('.nav-link-admin');
    const adminContentSections = document.querySelectorAll('.admin-content-section');

    if (adminNavLinks.length > 0) {
        adminNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);

                adminContentSections.forEach(section => {
                    section.style.display = 'none';
                });

                document.getElementById(targetId).style.display = 'block';

                adminNavLinks.forEach(navLink => navLink.classList.remove('active'));
                e.target.classList.add('active');
                
                // Fetch data for the new section
                if (targetId === 'orders') {
                    loadOrders();
                } else if (targetId === 'inventory') {
                    loadInventory();
                }
            });
        });
    }
    
    // Initial load for admin page
    if (window.location.pathname.includes('admin.html')) {
        loadOrders();
    }

    // --- Core Cart & Order Functions ---

    function addToCart(name, price, quantity, imageUrl) {
        let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total = existingItem.quantity * price;
        } else {
            cart.push({
                name: name,
                price: price,
                quantity: quantity,
                total: price * quantity,
                image: imageUrl
            });
        }

        localStorage.setItem('pizzaCart', JSON.stringify(cart));
        alert(`${quantity} x ${name} added to cart!`);
    }

    function deleteFromCart(name) {
        let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        const updatedCart = cart.filter(item => item.name !== name);
        localStorage.setItem('pizzaCart', JSON.stringify(updatedCart));
        loadCart();
    }

    function updateCartQuantity(name, change) {
        let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        const item = cart.find(item => item.name === name);
    
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                deleteFromCart(name);
            } else {
                item.total = item.quantity * item.price;
                localStorage.setItem('pizzaCart', JSON.stringify(cart));
                loadCart();
            }
        }
    }

    function calculateTotal() {
        const cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        return cart.reduce((sum, item) => sum + item.total, 0);
    }

    function loadCart() {
        const cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        let total = 0;

        if (cartItemsList) {
            cartItemsList.innerHTML = '';
            if (cart.length === 0) {
                cartItemsList.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
            } else {
                cart.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="cart-item">
                            <img src="${item.image}" alt="${item.name} Pizza" class="cart-item-image">
                            <div class="cart-item-info">
                                <h4>${item.name}</h4>
                                <p>Price: $${item.price.toFixed(2)} each</p>
                            </div>
                            <div class="cart-item-actions">
                                <div class="quantity-selector">
                                    <button class="cart-minus-btn" data-pizza-name="${item.name}">-</button>
                                    <span class="cart-quantity">${item.quantity}</span>
                                    <button class="cart-plus-btn" data-pizza-name="${item.name}">+</button>
                                </div>
                                <div class="cart-item-price">$${item.total.toFixed(2)}</div>
                                <button class="delete-item-btn" data-pizza-name="${item.name}">Delete</button>
                            </div>
                        </div>
                    `;
                    cartItemsList.appendChild(li);
                    total += item.total;
                });
            }

            cartTotalElement.innerText = `Total: $${total.toFixed(2)}`;

            if (cartPageButtonsContainer) {
                cartPageButtonsContainer.innerHTML = '';
                const paymentButton = document.createElement('a');
                paymentButton.href = "payment.html";
                paymentButton.className = "btn btn-primary";
                paymentButton.innerText = "Proceed to Payment";
                
                const moreItemsButton = document.createElement('a');
                moreItemsButton.href = "dashboard.html";
                moreItemsButton.className = "btn btn-secondary";
                moreItemsButton.innerText = "Add More Items";

                cartPageButtonsContainer.appendChild(paymentButton);
                cartPageButtonsContainer.appendChild(moreItemsButton);
            }
        }
    }

    function loadPaymentPage() {
        if (paymentTotalElement) {
            const total = calculateTotal();
            paymentTotalElement.innerText = `$${total.toFixed(2)}`;
        }
    }

    function placeOrder(paymentMethod) {
        const cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
        const total = calculateTotal();

        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }
        
        // This is where we will send the order to the backend
        // For now, we'll use localStorage and a confirmation message
        const orders = JSON.parse(localStorage.getItem('pizzaOrders')) || [];
        const newOrder = {
            id: Date.now(),
            items: cart,
            total: total,
            date: new Date().toLocaleString(),
            paymentMethod: paymentMethod,
            status: "Order Received"
        };
        orders.push(newOrder);
        localStorage.setItem('pizzaOrders', JSON.stringify(orders));

        const confirmationMessage = document.createElement('div');
        confirmationMessage.className = 'confirmation-message';
        confirmationMessage.innerHTML = `
            <h2>Congrats!</h2>
            <p>Your order is confirmed. Enjoy your meal!</p>
        `;
        document.body.appendChild(confirmationMessage);
        
        localStorage.removeItem('pizzaCart');

        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 3000);
    }
    
    function loadOrders() {
        if (window.location.pathname.includes('admin.html')) {
            const ordersList = document.getElementById('orders-list');
            fetch('http://localhost:5000/api/orders')
                .then(res => res.json())
                .then(orders => {
                    ordersList.innerHTML = '';
                    if (orders.length === 0) {
                        ordersList.innerHTML = '<p class="empty-message">No orders received yet.</p>';
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
                            <p>Status: <span class="order-status">${order.status}</span></p>
                        `;
                        ordersList.appendChild(orderDiv);
                    });
                })
                .catch(err => {
                    console.error('Failed to load orders:', err);
                    ordersList.innerHTML = '<p>Could not load orders. Please check the server connection.</p>';
                });
        }
    }

    function loadOrderHistory() {
        const orders = JSON.parse(localStorage.getItem('pizzaOrders')) || [];

        if (orderHistoryList) {
            orderHistoryList.innerHTML = '';
            if (orders.length === 0) {
                orderHistoryList.innerHTML = '<p class="empty-message">No orders yet.</p>';
            } else {
                orders.forEach(order => {
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    
                    const orderHeader = document.createElement('div');
                    orderHeader.className = 'order-header';
                    orderHeader.innerHTML = `
                        <h4>Order #${order.id}</h4>
                        <p>Date: ${order.date}</p>
                    `;
                    orderItem.appendChild(orderHeader);

                    const orderDetails = document.createElement('div');
                    orderDetails.className = 'order-details';
                    
                    order.items.forEach(item => {
                        const itemDetail = document.createElement('div');
                        itemDetail.className = 'item-detail';
                        itemDetail.innerHTML = `
                            <img src="${item.image}" alt="${item.name}" class="item-image">
                            <p>${item.name} (x${item.quantity})</p>
                            <p>$${item.total.toFixed(2)}</p>
                        `;
                        orderDetails.appendChild(itemDetail);
                    });
                    
                    orderItem.appendChild(orderDetails);
                    
                    const orderFooter = document.createElement('div');
                    orderFooter.className = 'order-footer';
                    orderFooter.innerHTML = `
                        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                        <p>Status: ${order.status}</p>
                    `;
                    orderItem.appendChild(orderFooter);
                    
                    orderHistoryList.appendChild(orderItem);
                });
            }
        }
    }

    function removeOrderHistory() {
        localStorage.removeItem('pizzaOrders');
        loadOrderHistory();
        alert('Order history cleared!');
    }

    function loadInventory() {
        if (window.location.pathname.includes('admin.html')) {
            const inventoryTableBody = document.querySelector('#inventory-table tbody');
            fetch('http://localhost:5000/api/inventory')
                .then(res => res.json())
                .then(inventory => {
                    inventoryTableBody.innerHTML = '';
                    if (inventory.length === 0) {
                        inventoryTableBody.innerHTML = `<tr><td colspan="2">Inventory is empty. Please run the seeding script.</td></tr>`;
                        return;
                    }
                    inventory.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.pizzaName}</td>
                            <td>${item.quantity}</td>
                        `;
                        inventoryTableBody.appendChild(row);
                    });
                })
                .catch(err => {
                    console.error('Failed to fetch inventory:', err);
                    inventoryTableBody.innerHTML = `<tr><td colspan="2">Failed to load inventory. Please ensure the server is running.</td></tr>`;
                });
        }
    }
});