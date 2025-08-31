const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Additional settings for better deliverability
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Function to send order confirmation email
const sendOrderConfirmation = async (orderData) => {
  try {
    console.log('Sending order confirmation email for order:', orderData.id);
    console.log('Customer email:', orderData.customer_email);
    console.log('Complete order data:', JSON.stringify(orderData, null, 2));
    
    const {
      customer_email,
      customer_name,
      id: orderId,
      items,
      final_total,
      delivery_address,
      order_type,
      pickup_time
    } = orderData;
    
    // Ensure total is a number
    const total = parseFloat(final_total || 0);
    
    // Parse delivery address if it exists
    let deliveryInfo = {};
    if (delivery_address) {
      try {
        // Try to parse as JSON first
        deliveryInfo = typeof delivery_address === 'string' ? JSON.parse(delivery_address) : delivery_address;
      } catch (e) {
        // If not JSON, treat as plain string address
        console.log('Delivery address is plain string:', delivery_address);
        deliveryInfo = { address: delivery_address };
      }
    }
    
    // Create items list for email
    console.log('Items data received:', items);
    console.log('Items type:', typeof items);
    
    // Handle items parsing - PostgreSQL json_agg might return string or null
    let parsedItems = items;
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        console.error('Error parsing items JSON:', e);
        parsedItems = [];
      }
    }
    
    // Ensure items is an array and not null
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      console.error('Items is not a valid array:', parsedItems);
      parsedItems = [{ menu_item_name: 'Unknown Item', quantity: 1, price: 0 }];
    }
    
    const itemsList = parsedItems.map(item => 
      `• ${item.menu_item_name || 'Unknown Item'} x${item.quantity || 1} - €${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
    ).join('\n');
    
    console.log('Generated items list:', itemsList);
    
    // Build delivery/pickup information
    let addressSection = '';
    if (order_type === 'delivery' && deliveryInfo.fullName) {
      addressSection = `
Delivery Address:
${deliveryInfo.fullName}
${deliveryInfo.street} ${deliveryInfo.houseNumber || ''}
${deliveryInfo.zipCode} ${deliveryInfo.city}
Phone: ${deliveryInfo.phone}
Email: ${deliveryInfo.email || customer_email}

Your order will be delivered soon.`;
    } else if (order_type === 'pickup') {
      const pickupTimeFormatted = pickup_time ? new Date(pickup_time).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'To be confirmed';
      
      addressSection = `
Order Type: Pickup
Pickup Time: ${pickupTimeFormatted}
Your order will be ready for pickup at our restaurant at the specified time.`;
    } else {
      addressSection = `
Order Type: ${order_type || 'Unknown'}
We will contact you with further details.`;
    }

    const emailContent = `
Dear ${customer_name},

Thank you for your order! We have received your order and it is being processed.

Order Details:
Order ID: ${orderId}

Items Ordered:
${itemsList}${addressSection}

Total Amount: €${total.toFixed(2)}

Thank you for choosing our restaurant!

Best regards,
Bella Vista Restaurant Team
    `;

    const mailOptions = {
      from: `"Bella Vista Restaurant" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `Order Confirmation - Order #${orderId}`,
      text: emailContent,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${emailContent}</pre>
      </div>`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendOrderConfirmation,
};