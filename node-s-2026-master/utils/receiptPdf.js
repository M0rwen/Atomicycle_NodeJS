const PDFDocument = require('pdfkit');

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `PHP ${amount.toFixed(2)}`;
};

const generateReceiptPdfBuffer = (transaction) => {
    return new Promise((resolve, reject) => {
        const document = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        document.on('data', (chunk) => chunks.push(chunk));
        document.on('error', reject);
        document.on('end', () => resolve(Buffer.concat(chunks)));

        const orderId = transaction.orderinfo_id;
        const customerName = transaction.Customer
            ? `${transaction.Customer.fname || ''} ${transaction.Customer.lname || ''}`.trim()
            : 'Customer';
        const email = transaction.Customer?.User?.email || '';
        const lines = transaction.lines || [];
        const subtotal = lines.reduce((sum, line) => {
            const price = Number(line.Item?.sell_price || 0);
            return sum + price * Number(line.quantity || 0);
        }, 0);
        const shipping = Number(transaction.shipping || 0);
        const total = subtotal + shipping;

        document.fontSize(20).text('Atomicycle Receipt', { align: 'center' });
        document.moveDown(1);
        document.fontSize(11).text(`Order ID: ${orderId}`);
        document.text(`Customer: ${customerName}`);
        if (email) {
            document.text(`Email: ${email}`);
        }
        document.text(`Placed: ${new Date(transaction.date_placed).toLocaleString()}`);
        document.text(`Shipped: ${transaction.date_shipped ? new Date(transaction.date_shipped).toLocaleString() : 'Pending'}`);
        document.text(`Shipping: ${formatCurrency(shipping)}`);
        document.moveDown(1);

        document.fontSize(12).text('Order Details', { underline: true });
        document.moveDown(0.5);

        lines.forEach((line) => {
            const itemName = line.Item?.description || `Item ${line.item_id}`;
            const price = Number(line.Item?.sell_price || 0);
            const lineTotal = price * Number(line.quantity || 0);
            document.text(`${itemName} x ${line.quantity} - ${formatCurrency(lineTotal)}`);
        });

        document.moveDown(1);
        document.fontSize(12).text(`Subtotal: ${formatCurrency(subtotal)}`);
        document.text(`Shipping: ${formatCurrency(shipping)}`);
        document.text(`Total: ${formatCurrency(total)}`);

        document.end();
    });
};

module.exports = {
    generateReceiptPdfBuffer,
};