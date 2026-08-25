const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });

  try {
    const notificationJson = req.body;
    const statusResponse = await snap.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        console.log(`[SUCCESS] Pembayaran LUNAS untuk Order ID: ${orderId}`);
      }
    }

    return res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).send('Webhook Handler Error');
  }
}
