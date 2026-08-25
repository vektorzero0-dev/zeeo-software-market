export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, productName, price } = req.body;

  if (!price || !productName) {
    return res.status(400).json({ error: 'Data produk tidak lengkap' });
  }

  // Ambil Server Key MURNI dari Vercel Environment Variables (Aman & Tidak Ter-expose)
  const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
  const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!SERVER_KEY) {
    return res.status(500).json({ error: 'Server Key Midtrans belum dikonfigurasi di Vercel' });
  }

  const endpoint = IS_PRODUCTION
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const authHeader = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');
  const orderId = 'ZEEO-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Number(price)
    },
    item_details: [
      {
        id: 'PROD-' + Date.now(),
        price: Number(price),
        quantity: 1,
        name: productName.substring(0, 50)
      }
    ],
    customer_details: {
      first_name: name || 'Pelanggan Zeeo',
      email: email || 'customer@zeeo.com',
      phone: phone || '08123456789'
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data.token) {
      return res.status(200).json({ token: data.token, redirect_url: data.redirect_url });
    } else {
      console.error('Midtrans API Error:', data);
      return res.status(500).json({ error: data.error_messages ? data.error_messages.join(', ') : 'Gagal membuat transaksi Midtrans' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan koneksi ke server Midtrans' });
  }
}
