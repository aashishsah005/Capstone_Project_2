const Payment = {
    async handleCheckout(cart, saveCart, updateCartCount) {
        if (!cart || cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        console.log("Initiating checkout for amount:", total);

        try {
            const order = await window.API.createOrder(total);
            console.log("Razorpay Order Created:", order);

            const options = {
                key: "rzp_test_SUmJQoNa97z19R", // User's test key
                amount: order.amount,
                currency: order.currency,
                name: "QuickDeals",
                description: "Checkout Payment",
                order_id: order.id,
                handler: async function (response) {
                    console.log("Razorpay Payment Success Response:", response);
                    try {
                        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
                        const total = subtotal + (subtotal * 0.18);
                        const userId = window.Auth.getUser()?.id;

                        const result = await window.API.verifyPayment({
                            ...response,
                            items: cart,
                            amount: total,
                            userId: userId
                        });
                        console.log("Payment Verification Result:", result);
                        if (result.success) {
                            alert("Payment successful! Order ID: " + response.razorpay_order_id);

                            // Save order to history
                            const newOrder = {
                                id: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                date: new Date().toLocaleString(),
                                items: [...cart], // Clone cart items
                                total: total
                            };
                            const orders = JSON.parse(localStorage.getItem('orders')) || [];
                            orders.unshift(newOrder); // Newest first
                            localStorage.setItem('orders', JSON.stringify(orders));

                            // Clear the local cart
                            if (Array.isArray(cart)) {
                                cart.length = 0; // Empty the array by reference
                            }
                            if (typeof saveCart === 'function') saveCart();
                            if (typeof updateCartCount === 'function') updateCartCount();

                            // Redirect based on current page
                            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                                window.location.hash = '#orders';
                                // Fallback to page redirect if hash doesn't work (since we removed orders from SPA)
                                setTimeout(() => {
                                    if (window.location.hash === '#orders') window.location.href = 'orders.html';
                                }, 500);
                            } else {
                                window.location.href = 'orders.html';
                            }
                        } else {
                            alert("Payment verification failed: " + result.message);
                        }
                    } catch (error) {
                        console.error("Verification error:", error);
                        alert("Error verifying payment.");
                    }
                },
                prefill: {
                    name: window.Auth.getUser()?.username || "",
                    email: window.Auth.getUser()?.email || "",
                },
                theme: {
                    color: "#8b5cf6",
                },
                modal: {
                    ondismiss: function () {
                        console.log("Checkout modal closed by user");
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Checkout error details:", error);
            alert("Failed to initiate checkout. Please try again. \nError: " + error.message);
        }
    }
};

window.Payment = Payment;
