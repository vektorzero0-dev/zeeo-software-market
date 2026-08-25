const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { appId, appName, appPrice, customerEmail } = req.body;

  if (!appId || !appPrice) {
    return res.status(400).json({ message: 'Parameter tidak lengkap.' });
  }

  // Inisialisasi Midtrans Snap Client
  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY
  });

  const orderId = `ZEEO-${appId}-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Number(appPrice)
    },
    item_details: [
      {
        id: appId,
        price: Number(appPrice),
        quantity: 1,
        name: appName.substring(0, 50)
      }
    ],
    customer_details: {
      email: customerEmail || 'customer@zeeo.market'
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return res.status(200).json({ token: transaction.token, orderId: orderId });
  } catch (error) {
    console.error('Midtrans Error:', error);
    return res.status(500).json({ message: 'Gagal membuat transaksi.', error: error.message });
  }
}
