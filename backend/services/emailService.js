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

// Function to send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    console.log('Sending password reset email to:', email);
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailContent = `
Dear ${userName},

We received a request to reset your password for your Bella Vista Restaurant account.

To reset your password, please click the link below:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
Bella Vista Restaurant Team
    `;

    const mailOptions = {
      from: `"Bella Vista Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Bella Vista Restaurant',
      text: emailContent,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Dear ${userName},</p>
        <p>We received a request to reset your password for your Bella Vista Restaurant account.</p>
        <p>To reset your password, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Best regards,<br>Bella Vista Restaurant Team</p>
      </div>`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Function to send order status change notification
const sendOrderStatusUpdate = async (orderData, newStatus) => {
  try {
    console.log('Sending order status update email for order:', orderData.id);
    console.log('New status:', newStatus);
    
    const {
      customer_email,
      customer_name,
      id: orderId,
      final_total,
      order_type
    } = orderData;
    
    // Status-specific messages
    const statusMessages = {
      confirmed: {
        subject: 'Order Confirmed',
        message: 'Great news! Your order has been confirmed and we are preparing it for you.',
        color: '#4caf50'
      },
      preparing: {
        subject: 'Order Being Prepared',
        message: 'Your order is now being prepared by our kitchen team.',
        color: '#ff9800'
      },
      ready: {
        subject: 'Order Ready',
        message: order_type === 'delivery' 
          ? 'Your order is ready and will be delivered soon.'
          : 'Your order is ready and you can pick it up.',
        color: '#2196f3'
      },
      delivered: {
        subject: 'Order Delivered',
        message: 'Your order has been successfully delivered. We hope you enjoy your meal!',
        color: '#4caf50'
      },
      cancelled: {
        subject: 'Order Cancelled',
        message: 'Unfortunately, your order has been cancelled. If you have any questions, please contact us.',
        color: '#f44336'
      }
    };
    
    const statusInfo = statusMessages[newStatus] || {
      subject: 'Order Status Update',
      message: `Your order status has been updated to: ${newStatus}`,
      color: '#666'
    };
    
    const total = parseFloat(final_total || 0);
    
    const emailContent = `
Dear ${customer_name},

${statusInfo.message}

Order Details:
Order ID: ${orderId}
Total Amount: €${total.toFixed(2)}
Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

Thank you for choosing Bella Vista Restaurant!

Best regards,
Bella Vista Restaurant Team
    `;

    const mailOptions = {
      from: `"Bella Vista Restaurant" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `${statusInfo.subject} - Order #${orderId}`,
      text: emailContent,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusInfo.color}; text-align: center;">${statusInfo.subject}</h2>
        <p>Dear ${customer_name},</p>
        <p>${statusInfo.message}</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> €${total.toFixed(2)}</p>
          <p><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
        </div>
        <p>Thank you for choosing Bella Vista Restaurant!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Best regards,<br>Bella Vista Restaurant Team</p>
      </div>`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order status update email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order status update email:', error);
    throw error;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendPasswordResetEmail,
  sendOrderStatusUpdate,
};